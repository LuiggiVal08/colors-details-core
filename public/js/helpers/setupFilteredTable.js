// helpers/setupFilteredTable.js
import fillTable from './fillTable.js';
/**
 * Función para crear una tabla con filtrado
 * @param {object} data - Array de datos a filtrar
 * @param {object} filterInputs - Objeto con las entradas de filtro
 * @param {function} filterFn - Función para filtrar los datos
 * @param {object} fillTableOptions - Opciones para el fillTable
 * @param {string} fillTableOptions.templateId - ID del template a usar
 * @param {string} fillTableOptions.tableSelector - Selector de la tabla
 * @param {object} fillTableOptions.actions - Acciones a realizar en la tabla
 * @param {object} fillTableOptions.formatters - Formateadores para los datos
 * @param {object} fillTableOptions.formatters.key - Formateador para la clave
 * @param {object} paginationButtons - Botones de paginación
 * @param {number} paginationButtons.prev - Botón de paginación anterior
 * @param {number} paginationButtons.next - Botón de paginación siguiente
 * @param {number} itemsPerPage - Cantidad de elementos por página
 */
export const setupFilteredTable = ({
    data,
    filterInputs = {}, // { clave: inputElement }
    filterFn = (item) => true, // (item, inputs) => boolean
    fillTableOptions = {},
    paginationButtons,
    itemsPerPage = 4,
}) => {
    let paginaActual = 1;
    let datosFiltrados = [];

    const aplicarFiltros = () => {
        datosFiltrados = data.filter((item) => filterFn(item, filterInputs));
        paginaActual = 1;
        actualizarTablaPaginada();
    };

    const actualizarTablaPaginada = () => {
        const totalPaginas = Math.ceil(datosFiltrados.length / itemsPerPage);
        if (paginaActual > totalPaginas) paginaActual = totalPaginas || 1;
        const inicio = (paginaActual - 1) * itemsPerPage;
        const datosPagina = datosFiltrados.slice(inicio, inicio + itemsPerPage);

        fillTable(
            fillTableOptions.templateId,
            datosPagina,
            fillTableOptions.tableSelector,
            fillTableOptions.actions,
            fillTableOptions.formatters,
        );

        if (paginationButtons) {
            paginationButtons.prev.disabled = paginaActual === 1;
            paginationButtons.next.disabled = paginaActual >= totalPaginas;
        }
    };

    // Eventos de filtros
    for (const [_, input] of Object.entries(filterInputs)) {
        if (!input) continue;
        const eventType = input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input';
        input.addEventListener(eventType, aplicarFiltros);
    }

    if (paginationButtons) {
        paginationButtons.prev.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                actualizarTablaPaginada();
            }
        });

        paginationButtons.next.addEventListener('click', () => {
            const totalPaginas = Math.ceil(datosFiltrados.length / itemsPerPage);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                actualizarTablaPaginada();
            }
        });
    }

    aplicarFiltros();
};
