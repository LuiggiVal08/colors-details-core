import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import showToast from '../helpers/Toast.js';
import { httpClient } from '../index.js';
import badge from '../helpers/badge.js';
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/customer');
    const { data: customers } = response;
    setupFilteredTable({
        data: customers,
        filterInputs: {
            search: document.getElementById('inputSearch'),
        },
        filterFn: (cliente, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            const cedula = texto ? cliente.cedula.toLowerCase().trim().replace(/[\s-]/g, '').includes(texto) : true;
            const nombre = texto ? `${cliente.nombre} ${cliente.apellido}`.toLowerCase().trim().includes(texto) : true;

            return nombre || cedula;
        },
        fillTableOptions: {
            templateId: 'fila-ejemplo',
            tableSelector: '#table-customers',
            actions: {
                editar: (e) => {
                    editCustomer(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                nombre: (dato) => `${dato.nombre} ${dato.apellido}`,
                activo: (dato) => {
                    const activo = dato.activo ? 'Activo' : 'Inactivo';
                    return badge(activo, {
                        html: false,
                        classes: ['text-green-500', dato.activo ? 'bg-green-400/10' : 'bg-red-400/10'],
                    });
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 10,
    });
});

const editCustomer = async (id) => {
    const modalEditClient = document.getElementById('modal-edit-client');
    if (!modalEditClient) {
        console.error('Modal element not found');
        return;
    }
    const response = await httpClient.get(`/customer/${id}`);
    const { error, status, message, data: client } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    const form = modalEditClient.querySelector('form');
    if (form) {
        form.action = `/customer/${id}`;
        form.querySelector('[name="nombre"]').value = client.nombre;
        form.querySelector('[name="apellido"]').value = client.apellido;
        form.querySelector('[name="cedula"]').value = client.cedula;
        form.querySelector('[name="telefono"]').value = client.telefono;
        form.querySelector('[name="email"]').value = client.email;
        form.querySelector('[name="direccion"]').value = client.direccion;
        form.querySelector('[name="activo"]').checked = client.activo;
    }
    setupModalLifecycle(modalEditClient);
};

document.getElementById('btn-add-customer').addEventListener('click', async () => {
    const modalCreateClient = document.getElementById('modal-create-client');
    if (!modalCreateClient) {
        console.error('Modal element not found');
        return;
    }
    setupModalLifecycle(modalCreateClient);
});
// Detectar cuando la página carga
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const openCreate = params.get('open-create');
    const modalCreateClient = document.getElementById('modal-create-client');
    if (!modalCreateClient) {
        console.error('Modal element not found');
        return;
    }
    if (openCreate === 'true') {
        // Aquí abres tu modal
        setupModalLifecycle(modalCreateClient);
    }
});
