import { httpClient } from '../../index.js';
import fillTable from '../../helpers/fillTable.js';
import { Format } from '../../helpers/Format.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import badge from '../../helpers/badge.js';
import intoIcon from '../../helpers/intoIcon.js';
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/payment-method');
    const { data: metodos } = response;

    setupFilteredTable({
        data: metodos,
        filterInputs: {
            search: document.querySelector('#searchPaymentMethod'),
            searchTypePaymentMethod: document.getElementById('searchTypePaymentMethod'),
        },
        filterFn: (metodo, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            const tipoSearch = inputs.searchTypePaymentMethod.value.toLowerCase().trim();
            const filtroNombre = texto.length === 0 || metodo.nombre.toLowerCase().includes(texto);
            const filtroTipo = tipoSearch.length === 0 ? true : metodo.tipo.toLowerCase().includes(tipoSearch);
            return filtroNombre && filtroTipo;
        },
        fillTableOptions: {
            templateId: 'template-payment-method',
            tableSelector: '#table-payment-methods',
            actions: {
                editar: (e) => {
                    editPaymentMethod(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                nombre: (dato) => dato.nombre,
                tipo: (dato) => {
                    const mapIcons = {
                        efectivo: 'payments',
                        tarjeta: 'credit_card',
                        transferencia: 'account_balance_wallet',
                        digital: 'devices',
                        otro: 'info',
                    };
                    const icon = intoIcon(mapIcons[dato.tipo], {
                        classes: ['md-28', 'text-gray-700', 'hover:text-gray-500', 'leading-0'],
                    });
                    const span = document.createElement('span');
                    span.classList.add('flex', 'items-center', 'gap-2', 'justify-center');

                    const text = document.createElement('span');
                    text.textContent = dato.tipo;

                    span.appendChild(icon);
                    span.appendChild(text);
                    return span;
                },
                comision: (dato) => `${Format.float(dato.comision)}%`,
                estado: (dato) => {
                    const activo = dato.activo ? 'Activo' : 'Inactivo';
                    return badge(activo, {
                        html: false,
                        classes: ['text-green-500', dato.activo ? 'bg-green-400/10' : 'bg-red-400/10'],
                    });
                },
                descripcion: (dato) => dato.descripcion,
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla .btn-paginar:first-child'),
            next: document.querySelector('#paginador-tabla .btn-paginar:last-child'),
        },
        itemsPerPage: 10,
    });
});
const editPaymentMethod = async (id) => {
    const modalEdit = document.getElementById('modal-edit-payment-method');
    if (!modalEdit) {
        console.error('Modal de edición de Método de Pago no encontrado');
        return;
    }
    const response = await httpClient.get(`/payment-method/${id}`);
    const { error, status, message, data } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    const form = modalEdit.querySelector('form');
    if (form) {
        form.action = `/payment-method/${id}`;
        form.querySelector('[name="nombre"]').value = data.nombre;
        form.querySelector('[name="tipo"]').value = data.tipo;
        form.querySelector('[name="comision"]').value = Format.float(data.comision);
        form.querySelector('[name="descripcion"]').value = data.descripcion;
        form.querySelector('[name="activo"]').checked = data.activo;
    }
    setupModalLifecycle(modalEdit);
};
document.querySelector('#btn-add-payment-method').addEventListener('click', () => {
    const modalCreate = document.querySelector('#modal-create-payment-method');
    if (!modalCreate) {
        console.error('Modal de creación de Método de Pago no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
