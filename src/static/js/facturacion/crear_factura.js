/* =========================================================
   SIGMAFER - ELABORACIÓN DE FACTURA
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS PRINCIPALES
    ===================================================== */

    const formFactura =
        document.getElementById("form-factura");

    const tablaProductos =
        document.getElementById("tabla-productos");

    const btnAgregarProducto =
        document.getElementById("btn-agregar-producto");

    const clienteBusqueda =
        document.getElementById("cliente_busqueda");

    const clienteId =
        document.getElementById("cliente_id");

    const clienteResultados =
        document.getElementById("clientes-resultados");

    const numeroIdentificacion =
        document.getElementById("numero_identificacion");

    const razonSocial =
        document.getElementById("razon_social");

    const nombreCliente =
        document.getElementById("nombre_cliente");

    const telefonoCliente =
        document.getElementById("telefono_cliente");

    const correoCliente =
        document.getElementById("correo_cliente");

    const direccionCliente =
        document.getElementById("direccion_cliente");

    const subtotalFactura =
        document.getElementById("subtotal");

    const ivaFactura =
        document.getElementById("total_iva");

    const totalFactura =
        document.getElementById("total_documento");


    /* =====================================================
       DATOS CARGADOS DESDE FLASK / JINJA
    ===================================================== */

    const clientes =
        window.sigmaferClientes || [];

    const productos =
        window.sigmaferProductos || [];


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function formatearMoneda(valor) {

        const numero = Number(valor) || 0;

        return numero.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    function convertirNumero(valor) {

        const numero = Number(valor);

        return Number.isFinite(numero)
            ? numero
            : 0;
    }


    function normalizarTexto(valor) {

        return String(valor || "")
            .trim()
            .toLowerCase();
    }


    /* =====================================================
       CLIENTES
    ===================================================== */

    function limpiarDatosCliente() {
        if (clienteId) clienteId.value = "";
        if (numeroIdentificacion) numeroIdentificacion.value = "";
        if (razonSocial) razonSocial.value = "";
        if (nombreCliente) nombreCliente.value = "";
        if (telefonoCliente) telefonoCliente.value = "";
        if (correoCliente) correoCliente.value = "";
        if (direccionCliente) direccionCliente.value = "";
    }


    function mostrarResultadosClientes(resultados) {
        if (!clienteResultados) return;

        clienteResultados.innerHTML = "";


        if (resultados.length === 0) {

            clienteResultados.innerHTML = `
                <div class="autocomplete-item">
                    <strong>
                        No se encontraron clientes
                    </strong>

                    <span>
                        Pruebe con otro nombre,
                        documento o razón social.
                    </span>
                </div>
            `;

            clienteResultados.classList.add("active");

            return;
        }


        resultados.forEach(cliente => {

            const item =
                document.createElement("div");

            item.className =
                "autocomplete-item";


            item.innerHTML = `
                <strong>
                    ${cliente.razon_social || cliente.nombre}
                </strong>

                <span>
                    ${cliente.nombre || ""}
                    ·
                    ${cliente.numero_identificacion || ""}
                </span>
            `;


            item.addEventListener(
                "click",
                () => {
                    seleccionarCliente(cliente);
                }
            );


            clienteResultados.appendChild(item);

        });


        clienteResultados.classList.add("active");
    }


    function seleccionarCliente(cliente) {
        if (clienteId) clienteId.value = cliente.id || "";
        if (clienteBusqueda) clienteBusqueda.value = cliente.razon_social || cliente.nombre || "";
        if (numeroIdentificacion) numeroIdentificacion.value = cliente.numero_identificacion || "";
        if (razonSocial) razonSocial.value = cliente.razon_social || "";
        if (nombreCliente) nombreCliente.value = cliente.nombre || "";
        if (telefonoCliente) telefonoCliente.value = cliente.telefono || "";
        if (correoCliente) correoCliente.value = cliente.correo || "";
        if (direccionCliente) direccionCliente.value = cliente.direccion || "";

        if (clienteResultados) {
            clienteResultados.innerHTML = "";
            clienteResultados.classList.remove("active");
        }
    }


    function buscarClientes(texto) {

        const busqueda =
            normalizarTexto(texto);


        if (!busqueda) {
            if (clienteResultados) {
                clienteResultados.innerHTML = "";
                clienteResultados.classList.remove("active");
            }
            return;
        }


        const resultados =
            clientes.filter(cliente => {

                /*
                 * Solo clientes activos.
                 */

                if (!cliente.estado) {
                    return false;
                }


                return (

                    normalizarTexto(
                        cliente.nombre
                    ).includes(busqueda)

                    ||

                    normalizarTexto(
                        cliente.razon_social
                    ).includes(busqueda)

                    ||

                    normalizarTexto(
                        cliente.numero_identificacion
                    ).includes(busqueda)

                );

            });


        mostrarResultadosClientes(
            resultados
        );
    }


    if (clienteBusqueda) {
        clienteBusqueda.addEventListener(
            "input",
            () => {
                limpiarDatosCliente();
                buscarClientes(
                    clienteBusqueda.value
                );
            }
        );

        clienteBusqueda.addEventListener(
            "keydown",
            event => {
                if (event.key !== "Enter") {
                    return;
                }
                event.preventDefault();
                const primerResultado =
                    clienteResultados ? clienteResultados.querySelector(".autocomplete-item") : null;
                if (primerResultado) {
                    primerResultado.click();
                }
            }
        );
    }



    /* =====================================================
       UTILIDADES DE FILAS
    ===================================================== */

    function obtenerFila(event) {

        return event.target.closest(
            ".producto-row"
        );
    }


    function limpiarFila(fila) {

        const codigo =
            fila.querySelector(
                ".producto-codigo"
            );

        const nombre =
            fila.querySelector(
                ".producto-nombre"
            );

        const id =
            fila.querySelector(
                ".producto-id"
            );

        const cantidad =
            fila.querySelector(
                ".producto-cantidad"
            );

        const precio =
            fila.querySelector(
                ".producto-precio"
            );

        const iva =
            fila.querySelector(
                ".producto-iva"
            );

        const subtotal =
            fila.querySelector(
                ".producto-subtotal"
            );


        codigo.value = "";

        nombre.value = "";

        id.value = "";

        cantidad.value = "1";

        cantidad.min = "1";

        cantidad.removeAttribute("max");

        precio.value = "";

        iva.value = "19";

        subtotal.value =
            "$ 0,00";


        /*
         * Limpiar datos internos
         */

        fila.dataset.stock = "";

        fila.dataset.productoId = "";


        /*
         * Eliminar información visual
         * del stock disponible
         */

        const stockInfo =
            fila.querySelector(
                ".stock-disponible"
            );


        if (stockInfo) {
            stockInfo.remove();
        }


        /*
         * Cerrar autocomplete
         */

        const resultados =
            fila.querySelector(
                ".productos-resultados"
            );


        if (resultados) {

            resultados.innerHTML = "";

            resultados.classList.remove(
                "active"
            );
        }


        /*
         * Limpiar validaciones
         */

        cantidad.setCustomValidity("");

        precio.setCustomValidity("");

        actualizarDisponibilidadStock();
    }


    /* =====================================================
       CÁLCULOS
    ===================================================== */

    function actualizarSubtotalFila(fila) {

        const cantidadInput =
            fila.querySelector(
                ".producto-cantidad"
            );

        const precioInput =
            fila.querySelector(
                ".producto-precio"
            );

        const subtotalInput =
            fila.querySelector(
                ".producto-subtotal"
            );


        const cantidad =
            convertirNumero(
                cantidadInput.value
            );

        const precio =
            convertirNumero(
                precioInput.value
            );


        const subtotal =
            cantidad * precio;


        subtotalInput.value =
            formatearMoneda(subtotal);


        calcularTotalesFactura();
    }


    function calcularIvaFila(fila) {

        const cantidad =
            convertirNumero(
                fila.querySelector(
                    ".producto-cantidad"
                ).value
            );

        const precio =
            convertirNumero(
                fila.querySelector(
                    ".producto-precio"
                ).value
            );

        const ivaPorcentaje =
            convertirNumero(
                fila.querySelector(
                    ".producto-iva"
                ).value
            );


        const subtotal =
            cantidad * precio;


        return (
            subtotal *
            (ivaPorcentaje / 100)
        );
    }


    function calcularTotalesFactura() {

        let subtotalTotal = 0;

        let ivaTotal = 0;

        let total = 0;


        const filas =
            tablaProductos.querySelectorAll(
                ".producto-row"
            );


        filas.forEach(fila => {

            const cantidad =
                convertirNumero(
                    fila.querySelector(
                        ".producto-cantidad"
                    ).value
                );

            const precio =
                convertirNumero(
                    fila.querySelector(
                        ".producto-precio"
                    ).value
                );


            const subtotal =
                cantidad * precio;


            const iva =
                calcularIvaFila(fila);


            const totalLinea =
                subtotal + iva;


            subtotalTotal += subtotal;

            ivaTotal += iva;

            total += totalLinea;

        });


        subtotalFactura.textContent =
            formatearMoneda(
                subtotalTotal
            );

        ivaFactura.textContent =
            formatearMoneda(
                ivaTotal
            );

        totalFactura.textContent =
            formatearMoneda(
                total
            );
    }


    /* =====================================================
       VALIDACIONES
    ===================================================== */

    function validarCantidad(fila) {

        const cantidadInput =
            fila.querySelector(
                ".producto-cantidad"
            );


        const cantidad =
            convertirNumero(
                cantidadInput.value
            );


        if (cantidad < 1) {

            cantidadInput.setCustomValidity(
                "La cantidad debe ser mayor o igual a 1."
            );

            return false;
        }


        cantidadInput.setCustomValidity("");

        return true;
    }


    function validarPrecio(fila) {

        const precioInput =
            fila.querySelector(
                ".producto-precio"
            );


        /*
         * Si está vacío, todavía no
         * consideramos que sea válido.
         */

        if (
            precioInput.value === "" ||
            precioInput.value === null
        ) {

            precioInput.setCustomValidity(
                "Debe indicar el valor unitario."
            );

            return false;
        }


        const precio =
            Number(
                precioInput.value
            );


        if (
            !Number.isFinite(precio) ||
            precio < 0
        ) {

            precioInput.setCustomValidity(
                "El precio no puede ser negativo."
            );

            return false;
        }


        precioInput.setCustomValidity("");

        return true;
    }


    /* =====================================================
       AUTOCOMPLETADO DE PRODUCTOS
    ===================================================== */

    function obtenerResultadosProductos(
        texto
    ) {

        const busqueda =
            normalizarTexto(texto);


        if (!busqueda) {
            return [];
        }


        return productos.filter(producto => {

            /*
             * No mostrar productos inactivos.
             */

            if (!producto.estado) {
                return false;
            }


            return (

                normalizarTexto(
                    producto.codigo
                ).includes(busqueda)

                ||

                normalizarTexto(
                    producto.nombre
                ).includes(busqueda)

            );

        });
    }


    function mostrarResultadosProductos(
        fila,
        resultados
    ) {

        const contenedor =
            fila.querySelector(
                ".productos-resultados"
            );


        contenedor.innerHTML = "";


        if (resultados.length === 0) {

            contenedor.innerHTML = `
                <div class="autocomplete-item">

                    <strong>
                        Producto no encontrado
                    </strong>

                    <span>
                        Pruebe con otro código o nombre.
                    </span>

                </div>
            `;

            contenedor.classList.add(
                "active"
            );

            return;
        }


        resultados.forEach(producto => {

            const item =
                document.createElement("div");


            item.className =
                "autocomplete-item";


            item.innerHTML = `
                <strong>
                    ${producto.nombre}
                </strong>

                <span>
                    ${producto.codigo}
                    ·
                    ${formatearMoneda(
                        producto.precio
                    )}
                    ·
                    Stock: ${producto.stock}
                </span>
            `;


            item.addEventListener(
                "click",
                () => {

                    seleccionarProducto(
                        fila,
                        producto
                    );

                }
            );


            contenedor.appendChild(item);

        });


        contenedor.classList.add(
            "active"
        );
    }


    function seleccionarProducto(
        fila,
        producto
    ) {

        const codigo =
            fila.querySelector(
                ".producto-codigo"
            );

        const nombre =
            fila.querySelector(
                ".producto-nombre"
            );

        const productoId =
            fila.querySelector(
                ".producto-id"
            );

        const precio =
            fila.querySelector(
                ".producto-precio"
            );

        const cantidad =
            fila.querySelector(
                ".producto-cantidad"
            );

        const resultados =
            fila.querySelector(
                ".productos-resultados"
            );


        const stockDisponible =
            convertirNumero(
                producto.stock
            );


        const precioProducto =
            convertirNumero(
                producto.precio
            );


        /*
         * Completar información
         */

        codigo.value =
            producto.codigo || "";

        nombre.value =
            producto.nombre || "";

        productoId.value =
            producto.id || "";


        /*
         * El precio se autocompleta,
         * pero permanece editable.
         *
         * 0 es válido para promociones
         * u obsequios.
         */

        precio.value =
            precioProducto;


        /*
         * Cantidad
         */

        cantidad.min = "1";

        cantidad.max =
            Math.floor(
                stockDisponible
            );


        /*
         * Guardar datos internos
         */

        fila.dataset.stock =
            stockDisponible;

        fila.dataset.productoId =
            producto.id;


        /*
         * Mostrar stock disponible
         */

        let stockInfo =
            fila.querySelector(
                ".stock-disponible"
            );


        if (!stockInfo) {

            stockInfo =
                document.createElement(
                    "small"
                );

            stockInfo.className =
                "stock-disponible";

            cantidad.parentElement.appendChild(
                stockInfo
            );
        }


        stockInfo.textContent =
            `Disponible: ${stockDisponible}`;


        /*
         * Limpiar autocomplete
         */

        resultados.innerHTML = "";

        resultados.classList.remove(
            "active"
        );


        /*
         * Limpiar posibles errores
         */

        cantidad.setCustomValidity("");

        precio.setCustomValidity("");


        /*
         * Recalcular subtotal
         */

        actualizarSubtotalFila(
            fila
        );

        actualizarDisponibilidadStock();


        /*
         * Enviar cursor a cantidad
         */

        cantidad.focus();

    }


    function buscarProductoPorCodigo(
        fila
    ) {

        const codigoInput =
            fila.querySelector(
                ".producto-codigo"
            );


        const codigo =
            normalizarTexto(
                codigoInput.value
            );


        if (!codigo) {
            return false;
        }


        const producto =
            productos.find(
                item =>
                    normalizarTexto(
                        item.codigo
                    ) === codigo
                    &&
                    item.estado
            );


        if (!producto) {
            return false;
        }


        seleccionarProducto(
            fila,
            producto
        );


        return true;
    }


    /* =====================================================
       VALIDACIÓN ACUMULADA DE STOCK
    ===================================================== */

    function validarStockFactura() {

        const cantidadesPorProducto = {};

        const stockPorProducto = {};


        const filas =
            tablaProductos.querySelectorAll(
                ".producto-row"
            );


        for (const fila of filas) {

            const productoId =
                fila.querySelector(
                    ".producto-id"
                ).value.trim();


            /*
             * Ignorar filas vacías.
             */

            if (!productoId) {
                continue;
            }


            const cantidad =
                convertirNumero(
                    fila.querySelector(
                        ".producto-cantidad"
                    ).value
                );


            const stock =
                convertirNumero(
                    fila.dataset.stock
                );


            /*
             * Guardar stock disponible.
             */

            stockPorProducto[
                productoId
            ] = stock;


            /*
             * Crear acumulador.
             */

            if (
                !Object.prototype.hasOwnProperty.call(
                    cantidadesPorProducto,
                    productoId
                )
            ) {

                cantidadesPorProducto[
                    productoId
                ] = 0;
            }


            /*
             * Acumular cantidad.
             */

            cantidadesPorProducto[
                productoId
            ] += cantidad;

        }


        /*
         * Comparar cantidades acumuladas
         * contra el stock.
         */

        for (
            const productoId
            in cantidadesPorProducto
        ) {

            const cantidadSolicitada =
                cantidadesPorProducto[
                    productoId
                ];


            const stockDisponible =
                stockPorProducto[
                    productoId
                ];


            if (
                cantidadSolicitada >
                stockDisponible
            ) {

                return {
                    valido: false,
                    productoId,
                    cantidadSolicitada,
                    stockDisponible
                };
            }
        }


        return {
            valido: true
        };
    }


    function actualizarDisponibilidadStock() {

    const filas =
        Array.from(
            tablaProductos.querySelectorAll(
                ".producto-row"
            )
        );


    /*
     * =====================================================
     * 1. Obtener cantidades agrupadas por producto
     * =====================================================
     */

    const cantidadesPorProducto = {};


    filas.forEach(fila => {

        const productoId =
            fila.querySelector(
                ".producto-id"
            ).value.trim();


        if (!productoId) {
            return;
        }


        const cantidad =
            convertirNumero(
                fila.querySelector(
                    ".producto-cantidad"
                ).value
            );


        if (
            !cantidadesPorProducto[productoId]
        ) {

            cantidadesPorProducto[productoId] = 0;

        }


        cantidadesPorProducto[productoId] +=
            cantidad;

    });


    /*
     * =====================================================
     * 2. Actualizar cada fila
     * =====================================================
     */

    filas.forEach(fila => {

        const productoId =
            fila.querySelector(
                ".producto-id"
            ).value.trim();


        const cantidadInput =
            fila.querySelector(
                ".producto-cantidad"
            );


        if (!productoId) {

            cantidadInput.removeAttribute(
                "max"
            );


            const stockInfo =
                fila.querySelector(
                    ".stock-disponible"
                );


            if (stockInfo) {
                stockInfo.remove();
            }


            return;
        }


        /*
         * Stock original del producto
         */

        const stockTotal =
            convertirNumero(
                fila.dataset.stock
            );


        /*
         * Cantidad de esta misma fila
         */

        const cantidadActual =
            convertirNumero(
                cantidadInput.value
            );


        /*
         * Cantidad utilizada por las
         * demás filas del mismo producto
         */

        const cantidadTotalProducto =
            cantidadesPorProducto[
                productoId
            ] || 0;


        const cantidadOtrasFilas =
            cantidadTotalProducto -
            cantidadActual;


        /*
         * Cuánto podemos agregar todavía
         * a ESTA fila.
         */

        const disponibleParaFila =
            stockTotal -
            cantidadOtrasFilas;


        /*
         * Cuánto queda disponible después
         * de la cantidad actual.
         */

        const disponibleRestante =
            stockTotal -
            cantidadTotalProducto;


        /*
         * Actualizar max del input
         */

        cantidadInput.max =
            Math.max(
                1,
                Math.floor(
                    disponibleParaFila
                )
            );


        /*
         * Mostrar información
         */

        let stockInfo =
            fila.querySelector(
                ".stock-disponible"
            );


        if (!stockInfo) {

            stockInfo =
                document.createElement(
                    "small"
                );

            stockInfo.className =
                "stock-disponible";

            cantidadInput.parentElement.appendChild(
                stockInfo
            );
        }


        /*
         * Stock insuficiente
         */

        if (
            cantidadTotalProducto >
            stockTotal
        ) {

            stockInfo.textContent =
                `Stock insuficiente · ` +
                `Excedido: ${
                    cantidadTotalProducto -
                    stockTotal
                }`;

            stockInfo.style.color =
                "#ef4444";

        }

        else {

            stockInfo.textContent =
                `Disponible restante: ` +
                `${disponibleRestante}`;

            stockInfo.style.color =
                "";

        }

    });

}

    /* =====================================================
       EVENTOS DE INPUT DE PRODUCTOS
    ===================================================== */

    tablaProductos.addEventListener(
        "input",
        event => {

            const fila =
                obtenerFila(event);


            if (!fila) {
                return;
            }


            /*
             * ==========================================
             * BUSCAR POR NOMBRE
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-nombre"
                )
            ) {

                const resultados =
                    obtenerResultadosProductos(
                        event.target.value
                    );


                mostrarResultadosProductos(
                    fila,
                    resultados
                );

            }


            /*
             * ==========================================
             * BUSCAR POR CÓDIGO
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-codigo"
                )
            ) {

                const resultados =
                    obtenerResultadosProductos(
                        event.target.value
                    );


                mostrarResultadosProductos(
                    fila,
                    resultados
                );

            }


            /*
             * ==========================================
             * CANTIDAD
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-cantidad"
                )
            ) {

                validarCantidad(fila);

                actualizarSubtotalFila(
                    fila
                );

                actualizarDisponibilidadStock();

            }


            /*
             * ==========================================
             * PRECIO
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-precio"
                )
            ) {

                validarPrecio(fila);

                actualizarSubtotalFila(
                    fila
                );

            }

        }
    );


    /* =====================================================
       CAMBIO DE IVA
    ===================================================== */

    tablaProductos.addEventListener(
        "change",
        event => {

            const fila =
                obtenerFila(event);


            if (!fila) {
                return;
            }


            if (
                event.target.classList.contains(
                    "producto-iva"
                )
            ) {

                actualizarSubtotalFila(
                    fila
                );
            }

        }
    );


    /* =====================================================
       TECLA ENTER
    ===================================================== */

    tablaProductos.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }


            const fila =
                obtenerFila(event);


            if (!fila) {
                return;
            }


            event.preventDefault();


            /*
             * ==========================================
             * CÓDIGO
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-codigo"
                )
            ) {

                const encontrado =
                    buscarProductoPorCodigo(
                        fila
                    );


                if (encontrado) {
                    return;
                }


                /*
                 * Si no encuentra por código,
                 * pasa a búsqueda por nombre.
                 */

                fila.querySelector(
                    ".producto-nombre"
                ).focus();

                return;
            }


            /*
             * ==========================================
             * NOMBRE
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-nombre"
                )
            ) {

                const resultados =
                    fila.querySelector(
                        ".productos-resultados"
                    );


                const primerResultado =
                    resultados.querySelector(
                        ".autocomplete-item"
                    );


                if (primerResultado) {

                    primerResultado.click();

                    return;
                }


                fila.querySelector(
                    ".producto-cantidad"
                ).focus();

                return;
            }


            /*
             * ==========================================
             * CANTIDAD -> PRECIO
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-cantidad"
                )
            ) {

                fila.querySelector(
                    ".producto-precio"
                ).focus();

                return;
            }


            /*
             * ==========================================
             * PRECIO -> IVA
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-precio"
                )
            ) {

                fila.querySelector(
                    ".producto-iva"
                ).focus();

                return;
            }


            /*
             * ==========================================
             * IVA -> SIGUIENTE FILA
             * ==========================================
             */

            if (
                event.target.classList.contains(
                    "producto-iva"
                )
            ) {

                const filas =
                    Array.from(
                        tablaProductos.querySelectorAll(
                            ".producto-row"
                        )
                    );


                const indice =
                    filas.indexOf(fila);


                /*
                 * Si estamos en la última fila,
                 * generar una nueva.
                 */

                if (
                    indice ===
                    filas.length - 1
                ) {

                    agregarFilaProducto();

                }


                const siguienteFila =
                    tablaProductos.querySelectorAll(
                        ".producto-row"
                    )[indice + 1];


                if (siguienteFila) {

                    siguienteFila.querySelector(
                        ".producto-codigo"
                    ).focus();

                }

            }

        }
    );


    /* =====================================================
       AGREGAR FILA
    ===================================================== */

    function agregarFilaProducto() {

        const filas =
            tablaProductos.querySelectorAll(
                ".producto-row"
            );


        if (filas.length === 0) {
            return null;
        }


        const ultimaFila =
            filas[
                filas.length - 1
            ];


        const nuevaFila =
            ultimaFila.cloneNode(true);


        limpiarFila(
            nuevaFila
        );


        /*
         * Limpiar autocompletados
         */

        nuevaFila
            .querySelectorAll(
                ".autocomplete-results"
            )
            .forEach(elemento => {

                elemento.innerHTML = "";

                elemento.classList.remove(
                    "active"
                );

            });


        tablaProductos.appendChild(
            nuevaFila
        );


        return nuevaFila;
    }


    btnAgregarProducto.addEventListener(
        "click",
        () => {

            const nuevaFila =
                agregarFilaProducto();


            if (nuevaFila) {

                nuevaFila.querySelector(
                    ".producto-codigo"
                ).focus();

            }

        }
    );


    /* =====================================================
       ELIMINAR FILA
    ===================================================== */

    tablaProductos.addEventListener(
        "click",
        event => {

            const boton =
                event.target.closest(
                    ".btn-delete-product"
                );


            if (!boton) {
                return;
            }


            const fila =
                boton.closest(
                    ".producto-row"
                );


            const filas =
                tablaProductos.querySelectorAll(
                    ".producto-row"
                );


            /*
             * Mantener siempre una fila.
             */

            if (filas.length === 1) {

                limpiarFila(fila);

                calcularTotalesFactura();

                return;
            }


            fila.remove();

            calcularTotalesFactura();

            actualizarDisponibilidadStock();

        }
    );


    /* =====================================================
       CERRAR AUTOCOMPLETADOS AL HACER CLICK FUERA
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".autocomplete-container"
                )
            ) {

                document
                    .querySelectorAll(
                        ".autocomplete-results"
                    )
                    .forEach(elemento => {

                        elemento.classList.remove(
                            "active"
                        );

                    });

            }

        }
    );


    /* =====================================================
       OBTENER FILAS CON PRODUCTOS
    ===================================================== */

    function obtenerFilasConProducto() {

        const filas =
            Array.from(
                tablaProductos.querySelectorAll(
                    ".producto-row"
                )
            );


        return filas.filter(fila => {

            const productoId =
                fila.querySelector(
                    ".producto-id"
                ).value.trim();


            const codigo =
                fila.querySelector(
                    ".producto-codigo"
                ).value.trim();


            const nombre =
                fila.querySelector(
                    ".producto-nombre"
                ).value.trim();


            return (
                productoId ||
                codigo ||
                nombre
            );

        });
    }


    /* =====================================================
       VALIDACIÓN ANTES DE GUARDAR
    ===================================================== */

    formFactura.addEventListener(
        "submit",
        event => {

            /* =============================================
               CLIENTE
            ============================================== */

            if (clienteId && !clienteId.value) {

                event.preventDefault();

                alert(
                    "Debe seleccionar un cliente."
                );

                if (clienteBusqueda) clienteBusqueda.focus();

                return;
            }


            /* =============================================
               FILAS
            ============================================== */

            const filas =
                obtenerFilasConProducto();


            if (filas.length === 0) {

                event.preventDefault();

                alert(
                    "Debe agregar al menos un producto a la factura."
                );

                return;
            }


            /* =============================================
               VALIDAR CADA PRODUCTO
            ============================================== */

            for (const fila of filas) {

                const productoId =
                    fila.querySelector(
                        ".producto-id"
                    ).value.trim();


                /*
                 * Producto seleccionado
                 */

                if (!productoId) {

                    event.preventDefault();

                    alert(
                        "Uno de los productos no ha sido seleccionado correctamente."
                    );

                    fila.querySelector(
                        ".producto-nombre"
                    ).focus();

                    return;
                }


                /*
                 * Cantidad
                 */

                if (!validarCantidad(fila)) {

                    event.preventDefault();

                    fila.querySelector(
                        ".producto-cantidad"
                    ).focus();

                    return;
                }


                /*
                 * Precio
                 */

                if (!validarPrecio(fila)) {

                    event.preventDefault();

                    fila.querySelector(
                        ".producto-precio"
                    ).focus();

                    return;
                }

            }


            /* =============================================
               VALIDAR STOCK ACUMULADO
            ============================================== */

            const validacionStock =
                validarStockFactura();


            if (!validacionStock.valido) {

                event.preventDefault();

                alert(
                    `Stock insuficiente.\n\n` +
                    `Cantidad solicitada: ` +
                    `${validacionStock.cantidadSolicitada}\n` +
                    `Stock disponible: ` +
                    `${validacionStock.stockDisponible}`
                );

                return;
            }


            /* =============================================
               MOSTRAR MODAL DE RESUMEN ANTES DE ENVIAR
            ============================================== */

            if (modalResumen && !facturaConfirmada) {
                event.preventDefault();
                abrirModalResumen();
                return;
            }


        }
    );


    /* =====================================================
       LÓGICA DEL MODAL DE RESUMEN DE FACTURA
    ===================================================== */

    const modalResumen = document.getElementById("modal-resumen-factura");
    const btnModalCancelar = document.getElementById("btn-modal-cancelar");
    const btnModalConfirmar = document.getElementById("btn-modal-confirmar");
    let facturaConfirmada = false;

    function abrirModalResumen() {
        if (!modalResumen) return;

        // Cliente info
        const clienteNom = (razonSocial && razonSocial.value) || (nombreCliente && nombreCliente.value) || (clienteBusqueda && clienteBusqueda.value) || "Cliente General";
        const clienteDoc = (numeroIdentificacion && numeroIdentificacion.value) || "-";
        const docElem = document.getElementById("modal-cliente-doc");
        const nomElem = document.getElementById("modal-cliente-nombre");
        if (nomElem) nomElem.textContent = clienteNom;
        if (docElem) docElem.textContent = clienteDoc;

        // Vendedor info
        const usuarioSelect = document.getElementById("usuario_id");
        const vendedorNom = usuarioSelect && usuarioSelect.selectedOptions.length > 0 ? usuarioSelect.selectedOptions[0].text : "-";
        const vendElem = document.getElementById("modal-vendedor-nombre");
        if (vendElem) vendElem.textContent = vendedorNom;

        // Método de pago info
        const metodoSelect = document.getElementById("metodo_pago_id");
        const metodoNom = metodoSelect && metodoSelect.selectedOptions.length > 0 ? metodoSelect.selectedOptions[0].text : "-";
        const metodoElem = document.getElementById("modal-metodo-pago");
        if (metodoElem) metodoElem.textContent = metodoNom;

        // Consecutivo / Número de factura
        const numeroFacElem = document.getElementById("numero_factura");
        const modalNumElem = document.getElementById("modal-numero-factura");
        if (numeroFacElem && modalNumElem) {
            modalNumElem.textContent = numeroFacElem.textContent.trim();
        }

        // Productos
        const tbodyItems = document.getElementById("modal-tabla-items");
        if (tbodyItems) {
            tbodyItems.innerHTML = "";
            const filas = obtenerFilasConProducto();
            filas.forEach(fila => {
                const nombre = fila.querySelector(".producto-nombre").value || "Producto";
                const cant = fila.querySelector(".producto-cantidad").value || "1";
                const precio = fila.querySelector(".producto-precio").value || "0";
                const iva = fila.querySelector(".producto-iva") ? fila.querySelector(".producto-iva").value : "19";
                const subtotal = fila.querySelector(".producto-subtotal") ? fila.querySelector(".producto-subtotal").value : precio;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${nombre}</strong></td>
                    <td>${cant}</td>
                    <td>${formatearMoneda(precio)}</td>
                    <td>${iva}%</td>
                    <td><strong>${formatearMoneda(subtotal)}</strong></td>
                `;
                tbodyItems.appendChild(tr);
            });
        }

        // Totales
        const subtotalElem = document.getElementById("modal-subtotal");
        const ivaElem = document.getElementById("modal-iva");
        const totalElem = document.getElementById("modal-total");

        if (subtotalElem && subtotalFactura) subtotalElem.textContent = subtotalFactura.textContent;
        if (ivaElem && ivaFactura) ivaElem.textContent = ivaFactura.textContent;
        if (totalElem && totalFactura) totalElem.textContent = totalFactura.textContent;

        modalResumen.classList.add("active");
    }

    function cerrarModalResumen() {
        if (modalResumen) {
            modalResumen.classList.remove("active");
        }
    }

    if (btnModalCancelar) {
        btnModalCancelar.addEventListener("click", () => {
            cerrarModalResumen();
        });
    }

    if (btnModalConfirmar) {
        btnModalConfirmar.addEventListener("click", () => {
            facturaConfirmada = true;
            cerrarModalResumen();
            if (typeof formFactura.requestSubmit === "function") {
                formFactura.requestSubmit();
            } else {
                HTMLFormElement.prototype.submit.call(formFactura);
            }
        });
    }



    /* =====================================================
       CÁLCULO INICIAL
    ===================================================== */

    calcularTotalesFactura();

});