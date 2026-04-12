import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

function formatMoney(value) {
    if (value === null || value === undefined) return '-';
    const n = Number(String(value).replace(',', '.'));
    if (Number.isNaN(n)) return value;
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' Bs.';
}

function mapEstado(e) {
    if (!e) return 'Desconocido';
    const map = { paid: 'Pagado', partial: 'Parcial', pending: 'Pendiente' };
    return map[e] ?? String(e);
}

export async function initPeriods(serviceId) {
    const btnOpenModal = document.getElementById('btn-open-period-modal');
    const modal = document.getElementById('modal-period-service');
    const periodsContainer = document.getElementById('periods-container');

    if (btnOpenModal && modal) {
        btnOpenModal.addEventListener('click', () => {
            const hidden = modal.querySelector('#periodo_servicio_id');
            if (hidden) hidden.value = serviceId;
            setupModalLifecycle(modal);
        });
    }

    // Cargar periodos y renderizar en container
    if (periodsContainer) {
        try {
            const resp = await httpClient.get(`/service-period/by-service/${serviceId}`);
            const periodos = Array.isArray(resp?.data)
                ? resp.data
                : Array.isArray(resp)
                ? resp
                : resp?.data?.data ?? [];
            if (!Array.isArray(periodos) || periodos.length === 0) {
                periodsContainer.innerHTML = '<div class="text-sm text-gray-600">No hay periodos.</div>';
                return;
            }

            const list = document.createElement('div');
            list.className = 'space-y-2';

            periodos.forEach((p) => {
                const el = document.createElement('div');
                el.className = 'p-3 border rounded-md bg-white/50 flex justify-between items-center';
                const left = document.createElement('div');
                left.innerHTML = `<div class="font-medium">Periodo ${p.mes || '-'} / ${
                    p.anualidad || '-'
                }</div><div class="text-sm text-gray-700">Generado: ${
                    p.fecha_generada ? new Date(p.fecha_generada).toLocaleDateString() : '-'
                } — Corte: ${
                    p.fecha_corte ? new Date(p.fecha_corte).toLocaleDateString() : '-'
                }</div><div class='text-sm text-gray-600'>Estado: ${mapEstado(p.estado)}</div>`;
                const right = document.createElement('div');
                right.className = 'text-right';
                right.innerHTML = `<div class="font-semibold">${formatMoney(
                    p.amount_due ?? p.amount ?? '-',
                )}</div><div class="text-sm text-gray-600">Saldo: ${formatMoney(p.amount_balance ?? '-')}</div>`;
                el.appendChild(left);
                el.appendChild(right);
                list.appendChild(el);
            });

            periodsContainer.innerHTML = '';
            periodsContainer.appendChild(list);
            periodsContainer.classList.remove('hidden');
        } catch (err) {
            periodsContainer.innerHTML = '<div class="text-sm text-red-500">Error cargando periodos.</div>';
            console.error(err);
        }
    }
}
