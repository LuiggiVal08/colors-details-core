import { httpClient } from '../../index.js';
import showToast from '../../helpers/Toast.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

document.addEventListener('DOMContentLoaded', async () => {
    const boxId = parseInt(location.pathname.split('/').pop());
    const modal = document.getElementById('modal-create-cash-movement');
    const metodoPago = modal?.querySelector('[name="metodo_pago_id"]');
    const camposDigitales = document.getElementById('campos-digital-movimiento');
    const referencia = modal?.querySelector('[name="referencia"]');
    const moneda = modal?.querySelector('[name="moneda"]');

    const actualizarCamposDigitales = () => {
        const tipo = metodoPago?.selectedOptions?.[0]?.dataset?.tipo?.toLowerCase() || '';
        const esDigital = tipo !== '' && tipo !== 'efectivo';
        camposDigitales?.classList.toggle('hidden', !esDigital);
        if (referencia) referencia.required = esDigital;
        if (moneda) {
            const esSoloBs = ['tarjeta', 'transferencia'].includes(tipo);
            moneda.querySelector('option[value="USD"]')?.toggleAttribute('disabled', esSoloBs);
            if (esSoloBs) moneda.value = 'VES';
        }
    };

    if (metodoPago) {
        metodoPago.addEventListener('change', actualizarCamposDigitales);
        moneda?.addEventListener('change', actualizarCamposDigitales);
        actualizarCamposDigitales();
    }

    // 2️⃣ Consultar movimientos del control activo
    const [movimientos, tasaDolar] = await Promise.all([
        httpClient.get(`/cash-movements/by-box/${boxId}`).then((res) => {
            const { error: errMovs, data, message } = res.data;
            console.log(res);

            if (errMovs) {
                showToast({
                    title: 'Información',
                    message: `${message}. Para mostrar los movientos del dia, aperture la caja para poder verlos.`,
                    type: 'info',
                    duration: 5000,
                });
                return [];
            }
            return data;
        }),
        httpClient.get('/exchange-rate/actual').then((res) => res.data).catch(() => null),
    ]);

    try {
        const controlResponse = await httpClient.get(`/box-register-control/actual/${boxId}`);
        const resumen = controlResponse.data?.resumen;
        const formatTotal = (grupo) => {
            const ves = Number(resumen?.ingresos?.[grupo]?.VES ?? 0).toFixed(2);
            const usd = Number(resumen?.ingresos?.[grupo]?.USD ?? 0).toFixed(2);
            return `${ves} Bs · $${usd}`;
        };
        document.getElementById('generado-digital').textContent = formatTotal('digital');
        document.getElementById('recibido-fisico').textContent = formatTotal('efectivo');
        document.getElementById('recibido-otros').textContent = formatTotal('otros');
    } catch (error) {
        ['generado-digital', 'recibido-fisico', 'recibido-otros'].forEach((id) => {
            document.getElementById(id).textContent = 'No disponible';
        });
        console.error('No se pudo cargar el resumen del turno', error);
    }

    const tasaActual = Number(tasaDolar?.tasa) || 0;

    const convertir = (m) => {
        const codigo = m.moneda?.codigo === 'USD' ? 'USD' : 'VES';
        const monto = Number(m.monto) || 0;
        const tasa = Number(m.tasa) || tasaActual;
        const bs = codigo === 'VES' ? monto : monto * tasa;
        const usd = codigo === 'USD' ? monto : tasa > 0 ? monto / tasa : null;
        return { bs, usd };
    };

    // 3️⃣ Construir tabla
    setupFilteredTable({
        data: movimientos,

        filterInputs: {
            search: null,
            medioPago: document.getElementById('filtro-medio-pago'),
        },
        filterFn: (item, inputs) => {
            const medioSeleccionado = inputs.medioPago?.value || 'todos';
            return medioSeleccionado === 'todos' || item.medio_pago === medioSeleccionado;
        },

        fillTableOptions: {
            templateId: 'fila-movimiento-caja',
            tableSelector: '#table-movimientos-caja',

            formatters: {
                fecha: (m) => (m.fecha ? new Date(m.fecha).toLocaleString() : '—'),
                monto: (m) => {
                    const span = document.createElement('span');
                    span.classList.add(m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600');
                    const { bs } = convertir(m);
                    span.innerText = `${m.tipo === 'ingreso' ? '' : '-'}${bs.toFixed(2)} Bs`;
                    return span;
                },
                monto_usd: (m) => {
                    const span = document.createElement('span');
                    span.classList.add(m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600');
                    const { usd } = convertir(m);
                    span.innerText =
                        usd != null ? `${m.tipo === 'ingreso' ? '' : '-'}$${usd.toFixed(2)}` : '—';
                    return span;
                },
                tipo: (m) => (m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'),
                medio_pago: (m) => m.medio_pago === 'digital' ? 'Digital / Banco' : 'Efectivo',
                referencia: (m) => m.referencia ?? '—',

                descripcion: (m) => m.descripcion ?? '—',
                usuario: (m) => m.usuario?.username ?? '—',
            },
        },

        paginationButtons: {
            prev: document.querySelector('#paginador-movimientos-caja .btn-paginar:first-child'),
            next: document.querySelector('#paginador-movimientos-caja .btn-paginar:last-child'),
        },

        itemsPerPage: 5,
    });

    const empresaId = modal?.dataset.empresaId;
    if (empresaId) {
        try {
            const response = await httpClient.get(
                `/cash-movements/global-balance?empresa_id=${empresaId}&caja_id=${boxId}`,
            );
            const balance = response.data?.data ?? response.data;
            const formatBs = (value) => `${Number(value ?? 0).toFixed(2)} Bs`;
            const formatUsd = (value) => `$${Number(value ?? 0).toFixed(2)}`;
            document.getElementById('saldo-caja').textContent = formatBs(balance?.caja?.VES);
            document.getElementById('saldo-caja-usd').textContent = formatUsd(balance?.caja?.USD);
        } catch (error) {
            document.getElementById('saldo-caja').textContent = 'No disponible';
            document.getElementById('saldo-caja-usd').textContent = '—';
            console.error('No se pudo cargar el saldo consolidado', error);
        }
    }
});

document.getElementById('btnAgregarMovimientoCaja').addEventListener('click', () => {
    const modalCreate = document.getElementById('modal-create-cash-movement');
    if (!modalCreate) {
        console.error('Modal de creación de Método de Pago no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
