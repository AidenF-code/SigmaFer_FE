document.addEventListener("DOMContentLoaded", () => {

    const facturas = window.sigmaferFacturas || [];
    const clientes = window.sigmaferClientes || [];
    const productos = window.sigmaferProductos || [];
    const consecutivoDE = window.consecutivoDE || "DE-00001";

    // Productos permitidos de la factura seleccionada
    let productosPermitidosFactura = [];
    let facturaSeleccionadaActual = null;

    const tablaProductos = document.getElementById("tabla-productos-body");
    const btnAgregarProducto = document.getElementById("btn-agregar-producto");

    const subtotalDisplay = document.getElementById("subtotal-display");
    const ivaDisplay = document.getElementById("iva-display");
    const totalDisplay = document.getElementById("total-display");

    const formDevolucion = document.getElementById("form-devolucion");
    const modalResumen = document.getElementById("modal-resumen-devolucion");
    const btnModalCancelar = document.getElementById("btn-modal-cancelar");
    const btnModalConfirmar = document.getElementById("btn-modal-confirmar");
    let devolucionConfirmada = false;

    // Campos de Factura y Cliente
    const facturaBusqueda = document.getElementById("factura_busqueda");
    const facturaId = document.getElementById("factura_id");
    const facturasResultados = document.getElementById("facturas-resultados");

    const clienteBusqueda = document.getElementById("cliente_busqueda");
    const clienteId = document.getElementById("cliente_id");
    const clientesResultados = document.getElementById("clientes-resultados");

    const nitCliente = document.getElementById("nit_cliente");
    const dirCliente = document.getElementById("direccion_cliente");
    const telCliente = document.getElementById("telefono_cliente");
    const correoCliente = document.getElementById("correo_cliente");
    const contactoCliente = document.getElementById("contacto_cliente");

    function normalizarTexto(txt) {
        return (txt || "").toString().toLowerCase().trim();
    }

    function formatearMoneda(val) {
        const num = parseFloat(val) || 0;
        return "$ " + num.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* =========================================================
       1. SELECCIÓN DE CLIENTE
       ========================================================= */

    function seleccionarCliente(c) {
        if (!c) return;
        if (clienteId) clienteId.value = c.id || "";
        if (clienteBusqueda) clienteBusqueda.value = c.razon_social || c.nombre || "";
        if (nitCliente) nitCliente.value = c.numero_identificacion || c.numero_documento || c.nit || "";
        if (dirCliente) dirCliente.value = c.direccion || "";
        if (telCliente) telCliente.value = c.telefono || "";
        if (correoCliente) correoCliente.value = c.correo || "";
        if (contactoCliente) contactoCliente.value = c.nombre || c.contacto || c.nombre_contacto || "";

        if (clientesResultados) {
            clientesResultados.innerHTML = "";
            clientesResultados.classList.remove("active");
        }
    }

    function buscarClientes(texto) {
        if (!clientesResultados) return;
        const q = normalizarTexto(texto);
        if (!q) {
            clientesResultados.innerHTML = "";
            clientesResultados.classList.remove("active");
            return;
        }

        const matches = clientes.filter(c => {
            const razon = normalizarTexto(c.razon_social || "");
            const nom = normalizarTexto(c.nombre || "");
            const doc = normalizarTexto(c.numero_identificacion || c.numero_documento || c.nit || "");
            return razon.includes(q) || nom.includes(q) || doc.includes(q);
        });

        clientesResultados.innerHTML = "";
        if (matches.length === 0) {
            clientesResultados.innerHTML = `<div class="autocomplete-item"><strong>No se encontraron clientes</strong></div>`;
            clientesResultados.classList.add("active");
            return;
        }

        matches.slice(0, 8).forEach(c => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            const razon = c.razon_social || "";
            const nom = c.nombre || "";
            const displayTitle = razon ? (nom && nom !== razon ? `${razon} (${nom})` : razon) : (nom || "Cliente");
            const doc = c.numero_identificacion || c.numero_documento || c.nit || "-";
            const tel = c.telefono || "";
            item.innerHTML = `<strong>${displayTitle}</strong><span>Doc / NIT: ${doc} · Tel: ${tel}</span>`;
            item.addEventListener("click", () => seleccionarCliente(c));
            clientesResultados.appendChild(item);
        });

        clientesResultados.classList.add("active");
    }

    if (clienteBusqueda) {
        clienteBusqueda.addEventListener("input", () => {
            buscarClientes(clienteBusqueda.value);
        });
        clienteBusqueda.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const first = clientesResultados.querySelector(".autocomplete-item");
                if (first) first.click();
            }
        });
    }

    /* =========================================================
       2. SELECCIÓN DE FACTURA & CARGA DE SUS PRODUCTOS
       ========================================================= */

    async function cargarProductosDeFactura(fId) {
        try {
            const response = await fetch(`/inventarios/api/factura_detalles/${fId}`);
            if (response.ok) {
                const data = await response.json();
                productosPermitidosFactura = Array.isArray(data) ? data : [];
            } else {
                productosPermitidosFactura = [];
            }
        } catch (err) {
            console.error("Error al cargar productos de la factura:", err);
            productosPermitidosFactura = [];
        }

        poblarTablaConProductosFactura();
    }

    function poblarTablaConProductosFactura() {
        if (!tablaProductos) return;

        // Limpiar filas actuales
        tablaProductos.innerHTML = "";

        if (productosPermitidosFactura.length > 0) {
            // Cargar productos de la factura
            productosPermitidosFactura.forEach(prod => {
                const tr = crearElementoFila();
                const codigoInput = tr.querySelector(".producto-codigo");
                const nombreInput = tr.querySelector(".producto-nombre");
                const idHidden = tr.querySelector(".producto-id");
                const cantInput = tr.querySelector(".producto-cantidad");
                const precioInput = tr.querySelector(".producto-precio");
                const ivaSelect = tr.querySelector(".producto-iva");

                if (codigoInput) codigoInput.value = prod.producto_codigo || "";
                if (nombreInput) nombreInput.value = prod.producto_nombre || `Producto #${prod.producto_id}`;
                if (idHidden) idHidden.value = prod.producto_id || "";
                if (cantInput) {
                    const cantMax = parseInt(prod.cantidad) || 1;
                    cantInput.value = "1";
                    cantInput.setAttribute("max", cantMax);
                    cantInput.setAttribute("data-max-cant", cantMax);
                    cantInput.title = `Cantidad facturada: ${cantMax}`;
                }
                if (precioInput) precioInput.value = prod.valor_unitario || "0";
                if (ivaSelect) {
                    const ivaVal = parseInt(prod.iva_porcentaje) || 19;
                    ivaSelect.value = String(ivaVal);
                }

                tablaProductos.appendChild(tr);
                vincularFilaProducto(tr);
            });

            // Completar hasta al menos 5 filas si son menos de 5
            const restantes = 5 - productosPermitidosFactura.length;
            for (let i = 0; i < restantes; i++) {
                const tr = crearElementoFila();
                tablaProductos.appendChild(tr);
                vincularFilaProducto(tr);
            }
        } else {
            // 5 filas vacías
            for (let i = 0; i < 5; i++) {
                const tr = crearElementoFila();
                tablaProductos.appendChild(tr);
                vincularFilaProducto(tr);
            }
        }

        calcularTotalesGenerales();
    }

    function seleccionarFactura(f) {
        if (!f) return;
        facturaSeleccionadaActual = f;
        if (facturaId) facturaId.value = f.id || "";
        if (facturaBusqueda) facturaBusqueda.value = f.numero_factura || "";

        // Buscar cliente correspondiente a la factura
        let clienteEncontrado = null;
        if (f.cliente_id) {
            clienteEncontrado = clientes.find(c => String(c.id) === String(f.cliente_id));
        }
        if (!clienteEncontrado && f.cliente) {
            clienteEncontrado = clientes.find(c => 
                normalizarTexto(c.razon_social) === normalizarTexto(f.cliente) || 
                normalizarTexto(c.nombre) === normalizarTexto(f.cliente)
            );
        }

        if (clienteEncontrado) {
            seleccionarCliente(clienteEncontrado);
        } else {
            if (clienteId) clienteId.value = f.cliente_id || "";
            if (clienteBusqueda) clienteBusqueda.value = f.cliente || "";
            if (nitCliente) nitCliente.value = f.cliente_nit || "";
            if (dirCliente) dirCliente.value = f.cliente_direccion || "";
            if (telCliente) telCliente.value = f.cliente_telefono || "";
            if (correoCliente) correoCliente.value = f.cliente_correo || "";
            if (contactoCliente) contactoCliente.value = f.cliente_contacto || "";
        }

        if (facturasResultados) {
            facturasResultados.innerHTML = "";
            facturasResultados.classList.remove("active");
        }

        // Cargar productos exclusivamente de esta factura
        if (f.id) {
            cargarProductosDeFactura(f.id);
        }
    }

    function buscarFacturas(texto) {
        if (!facturasResultados) return;
        const q = normalizarTexto(texto).replace(/\s+/g, "");
        if (!q) {
            facturasResultados.innerHTML = "";
            facturasResultados.classList.remove("active");
            return;
        }

        const matches = facturas.filter(f => {
            const num = normalizarTexto(f.numero_factura || "").replace(/\s+/g, "");
            const cli = normalizarTexto(f.cliente || "");
            const nit = normalizarTexto(f.cliente_nit || "");
            return num.includes(q) || cli.includes(q) || nit.includes(q);
        });

        facturasResultados.innerHTML = "";
        if (matches.length === 0) {
            facturasResultados.innerHTML = `<div class="autocomplete-item"><strong>No se encontraron facturas</strong><span>Verifique el consecutivo (Ej: FV-00001)</span></div>`;
            facturasResultados.classList.add("active");
            return;
        }

        matches.slice(0, 8).forEach(f => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            const num = f.numero_factura || "Factura";
            const cli = f.cliente || "Cliente";
            const nit = f.cliente_nit ? ` · NIT: ${f.cliente_nit}` : "";
            const contacto = f.cliente_contacto ? ` · Contacto: ${f.cliente_contacto}` : "";
            const tot = f.total ? formatearMoneda(f.total) : "";
            item.innerHTML = `<strong style="color: #fbbf24;">${num}</strong><span>Cliente: ${cli}${nit}${contacto} · ${tot}</span>`;
            item.addEventListener("click", () => seleccionarFactura(f));
            facturasResultados.appendChild(item);
        });

        facturasResultados.classList.add("active");
    }

    if (facturaBusqueda) {
        facturaBusqueda.addEventListener("input", () => {
            const val = facturaBusqueda.value.trim();
            const valNorm = normalizarTexto(val).replace(/\s+/g, "");
            const exact = facturas.find(f => normalizarTexto(f.numero_factura || "").replace(/\s+/g, "") === valNorm);
            if (exact) {
                seleccionarFactura(exact);
            } else {
                buscarFacturas(val);
            }
        });

        facturaBusqueda.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const first = facturasResultados.querySelector(".autocomplete-item");
                if (first) {
                    first.click();
                } else {
                    const valNorm = normalizarTexto(facturaBusqueda.value).replace(/\s+/g, "");
                    const match = facturas.find(f => normalizarTexto(f.numero_factura || "").replace(/\s+/g, "").includes(valNorm));
                    if (match) seleccionarFactura(match);
                }
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (!e.target.closest(".autocomplete-container")) {
            document.querySelectorAll(".autocomplete-results").forEach(el => el.classList.remove("active"));
        }
    });

    /* =========================================================
       3. TABLA DE PRODUCTOS
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
            const pId = prod.producto_id || prod.id || "";
            const pCod = prod.producto_codigo || prod.codigo || "";
            const pNom = prod.producto_nombre || prod.nombre || "";
            const pVal = prod.valor_unitario !== undefined ? prod.valor_unitario : (prod.precio || 0);
            const pIva = prod.iva_porcentaje !== undefined ? prod.iva_porcentaje : 19;

            if (idHidden) idHidden.value = pId;
            if (codigoInput) codigoInput.value = pCod;
            if (nombreInput) nombreInput.value = pNom;
            if (precioInput) {
                precioInput.value = pVal;
            }
            if (ivaSelect && pIva !== undefined) {
                ivaSelect.value = String(parseInt(pIva) || 19);
            }
            if (cantInput) {
                const cantMax = parseInt(prod.cantidad) || 0;
                if (cantMax > 0) {
                    cantInput.setAttribute("max", cantMax);
                    cantInput.setAttribute("data-max-cant", cantMax);
                    cantInput.title = `Cantidad facturada: ${cantMax}`;
                } else {
                    cantInput.removeAttribute("data-max-cant");
                }
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
            const listaBase = productosPermitidosFactura.length > 0 ? productosPermitidosFactura : productos;

            if (listaBase.length === 0) {
                resultsBox.innerHTML = `<div class="autocomplete-item" style="color: #fbbf24;"><strong>No hay productos disponibles</strong><span>Seleccione una Factura de Venta válida</span></div>`;
                resultsBox.classList.add("active");
                return;
            }

            const matches = q
                ? listaBase.filter(p => {
                    const nom = normalizarTexto(p.producto_nombre || p.nombre || "");
                    const cod = normalizarTexto(p.producto_codigo || p.codigo || "");
                    return nom.includes(q) || cod.includes(q);
                })
                : listaBase;

            resultsBox.innerHTML = "";
            if (matches.length === 0) {
                const msg = productosPermitidosFactura.length > 0
                    ? `<strong style="color: #f87171;">Producto no encontrado en esta factura</strong><span>Solo puede devolver ítems facturados</span>`
                    : `<strong>No se encontraron productos</strong>`;
                resultsBox.innerHTML = `<div class="autocomplete-item">${msg}</div>`;
                resultsBox.classList.add("active");
                return;
            }

            matches.slice(0, 10).forEach(p => {
                const item = document.createElement("div");
                item.className = "autocomplete-item";
                const nom = p.producto_nombre || p.nombre || `Producto #${p.producto_id || p.id}`;
                const cod = p.producto_codigo || p.codigo || "-";
                const cantFact = p.cantidad ? ` · Cant. Facturada: ${p.cantidad}` : "";
                const valUnit = p.valor_unitario !== undefined ? formatearMoneda(p.valor_unitario) : (p.precio !== undefined ? formatearMoneda(p.precio) : "");
                item.innerHTML = `<strong>${nom}</strong><span style="color: #38bdf8;">Código: ${cod}${cantFact} · ${valUnit}</span>`;
                item.addEventListener("click", () => setProducto(p));
                resultsBox.appendChild(item);
            });

            resultsBox.classList.add("active");
        }

        if (nombreInput) {
            nombreInput.addEventListener("focus", () => {
                buscarProds(nombreInput.value);
            });
            nombreInput.addEventListener("input", () => {
                buscarProds(nombreInput.value);
                calcularFila(row);
            });
        }

        if (codigoInput) {
            codigoInput.addEventListener("focus", () => {
                buscarProds(codigoInput.value);
            });
            codigoInput.addEventListener("input", () => {
                const cod = normalizarTexto(codigoInput.value);
                const listaBase = productosPermitidosFactura.length > 0 ? productosPermitidosFactura : productos;
                const exact = listaBase.find(p => normalizarTexto(p.producto_codigo || p.codigo || "") === cod);
                if (exact) {
                    setProducto(exact);
                } else {
                    buscarProds(codigoInput.value);
                }
                calcularFila(row);
            });
        }

        if (cantInput) {
            cantInput.addEventListener("input", () => {
                const maxCant = parseInt(cantInput.getAttribute("data-max-cant"));
                const cantVal = parseInt(cantInput.value) || 0;
                if (!isNaN(maxCant) && maxCant > 0 && cantVal > maxCant) {
                    cantInput.style.borderColor = "#ef4444";
                    cantInput.style.color = "#fca5a5";
                } else {
                    cantInput.style.borderColor = "";
                    cantInput.style.color = "";
                }
                calcularFila(row);
            });
        }

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
                    if (cantInput) {
                        cantInput.value = "1";
                        cantInput.removeAttribute("data-max-cant");
                    }
                    if (precioInput) precioInput.value = "";
                    calcularFila(row);
                }
            });
        }

        // Manejo de Enter
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

    function crearElementoFila() {
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
        return tr;
    }

    function agregarFilaProducto() {
        if (!tablaProductos) return null;
        const tr = crearElementoFila();
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
       4. MODAL DE RESUMEN Y CONFIRMACIÓN
       ========================================================= */

    function abrirModalResumen() {
        if (!modalResumen) return;

        const fNum = facturaBusqueda ? facturaBusqueda.value : "-";
        const cNom = clienteBusqueda ? clienteBusqueda.value : "-";
        const obs = document.getElementById("observaciones");

        const mFact = document.getElementById("modal-factura-texto");
        const mCli = document.getElementById("modal-cliente-texto");
        const mMot = document.getElementById("modal-motivo-texto");

        if (mFact) mFact.textContent = fNum || "No especificada";
        if (mCli) mCli.textContent = cNom || "Cliente";
        if (mMot) mMot.textContent = obs ? obs.value.trim() || 'Devolución de mercancía' : 'Devolución de mercancía';

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
            devolucionConfirmada = true;
            cerrarModalResumen();
            if (typeof formDevolucion.requestSubmit === "function") {
                formDevolucion.requestSubmit();
            } else {
                HTMLFormElement.prototype.submit.call(formDevolucion);
            }
        });
    }

    if (formDevolucion) {
        formDevolucion.addEventListener("submit", (e) => {
            if (!facturaId || !facturaId.value) {
                e.preventDefault();
                alert("Por favor seleccione una Factura de Venta válida.");
                if (facturaBusqueda) facturaBusqueda.focus();
                return;
            }

            const filasConProd = Array.from(document.querySelectorAll(".producto-row")).filter(r => {
                const id = r.querySelector(".producto-id").value;
                const nom = r.querySelector(".producto-nombre").value;
                return (id && id.trim() !== "") || (nom && nom.trim() !== "");
            });

            if (filasConProd.length === 0) {
                e.preventDefault();
                alert("Debe ingresar al menos un producto para registrar la devolución.");
                return;
            }

            // Validar si hay productos permitidos por la factura seleccionada
            if (productosPermitidosFactura.length > 0) {
                for (const r of filasConProd) {
                    const pId = r.querySelector(".producto-id").value;
                    const pNom = r.querySelector(".producto-nombre").value;
                    const cantInput = r.querySelector(".producto-cantidad");
                    const cantVal = parseInt(cantInput.value) || 0;

                    const matchFactura = productosPermitidosFactura.find(p => String(p.producto_id) === String(pId));
                    if (!matchFactura) {
                        e.preventDefault();
                        alert(`El producto "${pNom}" no pertenece a la factura seleccionada (${facturaBusqueda.value}).`);
                        r.querySelector(".producto-nombre").focus();
                        return;
                    }

                    const cantMax = parseInt(matchFactura.cantidad) || 0;
                    if (cantMax > 0 && cantVal > cantMax) {
                        e.preventDefault();
                        alert(`La cantidad a devolver de "${pNom}" (${cantVal}) no puede superar la cantidad facturada (${cantMax}).`);
                        cantInput.focus();
                        return;
                    }
                }
            }

            if (!devolucionConfirmada) {
                e.preventDefault();
                abrirModalResumen();
            }
        });
    }

});
