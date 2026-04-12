/**
 * Fills a table with data
 * @param {string} idTemplate - ID of the template to use
 * @param {array} data - Array of data to fill the table
 * @param {string} containerTable - CSS selector of the table container
 * @param {object} functions - Object with functions to call when a button is clicked
 * @param {object} opcions - Object with options to customize the table
 */
const fillTable = (idTemplate, data = [], containerTable, functions = {}, opcions = {}) => {
    const template = document.getElementById(idTemplate);
    if (!template) {
        console.error(`No se encontró el template con ID: ${idTemplate}`);
        return;
    }

    const tbody = document.querySelector(containerTable);
    if (!tbody) {
        console.error(`No se encontró el contenedor de la tabla: ${containerTable}`);
        return;
    }

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (data.length === 0) {
        const countCell = template.content.querySelectorAll('td').length;
        const noResultsRow = document.createElement('tr');
        const noResultsCell = document.createElement('td');
        noResultsCell.colSpan = countCell;
        noResultsCell.textContent = 'Sin resultados';
        noResultsCell.classList.add('text-center', 'p-3');
        noResultsRow.appendChild(noResultsCell);
        tbody.appendChild(noResultsRow);
        return;
    }

    data.forEach((rowDato) => {
        const clon = template.content.cloneNode(true);
        const row = clon.querySelector('tr');

        // Clase condicional por fila (aún útil si quieres pintar filas completas con algún color)
        if (opcions.rowClass && typeof opcions.rowClass === 'function') {
            const rowClass = opcions.rowClass(rowDato);
            if (rowClass) {
                const clases = rowClass.split(' ').filter(Boolean); // separa por espacios y limpia vacíos
                row.classList.add(...clases); // mete todas las clases
            }
        }

        clon.querySelectorAll('[data-key]').forEach((celda) => {
            const key = celda.getAttribute('data-key');
            if (!key) return;

            // Si pasaste una función custom para este campo en "opcions"
            let value = opcions[key]
                ? opcions[key](rowDato)
                : key.split('.').reduce((obj, prop) => obj?.[prop], rowDato);

            // Si es tipo imagen
            if (celda.dataset.tipo === 'imagen') {
                const img = document.createElement('img');
                const baseImg = celda.getAttribute('data-baseimg') || '';
                img.src = baseImg + value;
                img.classList.add('miniatura');
                celda.appendChild(img);
            } else if (value instanceof Node) {
                celda.innerHTML = ''; // por si acaso
                celda.appendChild(value);
            } else if (celda.dataset.tipo === 'html') {
                celda.innerHTML = value || '-';
            } else {
                celda.textContent = value || '-';
            }

            // Clase condicional por celda
            if (opcions.cellClass && typeof opcions.cellClass === 'function') {
                const cellClass = opcions.cellClass(rowDato, key);
                if (cellClass) {
                    celda.classList.add(cellClass);
                }
            }
        });

        clon.querySelectorAll('[data-idfield]').forEach((btn) => {
            const idField = btn.getAttribute('data-idfield');
            const idValue = rowDato[idField];

            if (idValue) {
                btn.dataset.idModel = idValue;
                const nameFunction = btn.getAttribute('data-btn');
                if (nameFunction && functions[nameFunction] && typeof functions[nameFunction] === 'function') {
                    btn.onclick = (e) => functions[nameFunction](e);
                }
            }
        });

        tbody.appendChild(clon);
    });
};

export default fillTable;
