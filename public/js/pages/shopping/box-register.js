import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import badge from '../../helpers/badge.js';
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/box-register');
    const { data: cajas } = response;
    setupFilteredTable({
        data: cajas,
        filterInputs: {
            search: document.getElementById('searchBoxRegister'),
        },
        filterFn: (metodo, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            return texto.length === 0 || metodo.nombre.toLowerCase().includes(texto);
            // return true;
        },
        fillTableOptions: {
            templateId: 'template-box-register',
            tableSelector: '#table-box-register',
            actions: {
                editar: (e) => {
                    const id = e.currentTarget.dataset.idModel;
                    editBoxRegister(e.currentTarget.dataset.idModel);
                },
                view: (e) => {
                    const id = e.currentTarget.dataset.idModel;
                    window.location.href = `/box-register/${id}`;
                },
            },
            formatters: {
                nombre: (dato) => dato.nombre,
                estado: (dato) => {
                    const activo = dato.activo ? 'Activo' : 'Inactivo';
                    return badge(activo, {
                        html: false,
                        classes: ['text-green-500', dato.activo ? 'bg-green-400/10' : 'bg-red-400/10'],
                    });
                },
                descripcion: (dato) => dato.descripcion,
                controles: (dato) => {
                    const control = dato.controlActual;
                    if (!control) return '-';
                    return `Apertura: ${new Date(control.fecha_apertura).toLocaleString()}${
                        control.fecha_cierre
                            ? ` - Cierre: ${new Date(control.fecha_cierre).toLocaleString()}`
                            : ' - Abierta'
                    }`;
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-box-register .btn-paginar:first-child'),
            next: document.querySelector('#paginador-tabla-box-register .btn-paginar:last-child'),
        },
        itemsPerPage: 4,
    });
});
document.getElementById('btn-add-box-register').addEventListener('click', async () => {
    const modalCreate = document.querySelector('#modal-create-box-register');
    if (!modalCreate) {
        console.error('Modal de creación de Método de Pago no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
const editBoxRegister = async (id) => {
    const modalEdit = document.getElementById('modal-edit-box-register');
    if (!modalEdit) {
        console.error('Modal de edición de Método de Pago no encontrado');
        return;
    }
    const response = await httpClient.get(`/box-register/${id}`);
    const { error, status, message, data } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    const form = modalEdit.querySelector('form');
    if (form) {
        form.action = `/box-register/${id}`;
        form.querySelector('[name="nombre"]').value = data.nombre;
        form.querySelector('[name="ubicacion"]').value = data.ubicacion;
        form.querySelector('[name="activo"]').checked = data.activo;
        form.querySelector('[name="empresa_id"]').value = data.empresa_id;
    }
    setupModalLifecycle(modalEdit);
};
