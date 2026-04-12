import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import badge from '../../helpers/badge.js';
import { Format } from '../../helpers/Format.js';
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/service');
    const { data: services } = response;
    setupFilteredTable({
        data: services,
        filterInputs: {
            search: document.getElementById('searchServices'),
        },
        filterFn: (metodo, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            return texto.length === 0 || metodo.nombre.toLowerCase().includes(texto);
        },
        fillTableOptions: {
            templateId: 'template-service',
            tableSelector: '#table-service',
            actions: {
                editar: (e) => {
                    editBoxRegister(e.currentTarget.dataset.idModel);
                },
                view: (e) => {
                    const id = e.currentTarget.dataset.idModel;
                    viewService(id);
                },
            },
            formatters: {
                nombre: (dato) => dato.nombre,
                estado: (dato) => (dato.activo ? 'Activo' : 'Inactivo'),
                descripcion: (dato) => dato.descripcion,
                proveedor: (dato) =>
                    badge(dato.proveedor, {
                        html: false,
                        classes: ['!text-gray-700', 'bg-white/20', 'border', 'border-gray-400'],
                    }),
                coste: (dato) => (dato.coste ? `$${Format.float(dato.coste)}` : 'Sin Coste'),
                fecha_corte: (dato) => (dato.fecha_corte ? new Date(dato.fecha_corte).toLocaleDateString() : ''),
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-service .btn-paginar:first-child'),
            next: document.querySelector('#paginador-tabla-service .btn-paginar:last-child'),
        },
        itemsPerPage: 4,
    });
});
document.getElementById('btn-add-service').addEventListener('click', async () => {
    const modalCreate = document.querySelector('#modal-create-service');
    if (!modalCreate) {
        console.error('Modal de creación de Método de Pago no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
const editBoxRegister = async (id) => {
    const modalEdit = document.getElementById('modal-edit-service');
    if (!modalEdit) {
        console.error('Modal de edición de Método de Pago no encontrado');
        return;
    }
    const response = await httpClient.get(`/service/${id}`);
    const { error, status, message, data } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    const form = modalEdit.querySelector('form');
    if (form) {
        form.action = `/service/${id}`;
        form.querySelector('[name="nombre"]').value = data.nombre;
        form.querySelector('[name="descripcion"]').value = data.descripcion;
        form.querySelector('[name="empresa_id"]').value = data.empresa_id;
        form.querySelector('[name="proveedor"]').value = data.proveedor;
        form.querySelector('[name="coste"]').value = Format.float(data.coste);
        form.querySelector('[name="dia_corte"]').value = data.dia_corte;
    }
    setupModalLifecycle(modalEdit);
};
const viewService = async (id) => {
    location.href = `/settings/service/${id}`;
    // location.replace(`/service/${id}`);
};
