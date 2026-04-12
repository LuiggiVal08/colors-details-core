import badge from '../../helpers/badge.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

document.addEventListener('DOMContentLoaded', async () => {
    const [users, userTypes] = await Promise.all([
        httpClient.get('/user').then((res) => res.data),
        httpClient.get('/user-types').then((res) => res.data),
    ]);

    setupFilteredTable({
        data: users.filter((user) => user.username.toLowerCase() !== 'admin'),
        filterInputs: {
            search: document.getElementById('searchUsers'),
        },
        filterFn: (user, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            return texto.length === 0 || `${user.username} ${user.tipo.nombre}`.toLowerCase().includes(texto);
        },
        fillTableOptions: {
            templateId: 'template-user',
            tableSelector: '#table-user',
            actions: {
                editar: (e) => {
                    const id = e.currentTarget.dataset.idModel;
                    editUser(id);
                },
            },
            formatters: {
                tipo_usuario: (user) => user.tipo.nombre,
                activo: (user) => {
                    const activo = user.activo ? 'Activo' : 'Inactivo';
                    return badge(activo, {
                        html: false,
                        classes: ['text-green-500', user.activo ? 'bg-green-400/10' : 'bg-red-400/10'],
                    });
                },
                empleado: (user) =>
                    user.empleado ? `${user.empleado.nombre} ${user.empleado.apellido}` : 'No asignado',
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-user .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-user .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 4,
    });
});

document.getElementById('btn-add-user').addEventListener('click', async () => {
    const modalCreate = document.querySelector('#modal-create-user');
    if (!modalCreate) {
        console.error('Modal create user not found');
        return;
    }

    const response = await httpClient.get('/user-types');
    const responseEmployee = await httpClient.get('/employe');
    const { data: userTypes } = response;
    const { data: employees } = responseEmployee;

    const form = modalCreate.querySelector('form');
    const selectUserType = form.querySelector('#tipo_usuario_id_user_create');
    const selectEmployee = form.querySelector('#empleado_id_user_create');

    if (employees.length) {
        selectEmployee.innerHTML = '';
        employees.forEach((employee) => {
            if (!employee.activo) return;
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = `${employee.nombre} ${employee.apellido}`;
            selectEmployee.appendChild(option);
        });
    }
    if (userTypes.length) {
        selectUserType.innerHTML = '';
        userTypes.forEach((userType) => {
            const option = document.createElement('option');
            option.value = userType.id;
            option.textContent = userType.nombre;
            selectUserType.appendChild(option);
        });
    }

    setupModalLifecycle(modalCreate);
});

const editUser = async (id) => {
    const modalEdit = document.querySelector('#modal-edit-user');
    if (!modalEdit) {
        console.error('Modal edit user not found');
        return;
    }

    const response = await httpClient.get(`/user/${id}`);
    const responseUserTypes = await httpClient.get('/user-types');
    const { data: user } = response;
    const { data: userTypes } = responseUserTypes;
    if (!user) return;

    const form = modalEdit.querySelector('form');
    if (form && userTypes) {
        const selectUserType = form.querySelector('#tipo_usuario_id_user_edit');

        if (userTypes.length) {
            selectUserType.innerHTML = '';
            userTypes.forEach((userType) => {
                const option = document.createElement('option');
                option.value = userType.id;
                option.textContent = userType.nombre;

                selectUserType.appendChild(option);
            });
        }
        const titleModal = modalEdit.querySelector('[data-modal-title]');
        titleModal.textContent = `Editar Usuario: ${user.username}`;
        form.action = `/user/${id}`;
        form.querySelector('[name="tipo_usuario_id"]').value = user.tipo_usuario_id;
        form.querySelector('[name="activo"]').checked = user.activo;
    }

    setupModalLifecycle(modalEdit);
};
