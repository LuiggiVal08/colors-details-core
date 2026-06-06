import { Format } from '../helpers/Format.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import setupTabs from '../helpers/setupTabs.js';
import { httpClient } from '../index.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';

function mapEstado(e) {
    if (!e) return 'Desconocido';
    const map = { paid: 'Pagado', partial: 'Parcial', pending: 'Pendiente' };
    return map[e] ?? String(e);
}

let periodosCache = [];

function populatePeriodSelector(periodos, serviceId) {
    const select = document.getElementById('periodo_selector');
    const hidden = document.getElementById('payment_periodo_id');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar periodo...</option>';

    const pendientes = periodos.filter((p) => p.estado !== 'paid' && p.estado !== 'canceled');
    if (pendientes.length === 0) {
        select.innerHTML += '<option value="" disabled>No hay periodos pendientes</option>';
        return;
    }

    pendientes.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.mes}/${p.anualidad} — ${mapEstado(p.estado)} — Corte: ${p.fecha_corte ? new Date(p.fecha_corte).toLocaleDateString() : '-'}`;
        select.appendChild(opt);
    });

    if (hidden) hidden.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs('#tabs-service');
});
document.addEventListener('DOMContentLoaded', async () => {
    const locationPage = location.href;
    const id = locationPage.split('/').pop();
    const responde = await httpClient.get(`/service/${id}`);

    const { data: service, error } = responde || {};

    if (error || !service) {
        console.warn('No se pudo cargar el servicio o la respuesta no tiene datos', responde);
    }

    // Cargar periodos para la tabla de pagos
    try {
        const respPeriodos = await httpClient.get(`/service-period/by-service/${id}`);
        periodosCache = Array.isArray(respPeriodos?.data)
            ? respPeriodos.data
            : Array.isArray(respPeriodos)
            ? respPeriodos
            : respPeriodos?.data?.data ?? [];
    } catch (err) {
        console.error('Error cargando periodos para la tabla:', err);
        periodosCache = [];
    }

    setupFilteredTable({
        data: periodosCache,

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
                pago_tardio: (dato) => (dato.pago_tardio ? 'Tardío' : 'No Tardío'),
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

    // Poblar selector de periodos antes de abrir
    populatePeriodSelector(periodosCache, id);

    setupModalLifecycle(modal);

    const fieldServiceId = modal.querySelector('[data-field="service-id"]');
    if (fieldServiceId) fieldServiceId.value = id;
});
