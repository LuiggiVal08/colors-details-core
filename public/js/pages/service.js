import { Format } from '../helpers/Format.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import setupTabs from '../helpers/setupTabs.js';
import { httpClient } from '../index.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
document.addEventListener('DOMContentLoaded', () => {
    setupTabs('#tabs-service'); // selector del contenedor donde están los botones
});
document.addEventListener('DOMContentLoaded', async () => {
    const locationPage = location.href;
    const id = locationPage.split('/').pop();
    const responde = await httpClient.get(`/service/${id}`);

    const { data: service, error } = responde || {};

    if (error || !service) {
        console.warn('No se pudo cargar el servicio o la respuesta no tiene datos', responde);
    }

    // Cargar periodos para la tabla de pagos (la API separa periodos)
    let periodosData = [];
    try {
        const respPeriodos = await httpClient.get(`/service-period/by-service/${id}`);
        periodosData = Array.isArray(respPeriodos?.data)
            ? respPeriodos.data
            : Array.isArray(respPeriodos)
            ? respPeriodos
            : respPeriodos?.data?.data ?? [];
    } catch (err) {
        console.error('Error cargando periodos para la tabla:', err);
        periodosData = [];
    }

    setupFilteredTable({
        data: periodosData,

        fillTableOptions: {
            templateId: 'fila-ejemplo-pago-servicio',
            tableSelector: '#table-service-pagos',
            actions: {
                editar: (e) => {
                    editPago(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                periodo: (dato) => `${dato.mes}/${dato.anualidad}`,
                fecha_pago: (dato) =>
                    dato.fecha_pago
                        ? new Date(dato.fecha_pago).toLocaleDateString()
                        : dato.fecha_generada
                        ? new Date(dato.fecha_generada).toLocaleDateString()
                        : 'Pendiente',
                fecha_corte: (dato) => (dato.fecha_corte ? new Date(dato.fecha_corte).toLocaleDateString() : '-'),
                monto: (dato) => (dato.amount_due ? `${Format.float(String(dato.amount_due))} Bs.` : '-'),
                pago_tardio: (dato) => (dato.pago_tardio ? 'Tardio' : 'No Tardio'),
                pagado: (dato) =>
                    dato.estado === 'paid' ? 'Pagado' : dato.estado === 'partial' ? 'Parcial' : 'Pendiente',
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-pagos .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-pagos .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 4,
    });
});
document.getElementById('btn-registrar-pago-servicio').addEventListener('click', async (e) => {
    const id = e.currentTarget.getAttribute('data-idfield');

    const modal = document.getElementById('modal-pay-service');
    if (!modal) {
        console.error('No se encontró el modal de registrar pago');
        return;
    }

    // Si necesitas cargar info antes de abrir el modal, aquí:
    // await cargarDatosDelServicio(id);

    // Inicializas el ciclo de vida del modal
    setupModalLifecycle(modal);

    // Si necesitas rellenar campos del modal:
    const fieldServiceId = modal.querySelector('[data-field="service-id"]');
    if (fieldServiceId) fieldServiceId.value = id;
});
