document.addEventListener("DOMContentLoaded", () => {

    const proveedores = window.sigmaferProveedores || [];
    const productos = window.sigmaferProductos || [];

    const consecutivoCO = window.consecutivoCO || "CO-00001";
    const consecutivoEN = window.consecutivoEN || "EN-00001";
    const consecutivoOC = window.consecutivoOC || "OC-00001";

    const tipoCompraBtn = document.getElementById("btn-tipo-compra");
    const tipoAjusteBtn = document.getElementById("btn-tipo-ajuste");
    const tipoEntradaInput = document.getElementById("tipo_entrada");
    const seccionCompra = document.getElementById("seccion-compra");
    const seccionAjuste = document.getElementById("seccion-ajuste");
    const labelConsecutivo = document.getElementById("label-consecutivo-header");
    const inputNumeroDoc = document.getElementById("numero_documento");

    const tablaProductos = document.getElementById("tabla-productos-body");
    const btnAgregarProducto = document.getElementById("btn-agregar-producto");

    const subtotalDisplay = document.getElementById("subtotal-display");
    const ivaDisplay = document.getElementById("iva-display");
    const totalDisplay = document.getElementById("total-display");

    const formEntrada = document.getElementById("form-entrada");
    const modalResumen = document.getElementById("modal-resumen-entrada");
    const btnModalCancelar = document.getElementById("btn-modal-cancelar");
    const btnModalConfirmar = document.getElementById("btn-modal-confirmar");
    let entradaConfirmada = false;

    // Campos de Proveedor
    const proveedorBusqueda = document.getElementById("proveedor_busqueda");
    const proveedorId = document.getElementById("proveedor_id");
    const proveedorResultados = document.getElementById("proveedores-resultados");
    const nitProveedor = document.getElementById("nit_proveedor");
    const dirProveedor = document.getElementById("direccion_proveedor");
    const telProveedor = document.getElementById("telefono_proveedor");
    const correoProveedor = document.getElementById("correo_proveedor");
    const contactoProveedor = document.getElementById("contacto_proveedor");

    /* =========================================================
       1. CAMBIO DE TIPO DE ENTRADA (COMPRA vs AJUSTE)
       ========================================================= */

    function cambiarTipoEntrada(tipo) {
        if (tipo === "COMPRA") {
            tipoCompraBtn.classList.add("active");
            tipoAjusteBtn.classList.remove("active");
            tipoEntradaInput.value = "COMPRA";
            seccionCompra.style.display = "block";
            seccionAjuste.style.display = "none";
            labelConsecutivo.textContent = consecutivoCO;
            inputNumeroDoc.value = consecutivoCO;
        } else {
            tipoAjusteBtn.classList.add("active");
            tipoCompraBtn.classList.remove("active");
            tipoEntradaInput.value = "AJUSTE";
            seccionCompra.style.display = "none";
            seccionAjuste.style.display = "block";
            labelConsecutivo.textContent = consecutivoEN;
            inputNumeroDoc.value = consecutivoEN;
        }
    }

    if (tipoCompraBtn) {
        tipoCompraBtn.addEventListener("click", () => cambiarTipoEntrada("COMPRA"));
    }
    if (tipoAjusteBtn) {
        tipoAjusteBtn.addEventListener("click", () => cambiarTipoEntrada("AJUSTE"));
    }

    /* =========================================================
       2. AUTOCOMPLETADO DE PROVEEDORES
       ========================================================= */

    function normalizarTexto(txt) {
        return (txt || "").toString().toLowerCase().trim();
    }

    function seleccionarProveedor(p) {
        if (proveedorId) proveedorId.value = p.id || "";
        if (proveedorBusqueda) proveedorBusqueda.value = p.nombre || "";
        if (nitProveedor) nitProveedor.value = p.nit || "";
        if (dirProveedor) dirProveedor.value = p.direccion || "";
        if (telProveedor) telProveedor.value = p.telefono || "";
        if (correoProveedor) correoProveedor.value = p.correo || "";
        if (contactoProveedor) contactoProveedor.value = p.nombre_contacto || "";

        if (proveedorResultados) {
            proveedorResultados.innerHTML = "";
            proveedorResultados.classList.remove("active");
        }
    }

    function buscarProveedores(texto) {
        if (!proveedorResultados) return;
        const q = normalizarTexto(texto);
        if (!q) {
            proveedorResultados.innerHTML = "";
            proveedorResultados.classList.remove("active");
            return;
        }

        const matches = proveedores.filter(p => {
            return normalizarTexto(p.nombre).includes(q) || normalizarTexto(p.nit).includes(q);
        });

        proveedorResultados.innerHTML = "";
        if (matches.length === 0) {
            proveedorResultados.innerHTML = `<div class="autocomplete-item"><strong>No se encontraron proveedores</strong><span>Intenta con otro nombre o NIT</span></div>`;
            proveedorResultados.classList.add("active");
            return;
        }

        matches.forEach(p => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.innerHTML = `<strong>${p.nombre}</strong><span>NIT: ${p.nit || '-'} · ${p.nombre_contacto || ''}</span>`;
            item.addEventListener("click", () => seleccionarProveedor(p));
            proveedorResultados.appendChild(item);
        });

        proveedorResultados.classList.add("active");
    }

    if (proveedorBusqueda) {
        proveedorBusqueda.addEventListener("input", () => {
            buscarProveedores(proveedorBusqueda.value);
        });
        proveedorBusqueda.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const first = proveedorResultados.querySelector(".autocomplete-item");
                if (first) first.click();
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".autocomplete-container")) {
            document.querySelectorAll(".autocomplete-results").forEach(el => el.classList.remove("active"));
        }
    });

    /* =========================================================
       3. TABLA DINÁMICA DE PRODUCTOS & NAVEGACIÓN CON ENTER
       ========================================================= */

    function formatearMoneda(val) {
        const num = parseFloat(val) || 0;
        return "$ " + num.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function calcularFila(row) {
        const cantInput = row.querySelector(".producto-cantidad");
        const precioInput = row.querySelector(".producto-precio");
        const ivaSelect = row.querySelector(".producto-iva");
        const subtotalInput = row.querySelector(".producto-subtotal");
        const idHidden = row.querySelector(".producto-id");
        const nombreInput = row.querySelector(".producto-nombre");
        const codigoInput = row.querySelector(".producto-codigo");

        const hasProduct = (idHidden && idHidden.value) || (nombreInput && nombreInput.value.trim() !== "") || (codigoInput && codigoInput.value.trim() !== "");

        const cant = parseFloat(cantInput ? cantInput.value : 0) || 0;
        const precio = parseFloat(precioInput ? precioInput.value : 0) || 0;
        const ivaPct = parseFloat(ivaSelect ? ivaSelect.value : 19) || 0;

        const subtotal = hasProduct ? (cant * precio) : 0;
        const iva = hasProduct ? (subtotal * (ivaPct / 100)) : 0;
        const total = hasProduct ? (subtotal + iva) : 0;

        if (subtotalInput) {
            subtotalInput.value = formatearMoneda(subtotal);
            subtotalInput.setAttribute("data-subtotal", subtotal);
            subtotalInput.setAttribute("data-iva", iva);
            subtotalInput.setAttribute("data-total", total);
        }

        calcularTotalesGenerales();
    }

    function calcularTotalesGenerales() {
        let subtotalTotal = 0;
        let ivaTotal = 0;
        let granTotal = 0;

        document.querySelectorAll(".producto-row").forEach(row => {
            const subInput = row.querySelector(".producto-subtotal");
            if (subInput) {
                subtotalTotal += parseFloat(subInput.getAttribute("data-subtotal")) || 0;
                ivaTotal += parseFloat(subInput.getAttribute("data-iva")) || 0;
                granTotal += parseFloat(subInput.getAttribute("data-total")) || 0;
            }
        });

        if (subtotalDisplay) subtotalDisplay.textContent = formatearMoneda(subtotalTotal);
        if (ivaDisplay) ivaDisplay.textContent = formatearMoneda(ivaTotal);
        if (totalDisplay) totalDisplay.textContent = formatearMoneda(granTotal);
    }

    function vincularFilaProducto(row) {
        const codigoInput = row.querySelector(".producto-codigo");
        const nombreInput = row.querySelector(".producto-nombre");
        const idHidden = row.querySelector(".producto-id");
        const resultsBox = row.querySelector(".productos-resultados");
        const cantInput = row.querySelector(".producto-cantidad");
        const precioInput = row.querySelector(".producto-precio");
        const ivaSelect = row.querySelector(".producto-iva");
        const deleteBtn = row.querySelector(".btn-delete-product");

        function setProducto(prod) {
            if (idHidden) idHidden.value = prod.id || "";
            if (codigoInput) codigoInput.value = prod.codigo || "";
            if (nombreInput) nombreInput.value = prod.nombre || "";
            if (precioInput && (!precioInput.value || parseFloat(precioInput.value) === 0)) {
                precioInput.value = prod.precio || 0;
            }
            if (resultsBox) {
                resultsBox.innerHTML = "";
                resultsBox.classList.remove("active");
            }
            calcularFila(row);
        }

        function buscarProds(texto) {
            if (!resultsBox) return;
            const q = normalizarTexto(texto);
            if (!q) {
                resultsBox.innerHTML = "";
                resultsBox.classList.remove("active");
                return;
            }

            const matches = productos.filter(p => {
                return normalizarTexto(p.nombre).includes(q) || normalizarTexto(p.codigo).includes(q);
            });

            resultsBox.innerHTML = "";
            if (matches.length === 0) {
                resultsBox.innerHTML = `<div class="autocomplete-item"><strong>No se encontraron productos</strong></div>`;
                resultsBox.classList.add("active");
                return;
            }

            matches.slice(0, 8).forEach(p => {
                const item = document.createElement("div");
                item.className = "autocomplete-item";
                item.innerHTML = `<strong>${p.nombre}</strong><span>Código: ${p.codigo} · Stock: ${p.stock}</span>`;
                item.addEventListener("click", () => setProducto(p));
                resultsBox.appendChild(item);
            });

            resultsBox.classList.add("active");
        }

        if (nombreInput) {
            nombreInput.addEventListener("input", () => {
                buscarProds(nombreInput.value);
                calcularFila(row);
            });
        }

        if (codigoInput) {
            codigoInput.addEventListener("input", () => {
                const cod = normalizarTexto(codigoInput.value);
                const exact = productos.find(p => normalizarTexto(p.codigo) === cod);
                if (exact) {
                    setProducto(exact);
                } else {
                    buscarProds(codigoInput.value);
                }
                calcularFila(row);
            });
        }

        if (cantInput) cantInput.addEventListener("input", () => calcularFila(row));
        if (precioInput) precioInput.addEventListener("input", () => calcularFila(row));
        if (ivaSelect) ivaSelect.addEventListener("change", () => calcularFila(row));

        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                const totalFilas = document.querySelectorAll(".producto-row").length;
                if (totalFilas > 1) {
                    row.remove();
                    calcularTotalesGenerales();
                } else {
                    // Limpiar fila única
                    if (idHidden) idHidden.value = "";
                    if (codigoInput) codigoInput.value = "";
                    if (nombreInput) nombreInput.value = "";
                    if (cantInput) cantInput.value = "1";
                    if (precioInput) precioInput.value = "";
                    calcularFila(row);
                }
            });
        }

        // =====================================================
        // MANEJO DE TECLA ENTER EN LOS CAMPOS DE LA FILA
        // =====================================================
        const camposFila = [codigoInput, nombreInput, cantInput, precioInput, ivaSelect];

        camposFila.forEach((campo, index) => {
            if (!campo) return;
            campo.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();

                    // Si el dropdown de autocompletado está visible con resultados
                    if (resultsBox && resultsBox.classList.contains("active")) {
                        const firstItem = resultsBox.querySelector(".autocomplete-item");
                        if (firstItem) {
                            firstItem.click();
                            // Pasar al siguiente campo (cantidad)
                            if (cantInput) cantInput.focus();
                            return;
                        }
                    }

                    // Si no es el último campo de la fila, pasar al siguiente
                    if (index < camposFila.length - 1) {
                        const nextField = camposFila[index + 1];
                        if (nextField) nextField.focus();
                    } else {
                        // Es el último campo de la fila (iva)
                        const siguienteFila = row.nextElementSibling;
                        if (siguienteFila && siguienteFila.classList.contains("producto-row")) {
                            const primerInput = siguienteFila.querySelector(".producto-codigo") || siguienteFila.querySelector(".producto-nombre");
                            if (primerInput) primerInput.focus();
                        } else {
                            // Estamos en la última fila existente -> Crear automáticamente una nueva línea
                            const nuevaFila = agregarFilaProducto();
                            if (nuevaFila) {
                                const primerInput = nuevaFila.querySelector(".producto-codigo");
                                if (primerInput) primerInput.focus();
                            }
                        }
                    }
                }
            });
        });

        calcularFila(row);
    }

    function agregarFilaProducto() {
        if (!tablaProductos) return null;
        const tr = document.createElement("tr");
        tr.className = "producto-row";
        tr.innerHTML = `
            <td>
                <input type="text" name="codigo[]" class="producto-codigo" placeholder="Código" autocomplete="off">
            </td>
            <td>
                <div class="autocomplete-container">
                    <input type="text" name="producto_nombre[]" class="producto-nombre" placeholder="Buscar producto..." autocomplete="off">
                    <input type="hidden" name="producto_id[]" class="producto-id">
                    <div class="autocomplete-results productos-resultados"></div>
                </div>
            </td>
            <td>
                <input type="number" name="cantidad[]" class="producto-cantidad" min="1" step="1" value="1">
            </td>
            <td>
                <input type="number" name="valor_unitario[]" class="producto-precio" min="0" step="0.01" placeholder="0.00">
            </td>
            <td>
                <select name="iva_porcentaje[]" class="producto-iva">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="19" selected>19%</option>
                </select>
            </td>
            <td>
                <input type="text" name="subtotal[]" class="producto-subtotal" value="$ 0,00" readonly>
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-delete-product" title="Eliminar línea">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tablaProductos.appendChild(tr);
        vincularFilaProducto(tr);
        return tr;
    }

    if (btnAgregarProducto) {
        btnAgregarProducto.addEventListener("click", () => {
            const nueva = agregarFilaProducto();
            if (nueva) {
                const inp = nueva.querySelector(".producto-codigo");
                if (inp) inp.focus();
            }
        });
    }

    // Inicializar filas existentes
    document.querySelectorAll(".producto-row").forEach(row => vincularFilaProducto(row));

    /* =========================================================
       4. MODAL DE RESUMEN Y ENVÍO
       ========================================================= */

    function abrirModalResumen() {
        if (!modalResumen) return;

        const tipo = tipoEntradaInput.value;
        const modalNum = document.getElementById("modal-numero-doc");
        const modalTipo = document.getElementById("modal-tipo-entrada");
        const modalInfo = document.getElementById("modal-info-principal");
        const modalSecundaria = document.getElementById("modal-info-secundaria");

        if (modalNum) modalNum.textContent = inputNumeroDoc.value;
        if (modalTipo) modalTipo.textContent = tipo === "COMPRA" ? "Compra (Orden de Compra)" : "Ajuste de Inventario";

        if (tipo === "COMPRA") {
            const pNombre = proveedorBusqueda ? proveedorBusqueda.value : "-";
            const numFact = document.getElementById("numero_factura_proveedor");
            const numOC = document.getElementById("numero_orden_compra");
            if (modalInfo) modalInfo.innerHTML = `<span>Proveedor:</span><strong>${pNombre || 'No seleccionado'}</strong>`;
            if (modalSecundaria) modalSecundaria.innerHTML = `<span>Factura / OC:</span><strong>Fact: ${numFact ? numFact.value || '-' : '-'} | OC: ${numOC ? numOC.value || '-' : '-'}</strong>`;
        } else {
            const obsAjuste = document.getElementById("observaciones_ajuste");
            const obsTexto = obsAjuste ? obsAjuste.value.trim() : "";
            if (modalInfo) modalInfo.innerHTML = `<span>Razón / Justificación:</span><strong>${obsTexto || 'Ajuste de Saldo'}</strong>`;
            if (modalSecundaria) modalSecundaria.innerHTML = `<span>Tipo:</span><strong>Entrada por Ajuste Interno</strong>`;
        }

        // Tabla modal: incluir solo filas que contengan producto
        const tbodyItems = document.getElementById("modal-tabla-items");
        if (tbodyItems) {
            tbodyItems.innerHTML = "";
            document.querySelectorAll(".producto-row").forEach(row => {
                const idHidden = row.querySelector(".producto-id");
                const nombreInput = row.querySelector(".producto-nombre");
                const pId = idHidden ? idHidden.value.trim() : "";
                const pNom = nombreInput ? nombreInput.value.trim() : "";

                if (pId || pNom) {
                    const cant = row.querySelector(".producto-cantidad").value || "1";
                    const precio = row.querySelector(".producto-precio").value || "0";
                    const subtotal = row.querySelector(".producto-subtotal").value || "$ 0,00";

                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${pNom || 'Producto'}</strong></td>
                        <td>${cant}</td>
                        <td>${formatearMoneda(precio)}</td>
                        <td><strong>${subtotal}</strong></td>
                    `;
                    tbodyItems.appendChild(tr);
                }
            });
        }

        // Totales modal
        const mSub = document.getElementById("modal-subtotal");
        const mIva = document.getElementById("modal-iva");
        const mTot = document.getElementById("modal-total");

        if (mSub && subtotalDisplay) mSub.textContent = subtotalDisplay.textContent;
        if (mIva && ivaDisplay) mIva.textContent = ivaDisplay.textContent;
        if (mTot && totalDisplay) mTot.textContent = totalDisplay.textContent;

        modalResumen.classList.add("active");
    }

    function cerrarModalResumen() {
        if (modalResumen) modalResumen.classList.remove("active");
    }

    if (btnModalCancelar) {
        btnModalCancelar.addEventListener("click", cerrarModalResumen);
    }

    if (btnModalConfirmar) {
        btnModalConfirmar.addEventListener("click", () => {
            entradaConfirmada = true;
            cerrarModalResumen();
            HTMLFormElement.prototype.submit.call(formEntrada);
        });
    }

    if (formEntrada) {
        formEntrada.addEventListener("submit", (e) => {
            if (entradaConfirmada) {
                return;
            }

            const tipoActual = tipoEntradaInput.value;

            // Validar campos según tipo
            if (tipoActual === "COMPRA") {
                const numFact = document.getElementById("numero_factura_proveedor");
                if (numFact && !numFact.value.trim()) {
                    e.preventDefault();
                    alert("Por favor ingrese el número de factura del proveedor.");
                    numFact.focus();
                    return;
                }

                if (proveedorId && !proveedorId.value) {
                    e.preventDefault();
                    alert("Por favor seleccione un proveedor válido para la entrada de compra.");
                    if (proveedorBusqueda) proveedorBusqueda.focus();
                    return;
                }
            } else if (tipoActual === "AJUSTE") {
                const obsAjuste = document.getElementById("observaciones_ajuste");
                if (obsAjuste && !obsAjuste.value.trim()) {
                    e.preventDefault();
                    alert("Por favor ingrese las observaciones o razón del ajuste de inventario.");
                    obsAjuste.focus();
                    return;
                }
            }

            // Validar que haya al menos un producto con ID o nombre
            const filasConProd = Array.from(document.querySelectorAll(".producto-row")).filter(r => {
                const id = r.querySelector(".producto-id") ? r.querySelector(".producto-id").value : "";
                const nom = r.querySelector(".producto-nombre") ? r.querySelector(".producto-nombre").value : "";
                const cod = r.querySelector(".producto-codigo") ? r.querySelector(".producto-codigo").value : "";
                return (id && id.trim() !== "") || (nom && nom.trim() !== "") || (cod && cod.trim() !== "");
            });

            if (filasConProd.length === 0) {
                e.preventDefault();
                alert("Debe ingresar al menos un producto en la entrada de inventario.");
                return;
            }

            e.preventDefault();
            abrirModalResumen();
        });
    }

});

