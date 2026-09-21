/**
 * SIGMAFER - COMPONENTE MODULAR DE PAGINACIÓN INTERACTIVA
 * 
 * Permite paginar cualquier tabla del sistema integrándose en tiempo real
 * con los buscadores de texto y filtros desplegables.
 */

class PaginadorSigmafer {
    constructor(opciones) {
        this.containerId = opciones.containerId;
        this.rowsSelector = opciones.rowsSelector;
        this.noResultsId = opciones.noResultsId || null;
        this.itemsPerPage = opciones.itemsPerPageDefault || 10;
        this.itemsPerPageOptions = opciones.itemsPerPageOptions || [10, 25, 50, 100];
        this.filterCallback = opciones.filterCallback || (() => true);
        this.currentPage = 1;
        this.filteredRows = [];
        this.allRows = [];

        this.init();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) return;

        this.actualizarFilas();
        this.renderEstructura();
        this.actualizar();
    }

    actualizarFilas() {
        this.allRows = Array.from(document.querySelectorAll(this.rowsSelector));
    }

    renderEstructura() {
        if (!this.container) return;

        const optionsHtml = this.itemsPerPageOptions
            .map(opt => `<option value="${opt}" ${opt === this.itemsPerPage ? 'selected' : ''}>${opt}</option>`)
            .join('');

        this.container.className = 'pagination-container';
        this.container.innerHTML = `
            <div class="pagination-left">
                <span class="pagination-label">Mostrar</span>
                <select class="pagination-select" id="${this.containerId}-select">
                    ${optionsHtml}
                </select>
                <span class="pagination-label">por página</span>
            </div>

            <div class="pagination-info" id="${this.containerId}-info">
                Cargando registros...
            </div>

            <div class="pagination-controls" id="${this.containerId}-controls">
            </div>
        `;

        const selectElem = document.getElementById(`${this.containerId}-select`);
        if (selectElem) {
            selectElem.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value, 10);
                this.currentPage = 1;
                this.actualizar();
            });
        }
    }

    actualizar() {
        this.actualizarFilas();

        // 1. Filtrar filas según el callback de búsqueda y filtros
        this.filteredRows = this.allRows.filter(row => this.filterCallback(row));

        const totalFiltrados = this.filteredRows.length;
        const totalPaginas = Math.ceil(totalFiltrados / this.itemsPerPage) || 1;

        if (this.currentPage > totalPaginas) {
            this.currentPage = totalPaginas;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        // 2. Ocultar todas las filas primero
        this.allRows.forEach(row => {
            row.style.display = 'none';
        });

        // 3. Mostrar solo las filas correspondientes a la página activa
        const inicio = (this.currentPage - 1) * this.itemsPerPage;
        const fin = inicio + this.itemsPerPage;
        const filasPagina = this.filteredRows.slice(inicio, fin);

        filasPagina.forEach(row => {
            row.style.display = 'grid'; // Formato de fila en SigmaFer
        });

        // 4. Manejar mensaje de sin resultados
        if (this.noResultsId) {
            const noResultsElem = document.getElementById(this.noResultsId);
            if (noResultsElem) {
                if (this.allRows.length > 0 && totalFiltrados === 0) {
                    noResultsElem.style.display = 'flex';
                } else {
                    noResultsElem.style.display = 'none';
                }
            }
        }

        // 5. Actualizar texto informativo
        const infoElem = document.getElementById(`${this.containerId}-info`);
        if (infoElem) {
            if (totalFiltrados === 0) {
                infoElem.innerHTML = `No se encontraron registros`;
            } else {
                const desde = inicio + 1;
                const hasta = Math.min(fin, totalFiltrados);
                infoElem.innerHTML = `Mostrando <strong>${desde}</strong> a <strong>${hasta}</strong> de <strong>${totalFiltrados}</strong> registros`;
            }
        }

        // 6. Renderizar controles de navegación
        this.renderControles(totalPaginas);
    }

    renderControles(totalPaginas) {
        const controlsElem = document.getElementById(`${this.containerId}-controls`);
        if (!controlsElem) return;

        if (this.filteredRows.length === 0 || totalPaginas <= 1) {
            controlsElem.innerHTML = '';
            return;
        }

        let html = '';

        // Botón Primera Página
        html += `
            <button type="button" class="btn-page" data-page="1" ${this.currentPage === 1 ? 'disabled' : ''} title="Primera página">
                <i class="fa-solid fa-angles-left"></i>
            </button>
        `;

        // Botón Página Anterior
        html += `
            <button type="button" class="btn-page" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''} title="Página anterior">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
        `;

        // Generar números de página con elipsis inteligente
        const delta = 2; // Rango de páginas adyacentes a mostrar
        const rango = [];
        for (let i = Math.max(2, this.currentPage - delta); i <= Math.min(totalPaginas - 1, this.currentPage + delta); i++) {
            rango.push(i);
        }

        // Página 1 siempre visible
        html += `
            <button type="button" class="btn-page ${this.currentPage === 1 ? 'active' : ''}" data-page="1">
                1
            </button>
        `;

        if (this.currentPage - delta > 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }

        rango.forEach(p => {
            html += `
                <button type="button" class="btn-page ${this.currentPage === p ? 'active' : ''}" data-page="${p}">
                    ${p}
                </button>
            `;
        });

        if (this.currentPage + delta < totalPaginas - 1) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }

        // Última página siempre visible si hay más de 1
        if (totalPaginas > 1) {
            html += `
                <button type="button" class="btn-page ${this.currentPage === totalPaginas ? 'active' : ''}" data-page="${totalPaginas}">
                    ${totalPaginas}
                </button>
            `;
        }

        // Botón Siguiente
        html += `
            <button type="button" class="btn-page" data-page="${this.currentPage + 1}" ${this.currentPage === totalPaginas ? 'disabled' : ''} title="Página siguiente">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;

        // Botón Última Página
        html += `
            <button type="button" class="btn-page" data-page="${totalPaginas}" ${this.currentPage === totalPaginas ? 'disabled' : ''} title="Última página">
                <i class="fa-solid fa-angles-right"></i>
            </button>
        `;

        controlsElem.innerHTML = html;

        // Asignar listeners a los botones generados
        controlsElem.querySelectorAll('.btn-page').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = parseInt(e.currentTarget.getAttribute('data-page'), 10);
                if (targetPage && targetPage !== this.currentPage && targetPage >= 1 && targetPage <= totalPaginas) {
                    this.currentPage = targetPage;
                    this.actualizar();
                }
            });
        });
    }
}

// Función global de ayuda para instanciación rápida
window.inicializarPaginador = function(opciones) {
    return new PaginadorSigmafer(opciones);
};
