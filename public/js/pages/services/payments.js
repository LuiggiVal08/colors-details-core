import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

function parseMoney(value) {
    const s = String(value ?? '').trim();
    if (/^-?\d+(\.\d{1,2})?$/.test(s)) return Number(s);
    return Number(s.replace(/\./g, '').replace(',', '.'));
}

function formatMoney(value, moneda) {
    if (value === null || value === undefined || value === '') return '-';
    const n = parseMoney(value);
    if (Number.isNaN(n)) return value;
    const codigo = String(moneda?.codigo ?? 'USD').toUpperCase();
    const simbolo = moneda?.simbolo ?? (codigo === 'VES' ? 'Bs' : '$');
    const numero = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    return codigo === 'VES' ? `${numero} ${simbolo}` : `${simbolo}${numero}`;
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
            const resp = await httpClient.get(`/service-payment/by-service/${serviceId}`);
            const pagos =
                (Array.isArray(resp?.data?.data) && resp.data.data) ||
                (Array.isArray(resp?.data) && resp.data) ||
                (Array.isArray(resp) && resp) ||
                [];

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
                const fechaFuente = p.creado_en ?? p.createdAt;
                const fecha = fechaFuente ? new Date(fechaFuente).toLocaleDateString('es-VE') : '-';
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
          <td class='p-2 text-right'>${formatMoney(monto, p.moneda)}</td>
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
