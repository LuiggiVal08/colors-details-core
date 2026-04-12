import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { httpClient } from '../../index.js';

document.addEventListener('DOMContentLoaded', async () => {
    const btnEditCaja = document.querySelector('#btnEditCaja');

    const id = btnEditCaja.dataset.idmodel;
    if (id) {
        btnEditCaja.addEventListener('click', () => editCaja(id));
    }
});
const editCaja = async (id) => {
    const modalEdit = document.getElementById('modal-edit-box-register');
    if (!modalEdit) {
        console.error('Modal de edición de Caja no encontrado');
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
