import { Format } from '../../helpers/Format.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import intoIcon from '../../helpers/intoIcon.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import { httpClient } from '../../index.js';
document.getElementById('update-exchange-rate').addEventListener('click', async () => {
    const modal = document.getElementById('exchange-rate-modal');
    if (!modal) {
        console.error('Modal de tasa de cambio no encontrado');
        return;
    }
    setupModalLifecycle(modal);
});
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/exchange-rate');
    const { data: tasas } = response;
    setupFilteredTable({
        data: tasas,
        fillTableOptions: {
            templateId: 'fila-ejemplo-exchange-rate',
            tableSelector: '#table-exchange-rate',
            actions: {
                editar: (e) => editExchangeRate(e.currentTarget.dataset.idModel),
            },
            formatters: {
                usuario: (dato) => dato.usuario.username,
                tasa: (dato) => `${Format.float(dato.tasa)} Bs.`,
                cambio: (dato) => {
                    const cambio = dato.cambio ? (((dato.tasa - dato.cambio) / dato.cambio) * 100).toFixed(2) : '';

                    if (!cambio) return '-';

                    const container = document.createElement('div');
                    container.classList.add('flex', 'items-center', 'gap-1', 'justify-center'); // si estás usando tailwind

                    const iconUp = intoIcon('trending_up', { classes: ['text-green-500', 'leading-0'] });
                    const iconDown = intoIcon('trending_down', { classes: ['text-red-500', 'leading-0'] });
                    const icon = cambio > 0 ? iconUp : iconDown;
                    const span = document.createElement('span');
                    span.classList.add(cambio > 0 ? 'text-green-500' : 'text-red-500', 'font-semibold');
                    const signo = cambio > 0 ? '+' : '-';
                    span.textContent = `${signo + Math.abs(cambio)}%`; // le quité el signo porque el ícono ya da el contexto

                    container.appendChild(icon);
                    container.appendChild(span);

                    return container;
                },

                fecha: (dato) => {
                    const fecha = new Date(dato.fecha);
                    const hora = fecha.toLocaleTimeString();
                    return fecha.toLocaleDateString() + ' ' + hora;
                },
                rowClass: (dato) => {
                    if (dato.activa) {
                        return '!bg-green-400/10 !border-green-400/50';
                    }
                    return '';
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-exchange-rate .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-exchange-rate .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 4,
    });
});
