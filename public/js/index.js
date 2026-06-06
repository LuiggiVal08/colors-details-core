import { Format } from './helpers/Format.js';
import HttpClient from './helpers/httpClient.js';
import { submitForm } from './submitForm.js';
import { io } from './libs/soket.io.js';

const socket = io({
    auth: { token: localStorage.getItem('token') },
    transports: ['websocket', 'polling'],
});

socket.on('connect_error', (err) => {
    console.warn('[Socket] Error de conexión:', err.message);
});

const httpClient = new HttpClient('/api', 5000, true);

socket.on('reporte-listo', (data) => {
    console.log('Reporte recibido:', data.url);
    const link = document.createElement('a');
    link.href = data.url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

socket.on('nueva_notificacion', (notif) => {
    console.log('Nueva notificación:', notif);
    updateNotificationBadge();
    showNotificationToast(notif);
});

httpClient.setRequestInterceptor(async ({ url, options }) => {
    const storedToken = await localStorage.getItem('token');
    if (storedToken) options.headers.Authorization = `Bearer ${storedToken}`;
    if (options.method === 'POST' || options.method === 'PUT') {
        const body = JSON.parse(options.body || '{}');
        body.socketId = socket.id || sessionStorage.getItem('socketId');
        options.body = JSON.stringify(body);
    }
    return { url, options };
});

export { httpClient, socket };

async function updateNotificationBadge() {
    try {
        const resp = await httpClient.get('/notifications');
        const { count, data } = resp?.data ?? resp ?? { count: 0, data: [] };
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
        }
        const list = document.getElementById('notif-list');
        const dropdown = document.getElementById('notif-dropdown');
        if (list && dropdown && !dropdown.classList.contains('hidden')) {
            renderNotifications(data);
        }
    } catch (e) {
        /* silencioso */
    }
}

function showNotificationToast(notif) {
    import('./helpers/Toast.js').then(({ showToast }) => {
        const type = notif.tipo === 'danger' ? 'error' : 'warning';
        showToast({ title: 'Notificación', message: notif.mensaje, type, duration: 5000 });
    });
}

function renderNotifications(data) {
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (!data || data.length === 0) {
        list.innerHTML = '<div class="h-12 w-full text-sm text-gray-400 flex items-center justify-center">No hay notificaciones</div>';
        return;
    }
    list.innerHTML = data.map(n => {
        const isRead = n.leido;
        return `
        <div class="flex items-center justify-between px-4 py-3 duration-300 cursor-pointer${isRead ? ' opacity-60 bg-gray-50/50' : ' hover:bg-gray-500/10 hover:border-l-4 border-pink-500/80'}"${n.url ? ` data-url="${n.url}"` : ''}>
            <div class="flex items-start space-x-2 flex-1 min-w-0">
                <span class="material-symbols-rounded text-lg ${n.tipo === 'danger' ? 'text-red-400' : 'text-yellow-500'} shrink-0 mt-1" data-ico="${n.tipo === 'danger' ? 'error' : 'warning'}"></span>
                <div class="min-w-0">
                    <p class="text-sm${isRead ? ' text-gray-400' : ' text-gray-700'}">${n.mensaje}</p>
                    <p class="text-xs text-gray-400 mt-1">${new Date(n.creado_en).toLocaleString()}</p>
                </div>
            </div>
            ${isRead
                ? '<span class="material-symbols-rounded text-gray-200 text-base shrink-0 ml-3" data-ico="check_circle"></span>'
                : `<button data-notif-id="${n.id}" class="mark-read material-symbols-rounded text-gray-300 text-base shrink-0 ml-3 cursor-pointer hover:text-pink-500" data-ico="check_circle"></button>`
            }
        </div>`;
    }).join('');
}

export const submitValidForm = (form) => {
    const method = form.dataset.method ?? form.method;
    if (!form || !form.action || !method || form.dataset.ignore) return;
    form.addEventListener('submit', submitForm);
    Format.formatEventInput(form);
};

document.querySelectorAll('form').forEach(submitValidForm);

export const changeTypeInputPassword = () => {
    const inputsPass = document.querySelectorAll('input[type="password"]');
    inputsPass.forEach((input) => {
        const newContainer = document.createElement('div');
        newContainer.classList.add('relative', 'w-full');
        const btnShowPass = document.createElement('button');
        btnShowPass.type = 'button';
        btnShowPass.setAttribute('data-ico', 'visibility');
        btnShowPass.classList.add(
            'material-symbols-rounded', 'text-gray-500', 'hover:text-gray-700',
            'absolute', 'right-2', 'top-1/2', '-translate-y-1/2',
            'cursor-pointer', 'bg-transparent', 'border-none', 'flex',
        );
        input.parentNode.insertBefore(newContainer, input);
        newContainer.appendChild(input);
        newContainer.appendChild(btnShowPass);
        btnShowPass.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btnShowPass.setAttribute('data-ico', isPassword ? 'visibility_off' : 'visibility');
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    changeTypeInputPassword();
    updateNotificationBadge();

    const btnNotif = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notif-dropdown');
    const markAllBtn = document.getElementById('btn-mark-all-read');
    let abierto = false;

    if (btnNotif && dropdown) {
        btnNotif.addEventListener('click', () => {
            abierto = !abierto;
            dropdown.classList.toggle('hidden', !abierto);
            if (abierto) updateNotificationBadge();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#btn-notifications') && !e.target.closest('#notif-dropdown')) {
                dropdown?.classList.add('hidden');
                abierto = false;
            }
        });
    }

    const notifList = document.getElementById('notif-list');
    if (notifList) {
        notifList.addEventListener('click', async (e) => {
            const markBtn = e.target.closest('.mark-read');
            if (markBtn) {
                e.stopPropagation();
                await httpClient.patch(`/notifications/${markBtn.dataset.notifId}/read`);
                updateNotificationBadge();
                return;
            }

            const notifRow = e.target.closest('[data-url]');
            if (notifRow) {
                window.location.href = notifRow.dataset.url;
            }
        });
    }

    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            await httpClient.patch('/notifications/read-all');
            updateNotificationBadge();
            dropdown?.classList.add('hidden');
            abierto = false;
        });
    }
});
