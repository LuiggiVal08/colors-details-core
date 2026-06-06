import { httpClient, socket } from '../index.js';

const formatFloat = (num) => {
    return new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

let currentTasa = null;
let currentCaja = null;
let listenersReady = false;

const renderFullBar = () => {
    const container = document.getElementById('box-register');
    if (!container) return;

    const tasaEl = container.querySelector('.tasa-valor');
    const cajaEl = container.querySelector('.caja-status-content');

    if (tasaEl && currentTasa !== null) {
        tasaEl.textContent = formatFloat(Number(currentTasa));
    }

    if (cajaEl) {
        if (currentCaja && currentCaja.estado === 'abierto') {
            cajaEl.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse shrink-0"></span>
                <span class="font-medium text-green-700">Caja Abierta</span>
                <span class="text-gray-300">·</span>
                <span class="text-gray-700">${currentCaja.caja?.nombre || ''}</span>
                <span class="text-gray-400 text-xs">por ${currentCaja.usuario?.username || ''}</span>
            `;
        } else {
            cajaEl.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block shrink-0"></span>
                <span class="font-medium text-red-600">Caja Cerrada</span>
                <span class="text-gray-400 text-xs ml-1">— Abre una caja antes de registrar ventas</span>
            `;
        }
    }
};

const renderCompactStatus = () => {
    document.querySelectorAll('[data-caja-status]').forEach((el) => {
        if (currentCaja && currentCaja.estado === 'abierto') {
            el.innerHTML = `
                <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse shrink-0"></span>
                    <span class="font-medium">Caja abierta</span>
                    <span class="text-gray-500">·</span>
                    <span>${currentCaja.caja?.nombre || ''}</span>
                    <span class="text-gray-400">(${currentCaja.usuario?.username || ''})</span>
                </span>
            `;
        } else {
            el.innerHTML = `
                <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-red-400 inline-block shrink-0"></span>
                    <span class="text-red-600 font-medium">Caja cerrada</span>
                    <span class="text-gray-400">— Abre una caja para registrar pagos</span>
                </span>
            `;
        }
    });
};

const render = () => {
    renderFullBar();
    renderCompactStatus();
};

export const initStatusBar = () => {
    if (!listenersReady) {
        listenersReady = true;
        socket.on('tasa-dolar:updated', (data) => {
            if (data?.tasa) {
                currentTasa = data.tasa;
                render();
            }
        });
        socket.on('caja:status-changed', (data) => {
            currentCaja = data;
            render();
        });
    }

    Promise.all([
        httpClient.get('/exchange-rate/actual').then((r) => (r.error ? null : r.data)),
        httpClient.get('/box-register-control/mi-actual').then((r) => (r.error ? null : r.data)),
    ]).then(([tasaRes, cajaRes]) => {
        if (tasaRes) currentTasa = tasaRes.tasa;
        currentCaja = cajaRes;
        render();
    });
};

export const getCurrentCajaStatus = () => currentCaja;
