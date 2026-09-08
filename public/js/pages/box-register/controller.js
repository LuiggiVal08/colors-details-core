import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import showToast from '../../helpers/Toast.js';
import { httpClient } from '../../index.js';

let tasaDolar = null;

const getTasa = () => {
    if (tasaDolar !== null) return Promise.resolve(tasaDolar);
    return httpClient
        .get('/exchange-rate/actual')
        .then((res) => res.data)
        .then((tasa) => {
            tasaDolar = tasa;
            return tasa;
        })
        .catch(() => {
            tasaDolar = null;
            return null;
        });
};

const formatUsd = (monto) => {
    const tasa = Number(tasaDolar?.tasa);
    if (!tasa) return null;
    return parseFloat(Number(monto) / tasa).toFixed(2);
};

document.getElementById('btnControlCaja').addEventListener('click', async (e) => {
    const cajaId = e.currentTarget.getAttribute('data-idmodel');
    const modal = document.getElementById('modal-control-caja');
    const form = document.getElementById('form-control-caja');

    await getTasa();

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

    const notaCierreContainer = document.getElementById('notaCierreContainer');

    // CORRECTO: la caja está ABIERTA si hay control y no tiene fecha_cierre
    if (control && control.fecha_cierre === null) {
        titulo.textContent = 'Cerrar Caja';
        estadoTexto.textContent = 'Abierta';
        estadoTexto.classList = 'font-medium text-green-600';

        notaCierreContainer.classList.remove('hidden');
        const notaInput = document.getElementById('nota_cierre');
        if (notaInput) notaInput.value = '';

        document.getElementById('controlCajaFechaApertura').textContent = new Date(
            control.fecha_apertura,
        ).toLocaleString();

        const montoAperturaBs = parseFloat(control.monto_apertura ?? 0).toFixed(2);
        const montoAperturaUsd = formatUsd(control.monto_apertura ?? 0);
        document.getElementById('controlCajaMontoApertura').textContent = montoAperturaUsd
            ? `${montoAperturaBs} Bs · $${montoAperturaUsd}`
            : `${montoAperturaBs} Bs`;

        const montoCajaBs = parseFloat(control?.caja?.monto ?? 0).toFixed(2);
        const montoCajaUsd = formatUsd(control?.caja?.monto ?? 0);
        document.getElementById('controlCajaMonto').textContent = montoCajaUsd
            ? `${montoCajaBs} Bs · $${montoCajaUsd}`
            : `${montoCajaBs} Bs`;
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

        notaCierreContainer.classList.add('hidden');
        const notaInput = document.getElementById('nota_cierre');
        if (notaInput) notaInput.value = '';

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

    await getTasa();

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
                monto_apertura_usd: (c) => {
                    const usd = formatUsd(c.monto_apertura);
                    return usd != null ? `$${usd}` : '—';
                },
                monto_cierre_usd: (c) => {
                    const usd = formatUsd(c.monto_cierre);
                    return usd != null ? `$${usd}` : '—';
                },
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
