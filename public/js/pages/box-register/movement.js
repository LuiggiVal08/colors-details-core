import { httpClient } from '../../index.js';
import showToast from '../../helpers/Toast.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';

document.addEventListener('DOMContentLoaded', async () => {
    const boxId = parseInt(location.pathname.split('/').pop());

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
        },
        filterFn: (item) => true,

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
});

document.getElementById('btnAgregarMovimientoCaja').addEventListener('click', () => {
    const modalCreate = document.getElementById('modal-create-cash-movement');
    if (!modalCreate) {
        console.error('Modal de creación de Método de Pago no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
