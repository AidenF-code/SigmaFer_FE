document.addEventListener("DOMContentLoaded", () => {

    const proveedores = window.sigmaferProveedores || [];
    const productos = window.sigmaferProductos || [];
    const consecutivoOC = window.consecutivoOC || "OC-00001";

    const tablaProductos = document.getElementById("tabla-productos-body");
    const btnAgregarProducto = document.getElementById("btn-agregar-producto");

    const subtotalDisplay = document.getElementById("subtotal-display");
    const ivaDisplay = document.getElementById("iva-display");
    const totalDisplay = document.getElementById("total-display");

    const formOrden = document.getElementById("form-orden-compra");
    const modalResumen = document.getElementById("modal-resumen-orden");
    const btnModalCancelar = document.getElementById("btn-modal-cancelar");
    const btnModalConfirmar = document.getElementById("btn-modal-confirmar");
    let ordenConfirmada = false;

    // Campos de Proveedor
    const proveedorBusqueda = document.getElementById("proveedor_busqueda");
    const proveedorId = document.getElementById("proveedor_id");
    const proveedorResultados = document.getElementById("proveedores-resultados");
    const nitProveedor = document.getElementById("nit_proveedor");
    const dirProveedor = document.getElementById("direccion_proveedor");
    const telProveedor = document.getElementById("telefono_proveedor");
    const correoProveedor = document.getElementById("correo_proveedor");
    const contactoProveedor = document.getElementById("contacto_proveedor");

    function normalizarTexto(txt) {
        return (txt || "").toString().toLowerCase().trim();
    }

    function formatearMoneda(val) {
        const num = parseFloat(val) || 0;
        return "$ " + num.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* =========================================================
       1. AUTOCOMPLETADO DE PROVEEDOR
       ========================================================= */

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
       2. TABLA DINÁMICA DE PRODUCTOS & NAVEGACIÓN CON ENTER
       ========================================================= */

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
                    if (idHidden) idHidden.value = "";
                    if (codigoInput) codigoInput.value = "";
                    if (nombreInput) nombreInput.value = "";
                    if (cantInput) cantInput.value = "1";
                    if (precioInput) precioInput.value = "";
                    calcularFila(row);
                }
            });
        }

        // Manejo Enter
        const camposFila = [codigoInput, nombreInput, cantInput, precioInput, ivaSelect];

        camposFila.forEach((campo, index) => {
            if (!campo) return;
            campo.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();

                    if (resultsBox && resultsBox.classList.contains("active")) {
                        const firstItem = resultsBox.querySelector(".autocomplete-item");
                        if (firstItem) {
                            firstItem.click();
                            if (cantInput) cantInput.focus();
                            return;
                        }
                    }

                    if (index < camposFila.length - 1) {
                        const nextField = camposFila[index + 1];
                        if (nextField) nextField.focus();
                    } else {
                        const siguienteFila = row.nextElementSibling;
                        if (siguienteFila && siguienteFila.classList.contains("producto-row")) {
                            const primerInput = siguienteFila.querySelector(".producto-codigo") || siguienteFila.querySelector(".producto-nombre");
                            if (primerInput) primerInput.focus();
                        } else {
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

    document.querySelectorAll(".producto-row").forEach(row => vincularFilaProducto(row));

    /* =========================================================
       3. MODAL DE RESUMEN Y ENVÍO
       ========================================================= */

    function abrirModalResumen() {
        if (!modalResumen) return;

        const pNombre = proveedorBusqueda ? proveedorBusqueda.value : "-";
        const modalProv = document.getElementById("modal-proveedor-texto");
        if (modalProv) modalProv.textContent = pNombre || "No seleccionado";

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
            ordenConfirmada = true;
            cerrarModalResumen();
            if (typeof formOrden.requestSubmit === "function") {
                formOrden.requestSubmit();
            } else {
                HTMLFormElement.prototype.submit.call(formOrden);
            }
        });
    }

    if (formOrden) {
        formOrden.addEventListener("submit", (e) => {
            if (proveedorId && !proveedorId.value) {
                e.preventDefault();
                alert("Por favor seleccione un proveedor válido para emitir la orden de compra.");
                if (proveedorBusqueda) proveedorBusqueda.focus();
                return;
            }

            const filasConProd = Array.from(document.querySelectorAll(".producto-row")).filter(r => {
                const id = r.querySelector(".producto-id").value;
                const nom = r.querySelector(".producto-nombre").value;
                return (id && id.trim() !== "") || (nom && nom.trim() !== "");
            });

            if (filasConProd.length === 0) {
                e.preventDefault();
                alert("Debe ingresar al menos un producto en la orden de compra.");
                return;
            }

            if (!ordenConfirmada) {
                e.preventDefault();
                abrirModalResumen();
            }
        });
    }

});
