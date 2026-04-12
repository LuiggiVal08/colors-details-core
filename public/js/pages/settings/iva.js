import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import { httpClient } from '../../index.js';
document.getElementById('update-iva').addEventListener('click', async () => {
    const modal = document.getElementById('iva-modal');
    if (!modal) {
        console.error('Modal de tasa de cambio no encontrado');
        return;
    }
    setupModalLifecycle(modal);
});
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/iva');
    const { data: ivas } = response;
    setupFilteredTable({
        data: ivas,
        fillTableOptions: {
            templateId: 'fila-ejemplo-iva',
            tableSelector: '#table-iva',
            actions: {
                editar: (e) => {
                    editIva(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                usuario: (dato) => dato.usuario.username,
                porcentaje: (dato) => `${dato.porcentaje}%`,
                fecha: (dato) => new Date(dato.fecha).toLocaleDateString(),
                rowClass: (dato) => (dato.activa ? '!bg-green-400/10 !border-green-400/50' : ''),
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-iva .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-iva .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 4,
    });
});
