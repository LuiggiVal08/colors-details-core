import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

export async function initPrices(serviceId) {
    const btnOpenModal = document.getElementById('btn-open-price-modal');
    const btnOpenHistory = document.getElementById('btn-open-price-history');

    const modal = document.getElementById('modal-price-service');
    const historyContainer = document.getElementById('price-history-container');
    const historyWrap = document.getElementById('price-history-table-wrap');

    if (btnOpenModal && modal) {
        btnOpenModal.addEventListener('click', () => {
            const hidden = modal.querySelector('#precio_servicio_id');
            if (hidden) hidden.value = serviceId;
            setupModalLifecycle(modal);
        });
    }

    if (btnOpenHistory && historyContainer && historyWrap) {
        btnOpenHistory.addEventListener('click', async () => {
            // Toggle visibility
            historyContainer.classList.toggle('hidden');
            if (historyContainer.classList.contains('hidden')) return;

            historyWrap.innerHTML = '<div>Cargando...</div>';
            try {
                const resp = await httpClient.get(`/service-price/history/${serviceId}`);
                const precios = Array.isArray(resp?.data)
                    ? resp.data
                    : Array.isArray(resp)
                    ? resp
                    : resp?.data?.data ?? [];
                if (!Array.isArray(precios) || precios.length === 0) {
                    historyWrap.innerHTML = '<div class="text-sm text-gray-600">No hay precios registrados.</div>';
                    return;
                }

                const table = document.createElement('table');
                table.className = 'w-full border-collapse';
                table.innerHTML = `
          <thead class='[&_tr]:border-b border-red-400/50'>
            <tr>
              <th class='text-left p-3'>Fecha Inicio</th>
              <th class='text-left p-3'>Fecha Fin</th>
              <th class='text-right p-3'>Precio (USD)</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;
                const tbody = table.querySelector('tbody');

                precios.forEach((p) => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-red-400/30 hover:bg-pink-50';
                    const fechaInicio = p.fecha_inicio ? new Date(p.fecha_inicio).toLocaleDateString() : '—';
                    const fechaFin = p.fecha_fin ? new Date(p.fecha_fin).toLocaleDateString() : '—';
                    const precio = typeof p.precio === 'number' ? p.precio.toFixed(2) : p.precio;
                    tr.innerHTML = `
            <td class='p-3'>${fechaInicio}</td>
            <td class='p-3'>${fechaFin}</td>
            <td class='p-3 text-right'>${precio}</td>
          `;
                    tbody.appendChild(tr);
                });

                historyWrap.innerHTML = '';
                historyWrap.appendChild(table);
            } catch (err) {
                historyWrap.innerHTML = '<div class="text-sm text-red-500">Error cargando historial.</div>';
                console.error(err);
            }
        });
    }
}
