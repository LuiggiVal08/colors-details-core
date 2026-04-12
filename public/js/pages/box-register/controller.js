import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import showToast from '../../helpers/Toast.js';
import { httpClient } from '../../index.js';

document.getElementById('btnControlCaja').addEventListener('click', async (e) => {
    const cajaId = e.currentTarget.getAttribute('data-idmodel');
    const modal = document.getElementById('modal-control-caja');
    const form = document.getElementById('form-control-caja');

    const response = await httpClient.get(`/box-register-control/actual/${cajaId}`);

    // ESTA ERA LA FALLA
    const { error, message, data: control } = response.data;

    if (error) {
        showToast({
            title: 'Error',
            message: message ?? 'No se pudo cargar el estado de la caja',
            type: 'error',
        });
        return;
    }

    // ELEMENTOS
    const estadoTexto = document.getElementById('controlCajaEstado');
    const titulo = document.getElementById('controlCajaTitulo');
    const mensaje = document.getElementById('mensajeConfirmacion');
    const btnSubmit = document.getElementById('btnSubmitControlCaja');
    const infoControl = document.getElementById('infoControlActual');

    document.getElementById('controlCajaId').value = cajaId;

    // CORRECTO: la caja está ABIERTA si hay control y no tiene fecha_cierre
    if (control && control.fecha_cierre === null) {
        titulo.textContent = 'Cerrar Caja';
        estadoTexto.textContent = 'Abierta';
        estadoTexto.classList = 'font-medium text-green-600';

        document.getElementById('controlCajaFechaApertura').textContent = new Date(
            control.fecha_apertura,
        ).toLocaleString();

        document.getElementById('controlCajaMontoApertura').textContent = `${control.monto_apertura ?? 0} Bs`;
        document.getElementById('controlCajaMonto').textContent = `${control?.caja?.monto ?? 0} Bs`;
        infoControl.classList.remove('hidden');

        mensaje.innerHTML = `
            ¿Está seguro de que desea <strong>cerrar la caja</strong>?<br>
            El monto final se tomará automáticamente.
        `;

        form.action = `/box-register-control/cierre/${cajaId}`;
        form.setAttribute('data-method', 'POST');
        btnSubmit.textContent = 'Cerrar Caja';
    } else {
        titulo.textContent = 'Apertura de Caja';
        estadoTexto.textContent = 'Cerrada';
        estadoTexto.classList = 'font-medium text-red-600';

        infoControl.classList.add('hidden');

        mensaje.innerHTML = `
            Esta acción <strong>abrirá la caja registradora</strong> y registrará la fecha de apertura.
        `;

        form.action = `/box-register-control/apertura/${cajaId}`;
        form.setAttribute('data-method', 'POST');
        btnSubmit.textContent = 'Abrir Caja';
    }

    setupModalLifecycle(modal);
});

document.addEventListener('DOMContentLoaded', async () => {
    const cajaId = parseInt(location.pathname.split('/').pop());

    // 1️⃣ Consultar controles
    const controllers = await httpClient.get(`/box-register-control/by-box/${cajaId}`);

    // Aquí controllers.data es EL ARRAY directamente
    const controles = controllers.data;

    if (!Array.isArray(controles)) {
        showToast({
            title: `Error ${controllers.status}`,
            message: 'Respuesta inesperada del servidor',
            type: 'error',
        });
        return;
    }

    // 2️⃣ Pasar data al sistema de tabla
    setupFilteredTable({
        data: controles,

        filterInputs: { search: null },
        filterFn: (item) => true,

        fillTableOptions: {
            templateId: 'fila-control-caja',
            tableSelector: '#table-control-caja',

            formatters: {
                fecha_apertura: (c) => (c.fecha_apertura ? new Date(c.fecha_apertura).toLocaleString() : '—'),
                fecha_cierre: (c) => (c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString() : '—'),
                monto_apertura: (c) => (c.monto_apertura != null ? `${c.monto_apertura} Bs` : '—'),
                monto_cierre: (c) => (c.monto_cierre != null ? `${c.monto_cierre} Bs` : '—'),
                usuario: (c) => c.usuario?.username ?? '—',
                estado: (c) => {
                    const span = document.createElement('span');
                    if (c.fecha_cierre === null) {
                        span.classList.add('text-green-600', 'font-medium');
                        span.textContent = 'Abierto';
                    } else {
                        span.classList.add('text-red-600', 'font-medium');
                        span.textContent = 'Cerrado';
                    }
                    return span;
                },
            },
        },

        paginationButtons: {
            prev: document.querySelector('#paginador-control-caja .btn-paginar:first-child'),
            next: document.querySelector('#paginador-control-caja .btn-paginar:last-child'),
        },

        itemsPerPage: 5,
    });
});
