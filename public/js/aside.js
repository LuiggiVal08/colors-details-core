import { setupModalLifecycle } from './helpers/handleModalEvents.js';
import intoIcon from './helpers/intoIcon.js';
import showToast from './helpers/Toast.js';
import { httpClient, socket } from './index.js';

document.getElementById('btn-aside').addEventListener('click', async () => {
    const modalAside = document.getElementById('aside-overlay');
    if (!modalAside) return;
    const response = await httpClient.get('/exchange-rate/actual');
    const { error, status, message, data: tasa } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    if (tasa) {
        const cambio = tasa.cambio ? (((tasa.tasa - tasa.cambio) / tasa.cambio) * 100).toFixed(2) : '';
        const icon = intoIcon(cambio > 0 ? 'trending_up' : 'trending_down', { classes: ['leading-0'] });

        const span = document.createElement('span');
        span.classList.add('text-xl', 'font-bold');
        span.textContent = `$1=${tasa.tasa} Bs.`;

        const contentTazaDolar = modalAside.querySelector('[data-tasa-dolar]');
        contentTazaDolar.innerHTML = '';
        contentTazaDolar.appendChild(span);
        contentTazaDolar.appendChild(icon);
    }
    setupModalLifecycle(modalAside);
});
document.addEventListener('DOMContentLoaded', function () {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    const currentFile = currentPath.split('/').pop();

    document.querySelectorAll('#aside-overlay li a').forEach((el) => {
        const classActive = ['bg-gray-500/10', 'border-l-4'];
        el.classList.remove(...classActive);
        el.removeAttribute('aria-current');

        const rawHref = el.getAttribute('href');
        if (!rawHref) return;

        const hrefPath = new URL(rawHref, window.location.origin).pathname.replace(/\/$/, '');
        const hrefFile = hrefPath.split('/').pop();
        const isRoot = hrefPath === '';

        const match =
            (isRoot && currentPath === '') ||
            (!isRoot && (currentFile === hrefFile || currentPath.startsWith(hrefPath)));

        if (match) {
            el.classList.add(...classActive);
            el.setAttribute('aria-current', 'page');
        }
    });
});

// Actualizar tasa en el aside via socket
socket.on('tasa-dolar:updated', (data) => {
    if (!data?.tasa) return;
    const tasaEl = document.querySelector('[data-tasa-dolar]');
    if (!tasaEl) return;

    const cambio = data.cambio ? (((data.tasa - data.cambio) / data.cambio) * 100).toFixed(2) : '';
    const icon = intoIcon(cambio > 0 ? 'trending_up' : 'trending_down', { classes: ['leading-0'] });

    const span = document.createElement('span');
    span.classList.add('text-xl', 'font-bold');
    span.textContent = `$1=${data.tasa} Bs.`;

    tasaEl.innerHTML = '';
    tasaEl.appendChild(span);
    tasaEl.appendChild(icon);
});
