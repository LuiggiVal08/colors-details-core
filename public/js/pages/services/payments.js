import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

function formatMoney(value) {
    if (value === null || value === undefined) return '-';
    const n = Number(String(value).replace(',', '.'));
    if (Number.isNaN(n)) return value;
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' Bs.';
}

export async function initPayments(serviceId) {
    const btnOpenHistory = document.getElementById('btn-open-payment-history');
    const modal = document.getElementById('modal-payment-history');
    const wrap = document.getElementById('payment-history-table-wrap');

    if (!btnOpenHistory || !modal || !wrap) return;

    btnOpenHistory.addEventListener('click', async () => {
        setupModalLifecycle(modal);

        wrap.innerHTML = '<div class="text-sm text-gray-600">Cargando historial...</div>';
        try {
            // Intentar varias fuentes: 1) service/:id (campo pagos o transacciones), 2) fallback empty
            const resp = await httpClient.get(`/service/${serviceId}`);
            const service = resp?.data ?? resp;

            let pagos = [];
            if (Array.isArray(service?.pagos) && service.pagos.length) pagos = service.pagos;
            else if (Array.isArray(service?.transacciones) && service.transacciones.length)
                pagos = service.transacciones;

            if (!pagos.length) {
                // Intentamos buscar transacciones directas (si existe un endpoint futuro)
                // const alt = await httpClient.get(`/service-transactions/${serviceId}`);
                // pagos = Array.isArray(alt?.data) ? alt.data : pagos;
            }

            if (!pagos.length) {
                wrap.innerHTML = '<div class="text-sm text-gray-600">No hay pagos registrados.</div>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'w-full border-collapse';
            table.innerHTML = `
        <thead class='[&_tr]:border-b border-red-400/50'>
          <tr>
            <th class='text-left p-2'>Fecha</th>
            <th class='text-left p-2'>Periodo</th>
            <th class='text-right p-2'>Monto</th>
            <th class='text-left p-2'>Usuario</th>
            <th class='text-left p-2'>Referencia</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
            const tbody = table.querySelector('tbody');

            pagos.forEach((p) => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-red-400/30 hover:bg-pink-50';
                const fecha = p.fecha_pago
                    ? new Date(p.fecha_pago).toLocaleDateString()
                    : p.fecha_generada
                    ? new Date(p.fecha_generada).toLocaleDateString()
                    : p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString()
                    : '-';
                const periodo = p.periodo
                    ? `${p.periodo.mes || '-'} / ${p.periodo.anualidad || '-'}`
                    : p.periodo_id
                    ? p.periodo_id
                    : '-';
                const monto = p.monto ?? p.monto_aplicado ?? p.amount ?? '-';
                const usuario = p.usuario ? p.usuario.nombre ?? p.usuario.username ?? '-' : p.usuario_id ?? '-';
                const ref = p.referencia ?? p.referencia_pago ?? '-';

                tr.innerHTML = `
          <td class='p-2'>${fecha}</td>
          <td class='p-2'>${periodo}</td>
          <td class='p-2 text-right'>${formatMoney(monto)}</td>
          <td class='p-2'>${usuario}</td>
          <td class='p-2'>${ref}</td>
        `;
                tbody.appendChild(tr);
            });

            wrap.innerHTML = '';
            wrap.appendChild(table);
        } catch (err) {
            console.error('Error cargando historial de pagos', err);
            wrap.innerHTML = '<div class="text-sm text-red-500">Error cargando historial.</div>';
        }
    });
}
