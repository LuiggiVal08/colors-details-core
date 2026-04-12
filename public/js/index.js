import { Format } from './helpers/Format.js';
import HttpClient from './helpers/httpClient.js';
import { submitForm } from './submitForm.js';
// import { render } from 'lit-html';
// import { html } from 'lit-html';
import { io } from './libs/soket.io.js';
const socket = io();
const httpClient = new HttpClient('/api', 5000, true);
socket.on('reporte-listo', (data) => {
    console.log('✅ Reporte recibido:', data.url);

    // Crear un link invisible y hacerle click para descargar automáticamente
    const link = document.createElement('a');
    link.href = data.url;
    link.setAttribute('download', ''); // Fuerza la descarga
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

httpClient.setRequestInterceptor(async ({ url, options }) => {
    const token = await localStorage.getItem('token');
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (options.method === 'POST' || options.method === 'PUT') {
        const body = JSON.parse(options.body || '{}');
        body.socketId = socket.id; // <--- AQUÍ PASAMOS EL ID AL BACKEND
        options.body = JSON.stringify(body);
    }
    return { url, options };
});

export { httpClient, socket };

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
        // 1. Crear el nuevo contenedor (el Wrapper)
        const newContainer = document.createElement('div');
        newContainer.classList.add('relative', 'w-full');

        // 2. Crear el botón del ojo
        const btnShowPass = document.createElement('button');
        btnShowPass.type = 'button';
        btnShowPass.setAttribute('data-ico', 'visibility');
        btnShowPass.classList.add(
            'material-symbols-rounded',
            'text-gray-500',
            'hover:text-gray-700',
            'absolute',
            'right-2',
            'top-1/2',
            '-translate-y-1/2',
            'cursor-pointer',
            'bg-transparent',
            'border-none',
            'flex',
        );

        // 3. Lógica de inserción (El "Wrap")
        // Insertamos el nuevo contenedor justo antes del input original
        input.parentNode.insertBefore(newContainer, input);

        // Movemos el input y el botón DENTRO del nuevo contenedor
        // Al hacer appendChild de un elemento que ya existe, el DOM lo "mueve", no lo duplica.
        newContainer.appendChild(input);
        newContainer.appendChild(btnShowPass);

        // 4. Evento de click
        btnShowPass.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btnShowPass.setAttribute('data-ico', isPassword ? 'visibility_off' : 'visibility');
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    changeTypeInputPassword();
});
