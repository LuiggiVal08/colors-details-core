import { httpClient } from '../../index.js';
import showToast from '../../helpers/Toast.js';
import { Format } from '../../helpers/Format.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import badge from '../../helpers/badge.js';

document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/employe');

    const { data: employees } = response;
    setupFilteredTable({
        data: employees,
        filterInputs: {
            search: document.getElementById('search-employe'),
        },
        filterFn: (cliente, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            const filtroNombre =
                texto.length === 0 || `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(texto);
            const filtroCedula = texto.length === 0 || cliente.cedula.toString().replace(/\s+/g, '').includes(texto);
            return filtroNombre || filtroCedula;
        },
        fillTableOptions: {
            templateId: 'templete-fila-empleados',
            tableSelector: '#table-customers',
            actions: {
                editar: (e) => editEmploye(e.currentTarget.dataset.idModel),
                eliminar: async (e) => {
                    console.log('Eliminar:', e.currentTarget.dataset.idModel);
                    await deleteCustomer(e.currentTarget.dataset.idModel);
                    location.reload();
                },
                view: (e) => viewEmploye(e.currentTarget.dataset.idModel),
            },
            formatters: {
                nombre: (dato) => `${dato.nombre} ${dato.apellido}`,
                activo: (user) => {
                    const activo = user.activo ? 'Activo' : 'Inactivo';
                    return badge(activo, {
                        html: false,
                        classes: ['text-green-500', user.activo ? 'bg-green-400/10' : 'bg-red-400/10'],
                    });
                },
                salario_base: (dato) => Format.float(dato.salario_base),

                contacto: (dato) => {
                    const phone = dato.telefono;
                    const email = dato.email;

                    const containerPhone = document.createElement('span');
                    containerPhone.classList.add('text-gray-700', 'font-semibold');
                    containerPhone.textContent = `${phone}`;

                    const containerEmail = document.createElement('span');
                    containerEmail.classList.add('text-gray-500', 'font-normal', 'text-sm');
                    containerEmail.textContent = `${email}`;

                    const container = document.createElement('div');
                    container.classList.add('flex', 'items-start', 'flex-col', 'justify-start');
                    container.appendChild(containerPhone);
                    container.appendChild(containerEmail);

                    return container;
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-empleados .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-empleados .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 4,
    });
});

const viewEmploye = async (id) => {
    location.href = `/settings/employe/${id}`;
};

const editEmploye = async (id) => {
    const modalEditClient = document.getElementById('modal-edit-employe');
    if (!modalEditClient) {
        console.error('Modal element not found');
        return;
    }
    const response = await httpClient.get(`/employe/${id}`);
    const { error, status, message, data: client } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }

    const form = modalEditClient.querySelector('form');
    if (form) {
        form.action = `/employe/${id}`;
        form.querySelector('[name="nombre"]').value = client.nombre;
        form.querySelector('[name="apellido"]').value = client.apellido;

        form.querySelector('[name="cedula"]').value = client.cedula;
        form.querySelector('[name="telefono"]').value = client.telefono;
        form.querySelector('[name="email"]').value = client.email;
        form.querySelector('[name="direccion"]').value = client.direccion;

        form.querySelector('[name="fecha_ingreso"]').value = new Date(client.fecha_ingreso).toISOString().split('T')[0];
        form.querySelector('[name="salario_base"]').value = Format.float(client.salario_base);
        form.querySelector('[name="activo"]').checked = client.activo;
    }

    setupModalLifecycle(modalEditClient);
};
document.getElementById('btn-add-employe').addEventListener('click', async () => {
    const modalCreateEmploye = document.getElementById('modal-create-employe');
    if (!modalCreateEmploye) {
        console.error('Modal element not found');
        return;
    }
    setupModalLifecycle(modalCreateEmploye);
});
