import { Format } from '../helpers/Format.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
import showToast from '../helpers/Toast.js';
import uniqueId from '../helpers/uniqueId.js';
import { validateInputElement } from '../helpers/validateInput.js';
import { httpClient } from '../index.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import intoIcon from '../helpers/intoIcon.js';
import badge from '../helpers/badge.js';
import { generarPDF } from '../helpers/generatePdf.js';

const fechaLocalActual = () => {
    const fecha = new Date();
    const dosDigitos = (valor) => String(valor).padStart(2, '0');
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
};

const formatoFechaPago = (valor) => {
    if (!valor) return '—';
    const [year, month, day] = String(valor).slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return new Date(valor).toLocaleDateString('es-ES');
    return new Date(year, month - 1, day).toLocaleDateString('es-ES');
};
import { initStatusBar } from '../components/statusBar.js';
import setupImageDropzone from '../helpers/imageDropzone.js';

const removeOrderUrlParam = () => {
    const url = new URL(window.location);
    if (url.searchParams.has('id')) {
        url.searchParams.delete('id');
        window.history.replaceState({}, '', url);
    }
};

document.getElementById('btnAddOrder').addEventListener('click', () => {
    const modalOrder = document.getElementById('modal-create-order');
    if (!modalOrder) return;
    setupModalLifecycle(modalOrder);
});

// Tabla de pedidos con paginación y filtros
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/orders');
    const { data: orders } = response;
    const searchInput = document.getElementById('search-orders');

    setupFilteredTable({
        data: orders,
        filterInputs: { search: searchInput },
        filterFn: (item, inputs) => {
            const term = inputs.search?.value?.toLowerCase().trim() || '';
            if (!term) return true;
            const clientName = `${item.cliente?.nombre || ''} ${item.cliente?.apellido || ''}`.toLowerCase();
            const orderId = String(item.id);
            return clientName.includes(term) || orderId.includes(term);
        },
        fillTableOptions: {
            templateId: 'fila-ejemplo-pedidos',
            tableSelector: '#pedidos-tabla-body',
            actions: {
                // editar: (e) => {
                //     editOrder(e.currentTarget.dataset.idModel);
                // },
                view: (e) => {
                    viewOrder(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                cliente: (order) => `${order.cliente.nombre} ${order.cliente.apellido}`,
                fecha: (order) =>
                    new Date(order.fecha).toLocaleDateString('es-ES') +
                    '-' +
                    new Date(order.fecha).toLocaleTimeString('es-ES'),
                fecha_entrega: (order) =>
                    order.fecha_entrega
                        ? new Date(order.fecha_entrega).toLocaleDateString('es-ES') +
                          '-' +
                          new Date(order.fecha_entrega).toLocaleTimeString('es-ES')
                        : 'No entrega',
                dias_para_entrega: (order) => {
                    const fechaEntrega = order.fecha_entrega ? new Date(order.fecha_entrega) : null;
                    const diasParaEntrega = fechaEntrega
                        ? Math.ceil((fechaEntrega - new Date()) / (1000 * 60 * 60 * 24))
                        : 0;
                    return diasParaEntrega > 0 ? `${diasParaEntrega} días` : 'Sin fecha de entrega';
                },
                estado: (order) => {
                    const estado = order.estado.toLowerCase();
                    const classMapIco = {
                        pendiente: ['!text-yellow-600', '!bg-[rgba(250,204,21,0.1)]'],
                        procesado: ['!text-blue-600', '!bg-[rgba(96,165,250,0.1)]'],
                        completado: ['!text-green-600', '!bg-[rgba(74,222,128,0.1)]'],
                    };
                    const iconMap = { pendiente: 'hourglass_bottom', procesado: 'cached', completado: 'done_all' };

                    const icon = intoIcon(iconMap[estado], {
                        classes: ['md-18', 'leading-0', 'animate-spin', '!duration-500', '!transition-all'],
                    });

                    const span = document.createElement('span');
                    span.classList.add('flex', 'items-center', 'gap-2');

                    const text = document.createElement('span');
                    text.textContent = estado;

                    span.appendChild(text);
                    span.appendChild(icon);

                    return badge(span, { html: true, classes: [...classMapIco[estado]] });
                },
                estado_pago: (order) => {
                    if (order.pagos.length === 0)
                        return badge('Pendiente', {
                            html: false,
                            classes: ['!text-yellow-600', '!bg-[rgba(250,204,21,0.1)]'],
                        });

                    const ivaPorcentaje = Number(order.iva.porcentaje);
                    const total = Number(order.total);
                    const totalMasIVA = total + (total * ivaPorcentaje) / 100;
                    const totalPagos = order.pagos.reduce(
                        (acum, pago) => acum + Number(pago.monto_usd ?? pago.monto ?? 0),
                        0,
                    );
                    const porcentajePago = (totalPagos / totalMasIVA) * 100;

                    return badge(`${Format.float(porcentajePago.toFixed(2))}%`, {
                        html: false,
                        classes: ['!text-green-600', '!bg-[rgba(74,222,128,0.1)]'],
                    });
                },
                total: (order) => `$${Format.float(order.total)}`,
                observaciones: (order) => order.observaciones,
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-pedidos .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-pedidos .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 10,
    });
});

const addOrderPayment = async (id) => {
    const [pedido, tasaDolar] = await Promise.all([
        httpClient.get(`/orders/${id}`).then((res) => res.data),
        httpClient.get('/exchange-rate/actual').then((res) => res.data),
    ]);

    const modalOrder = document.getElementById('modal-create-payment-order');
    if (!modalOrder) return console.error('Modal no encontrado');

    const tasa = parseFloat(tasaDolar.tasa);
    modalOrder.querySelector('[data-info-tasa-cambio]').textContent = `${Format.float(Number(tasa).toFixed(2))} Bs`;

    if (pedido) {
        const { total, cliente, iva, fecha, pagos } = pedido;

        // 📊 Calcular totales
        const totalMasIVA = Number(total) + (Number(total) * Number(iva.porcentaje)) / 100;
        const totalPagos = (pagos || []).reduce(
            (acum, pago) => acum + Number(pago.monto_usd ?? pago.monto ?? 0),
            0,
        );
        const totalPendiente = totalMasIVA - totalPagos;

        // 🧾 Llenar información del pedido
        modalOrder.querySelector('[data-pedido-fecha]').textContent = new Date(fecha).toLocaleDateString('es-VE');
        modalOrder.querySelector('[data-pedido-cliente]').textContent = `${cliente.nombre} ${cliente.apellido}`;
        modalOrder.querySelector('[data-pedido-estado]').textContent = pedido.estado;
        modalOrder.querySelector('[data-pedido-total]').textContent = '$ ' + Format.float(totalMasIVA.toFixed(2));
        modalOrder.querySelector('[data-pedido-total-pagado]').textContent = '$ ' + Format.float(totalPagos.toFixed(2));
        modalOrder.querySelector('[data-pedido-pendiente]').textContent =
            '$ ' + Format.float(totalPendiente.toFixed(2));
        modalOrder.querySelector('[data-pedido-pendiente-bs]').textContent =
            Format.float((totalPendiente * tasa).toFixed(2)) + ' Bs';

        modalOrder.querySelector('input[name="pedido_id"]').value = pedido.id;
        const fechaInput = modalOrder.querySelector('input[name="fecha"]');
        if (fechaInput && !fechaInput.value) fechaInput.value = fechaLocalActual();

        // 🧩 Elementos del formulario
        const containerPagos = modalOrder.querySelector('#pagos-pedido');
        const templatePago = document.getElementById('template-pago-pedido');
        const btnAddPago = modalOrder.querySelector('#btn-add-pago-pedido');
        const lblAplicado = modalOrder.querySelector('[data-pagos-aplicado]');
        const lblRestante = modalOrder.querySelector('[data-pagos-restante]');

        const parseMonto = (valor) => {
            const str = String(valor ?? '').trim();
            if (!str) return 0;
            if (/^-?\d+(\.\d{1,2})?$/.test(str)) return Number(str);
            return Number(str.replace(/\./g, '').replace(',', '.')) || 0;
        };

        const esEfectivoMetodo = (select) => {
            const opcion = select?.options?.[select.selectedIndex];
            return String(opcion?.dataset?.tipo || '')
                .toLowerCase()
                .trim() === 'efectivo';
        };

        // 🔢 Calcular valores de todas las filas de pago
        const calcularValores = () => {
            let acumuladoUsd = 0;

            const itemsPago = Array.from(containerPagos?.querySelectorAll('.pago-item') || []);
            itemsPago
                .sort((a, b) => Number(esEfectivoMetodo(a.querySelector('select[name="pagos[][metodo_pago_id]"]'))) -
                    Number(esEfectivoMetodo(b.querySelector('select[name="pagos[][metodo_pago_id]"]'))))
                .forEach((item) => {
                const metodoSelect = item.querySelector('select[name="pagos[][metodo_pago_id]"]');
                const monedaSelect = item.querySelector('select[name="pagos[][moneda]"]');
                const montoInput = item.querySelector('input[name="pagos[][monto]"]');
                const vueltoInput = item.querySelector('[data-role="vuelto"]');
                const vueltoUsdInput = item.querySelector('[data-role="vuelto-usd"]');
                const vueltoBsInput = item.querySelector('[data-role="vuelto-bs"]');
                const vueltoResumen = item.querySelector('[data-role="vuelto-resumen"]');
                const distribucion = item.querySelector('[data-vuelto-distribucion]');

                const esEfectivo = esEfectivoMetodo(metodoSelect);
                const tipoMetodo = metodoSelect?.selectedOptions?.[0]?.dataset?.tipo?.toLowerCase() || '';
                const codigo = ['tarjeta', 'transferencia'].includes(tipoMetodo)
                    ? 'VES'
                    : monedaSelect?.value === 'USD' ? 'USD' : 'VES';
                const recibido = parseMonto(montoInput?.value);
                const recibidoUsd = codigo === 'USD' ? recibido : tasa > 0 ? recibido / tasa : 0;
                const pendiente = Math.max(0, totalPendiente - acumuladoUsd);
                const aplicadoUsd = esEfectivo ? Math.min(recibidoUsd, pendiente) : recibidoUsd;
                const aplicadoMoneda = codigo === 'USD' ? aplicadoUsd : aplicadoUsd * tasa;
                const vuelto = esEfectivo ? Math.max(0, recibido - aplicadoMoneda) : 0;
                const vueltoUsdCalculado = codigo === 'USD' ? vuelto : tasa > 0 ? vuelto / tasa : 0;

                if (vueltoInput) vueltoInput.value = Format.float(vuelto.toFixed(2));
                if (distribucion) distribucion.classList.toggle('hidden', !esEfectivo || vuelto <= 0);
                if (vueltoUsdInput && vueltoBsInput && !item.dataset.vueltoEditado) {
                    if (vuelto > 0 && vueltoUsdCalculado < 1) {
                        vueltoUsdInput.value = '0,00';
                        vueltoBsInput.value = Format.float((vueltoUsdCalculado * tasa).toFixed(2));
                    } else if (vuelto > 0) {
                        vueltoUsdInput.value = Format.float(vueltoUsdCalculado.toFixed(2));
                        vueltoBsInput.value = '0,00';
                    } else {
                        vueltoUsdInput.value = '0,00';
                        vueltoBsInput.value = '0,00';
                    }
                }
                if (vueltoResumen) {
                    const usd = parseMonto(vueltoUsdInput?.value);
                    const bs = parseMonto(vueltoBsInput?.value);
                    vueltoResumen.textContent = esEfectivo && vuelto > 0
                        ? `Entregar: $${Format.float(usd.toFixed(2))} + ${Format.float(bs.toFixed(2))} Bs`
                        : '';
                }
                if (montoInput) {
                    const excede = !esEfectivo && recibidoUsd > pendiente + 0.01;
                    montoInput.classList.toggle('inputError', excede);
                }

                acumuladoUsd += aplicadoUsd;
                });

            if (lblAplicado) lblAplicado.textContent = '$ ' + Format.float(acumuladoUsd.toFixed(2));
            if (lblRestante) {
                const restante = Math.max(0, totalPendiente - acumuladoUsd);
                lblRestante.textContent = '$ ' + Format.float(restante.toFixed(2));
                lblRestante.classList.toggle('text-red-500', restante > 0);
                lblRestante.classList.toggle('text-green-600', restante <= 0);
            }
        };

        const agregarLogicaPago = (root) => {
            const methodPaymentSelect = root.querySelector('select[name="pagos[][metodo_pago_id]"]');
            const monedaSelect = root.querySelector('select[name="pagos[][moneda]"]');
            const montoInput = root.querySelector('input[name="pagos[][monto]"]');
            const vueltoUsdInput = root.querySelector('[data-role="vuelto-usd"]');
            const vueltoBsInput = root.querySelector('[data-role="vuelto-bs"]');
            const referenciaContainer = root.querySelector('[data-referencia-container]');
            const referenciaInput = root.querySelector('input[name="pagos[][referencia_pago]"]');
            const monedaContainer = root.querySelector('[data-moneda-container]');
            const vueltoContainer = root.querySelector('[data-vuelto-container]');
            const montoLabel = root.querySelector('[data-monto-label]');

            Format.formatEventInput({ elements: root.querySelectorAll('input, select') });

            const toggleReferencia = () => {
                const methodsAccep = ['transferencia', 'digital'];
                const metodoSeleccionado = methodPaymentSelect.options[methodPaymentSelect.selectedIndex];
                const metodoTexto = metodoSeleccionado?.dataset?.tipo?.toLowerCase() || '';
                const requiereReferencia = methodsAccep.some((m) => metodoTexto.includes(m));

                if (referenciaContainer) referenciaContainer.classList.toggle('hidden', !requiereReferencia);
                if (referenciaInput) {
                    referenciaInput.required = requiereReferencia;
                    referenciaInput.readOnly = !requiereReferencia;
                    referenciaInput.value = requiereReferencia
                        ? referenciaInput.value === 'N/A'
                            ? ''
                            : referenciaInput.value
                        : 'N/A';
                }
            };

            // Todos los métodos permiten elegir moneda; solo el efectivo genera vuelto.
            const toggleMoneda = () => {
                const efectivo = esEfectivoMetodo(methodPaymentSelect);
                const tipoMetodo = methodPaymentSelect?.selectedOptions?.[0]?.dataset?.tipo?.toLowerCase() || '';
                const esSoloBs = ['tarjeta', 'transferencia'].includes(tipoMetodo);
                if (monedaSelect) {
                    monedaSelect.querySelector('option[value="USD"]')?.toggleAttribute('disabled', esSoloBs);
                    if (esSoloBs) monedaSelect.value = 'VES';
                }

                if (monedaContainer) monedaContainer.classList.remove('hidden');
                if (vueltoContainer) vueltoContainer.classList.toggle('hidden', !efectivo);
                root.querySelector('[data-vuelto-distribucion]')?.classList.toggle('hidden', !efectivo);

                if (montoLabel) {
                    const codigo = monedaSelect?.value === 'VES' ? 'Bs.' : '$';
                    montoLabel.textContent = efectivo ? `Monto recibido (${codigo})` : `Monto recibido (${codigo})`;
                }
            };

            methodPaymentSelect.addEventListener('change', () => {
                toggleReferencia();
                toggleMoneda();
                calcularValores();
            });
            monedaSelect?.addEventListener('change', calcularValores);
            montoInput?.addEventListener('input', calcularValores);
            const actualizarDistribucion = (campoEditado) => {
                const vuelto = parseMonto(root.querySelector('[data-role="vuelto"]')?.value);
                const vueltoUsd = root.querySelector('[data-role="vuelto-usd"]');
                const vueltoBs = root.querySelector('[data-role="vuelto-bs"]');
                if (!vueltoUsd || !vueltoBs || vuelto <= 0 || tasa <= 0) return;

                const tasaVuelto = campoEditado === 'usd'
                    ? Math.min(vuelto, Math.max(0, parseMonto(vueltoUsd.value)))
                    : Math.max(0, vuelto - parseMonto(vueltoBs.value) / tasa);
                vueltoUsd.value = Format.float(tasaVuelto.toFixed(2));
                vueltoBs.value = Format.float(Math.max(0, (vuelto - tasaVuelto) * tasa).toFixed(2));
                root.dataset.vueltoEditado = 'true';
                root.querySelector('[data-role="vuelto-resumen"]')?.replaceChildren(
                    `Entregar: $${Format.float(tasaVuelto.toFixed(2))} + ${Format.float(
                        Math.max(0, (vuelto - tasaVuelto) * tasa).toFixed(2),
                    )} Bs`,
                );
            };
            vueltoUsdInput?.addEventListener('input', () => actualizarDistribucion('usd'));
            vueltoBsInput?.addEventListener('input', () => actualizarDistribucion('bs'));

            toggleReferencia();
            toggleMoneda();
            calcularValores();
        };

        const agregarPago = () => {
            if (!templatePago || !containerPagos) return;

            const clone = templatePago.content.cloneNode(true);
            const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

            clone.querySelectorAll('input, select').forEach((el) => {
                const name = el.getAttribute('name');
                el.setAttribute('id', `${name}-${unique}`);
                const parent = el.closest('.parent');
                parent?.setAttribute('data-id', `${name}-${unique}`);
                const label = parent?.querySelector('label');
                label?.setAttribute('for', `${name}-${unique}`);
            });

            containerPagos.appendChild(clone);
            agregarLogicaPago(containerPagos.lastElementChild);
            calcularValores();
        };

        // 🧹 Reiniciar el modal y listeners (se reasignan en cada apertura)
        if (btnAddPago) btnAddPago.onclick = agregarPago;
        if (containerPagos) {
            containerPagos.onclick = (e) => {
                if (e.target.classList.contains('remove-pago')) {
                    const item = e.target.closest('.pago-item');
                    if (containerPagos.querySelectorAll('.pago-item').length > 1) {
                        item?.remove();
                    } else {
                        const select = item?.querySelector('select[name="pagos[][metodo_pago_id]"]');
                        if (select) select.value = '';
                        const monto = item?.querySelector('input[name="pagos[][monto]"]');
                        if (monto) monto.value = '0,00';
                    }
                    calcularValores();
                }
            };
            containerPagos.innerHTML = '';
        }

        agregarPago();
    }

    setupModalLifecycle(modalOrder);
};

const viewOrder = async (id) => {
    try {
        // 1. Obtener datos en paralelo
        const [pedido, { tasa }] = await Promise.all([
            httpClient.get(`/orders/${id}`).then((res) => res.data),
            httpClient.get('/exchange-rate/actual').then((res) => res.data),
        ]);

        if (!pedido) throw new Error('Pedido no encontrado');

        const {
            detalles = [],
            observaciones = '',
            pagos = [],
            total = 0,
            usuario,
            cliente,
            iva = { porcentaje: 0 },
            fecha,
        } = pedido;

        const modal = document.getElementById('modal-view-order');
        if (!modal) return;

        // ================================
        // 2. Calcular totales con validación
        // ================================
        const ivaPorc = Number(iva.porcentaje) || 0;
        const subtotal = Number(total) || 0;
        const calcIva = (subtotal * ivaPorc) / 100;
        const totalMasIva = subtotal + calcIva;

        // ================================
        // 3. Preparar fecha
        // ================================
        const fechaObj = fecha ? new Date(fecha) : null;
        const fechaTexto = fechaObj
            ? `${fechaObj.toLocaleDateString('es-ES')} - ${fechaObj.toLocaleTimeString('es-ES')}`
            : 'N/A';

        // ================================
        // 4. Rellenar sección cliente
        // ================================
        if (cliente) {
            modal.querySelector('[data-client-name]').textContent = `${cliente.nombre} ${cliente.apellido}`;
            modal.querySelector('[data-client-email]').textContent = cliente.email || '';
            modal.querySelector('[data-client-phone]').textContent = cliente.telefono || '';
            modal.querySelector('[data-client-address]').textContent = cliente.direccion || '';
        }

        // ================================
        // 5. Info general del pedido
        // ================================
        modal.querySelector('[data-pedido-date]').textContent = fechaTexto;
        modal.querySelector('[data-pedido-id]').textContent = `Pedido #${pedido.id}`;
        modal.querySelector('[data-pedido-status]').textContent = pedido.estado;
        modal.querySelector('[data-pedido-observaciones]').textContent = observaciones;

        modal.querySelector('[data-pedido-total]').textContent = '$' + Format.float(totalMasIva.toFixed(2));

        modal.querySelector('[data-pedido-user]').textContent = usuario?.empleado
            ? `${usuario.empleado.nombre} ${usuario.empleado.apellido}`
            : 'N/A';

        // ================================
        // 6. Tabla de detalles del pedido
        // ================================
        setupFilteredTable({
            data: detalles,
            fillTableOptions: {
                templateId: 'fila-ejemplo-detalles-pedido',
                tableSelector: '#pedido-detalles',
                formatters: {
                    producto: (d) => d.producto?.nombre || '',
                    cantidad: (d) => d.cantidad,
                    precio_unitario: (d) => `$${Format.float(d.precio_unitario)}`,
                    precio_pedido_producto: (d) => `$${Format.float(d.precio_pedido_producto)}`,
                    subtotal: (d) => `$${Format.float(d.subtotal)}`,
                    imagen: (d) => {
                        if (!d.imagen) return 'Sin imagen';
                        const src = `/uploads/pedidos/${d.imagen}`;

                        const wrapper = document.createElement('div');
                        wrapper.classList.add('flex', 'flex-row', 'items-center', 'justify-center', 'gap-2');

                        const img = document.createElement('img');
                        img.src = src;
                        img.alt = 'Imagen del diseño';
                        img.title = 'Ver imagen ampliada';
                        img.classList.add('miniatura', 'cursor-zoom-in');
                        img.addEventListener('click', (e) => {
                            e.stopPropagation();
                            window.open(src, '_blank');
                        });

                        const downloadLink = document.createElement('a');
                        downloadLink.href = src;
                        downloadLink.download = d.imagen;
                        downloadLink.title = 'Descargar imagen';
                        downloadLink.classList.add('cursor-pointer');
                        downloadLink.appendChild(intoIcon('download', { classes: ['md-18', 'text-blue-500'] }));

                        wrapper.appendChild(img);
                        wrapper.appendChild(downloadLink);
                        return wrapper;
                    },
                },
            },
        });

        modal.querySelector('[data-pedido-subtotal]').textContent = '$' + Format.float(subtotal.toFixed(2));
        modal.querySelector('[data-pedido-iva-porcentaje]').textContent = ivaPorc + '%';
        modal.querySelector('[data-pedido-iva]').textContent = '$' + Format.float(calcIva.toFixed(2));
        modal.querySelector('[data-pedido-detalle-total]').textContent = '$' + Format.float(totalMasIva.toFixed(2));

        // ================================
        // 7. Pagos
        // ================================
        setupFilteredTable({
            data: pagos,
            fillTableOptions: {
                templateId: 'fila-ejemplo-pago',
                tableSelector: '#pedido-pagos',
                 formatters: {
                     fecha: (p) => formatoFechaPago(p.fecha),
                     tipo: (p) => p.metodo.nombre,
                     referencia: (p) => p.referencia_pago,
                     monto: (p) => '$' + Format.float(Number(p.monto_usd ?? p.monto ?? 0).toFixed(2)),
                     monto_bs: (p) => {
                         const codigoMoneda = String(p.moneda?.codigo || '').toUpperCase();
                         const tasaPago = Number(p.tasa?.tasa) || Number(tasa) || 0;
                         const montoBs = codigoMoneda === 'VES'
                             ? Number(p.monto || 0)
                             : Number(p.monto_usd ?? p.monto ?? 0) * tasaPago;
                         return `${Format.float(montoBs.toFixed(2))} Bs`;
                     },
                 },
            },
        });

        const totalPagos = pagos.reduce((a, p) => a + Number(p.monto_usd ?? p.monto ?? 0), 0);
        modal.querySelector('[data-pedido-pago-total]').textContent = '$' + Format.float(totalPagos.toFixed(2));

        // ================================
        // 8. Event listener seguro
        // ================================
        const btnAgregarPago = modal.querySelector('[data-btn="agregar-pago"]');
        const btnEditStatus = modal.querySelector('#edit_status_order');

        const handler = () => addOrderPayment(id);
        const handlerEditStatus = () => editOrderStatus(id);
        btnAgregarPago.addEventListener('click', handler);
        btnEditStatus.addEventListener('click', handlerEditStatus);
        setupModalLifecycle(
            modal,
            () => {},
            () => {
                btnAgregarPago.removeEventListener('click', handler);
                btnEditStatus.removeEventListener('click', handlerEditStatus);
                removeOrderUrlParam();
            },
        );
    } catch (error) {
        console.error('Error en viewOrder:', error);
    }
};

const editOrderStatus = async (id) => {
    try {
        const pedido = await httpClient.get(`/orders/${id}`).then((res) => res.data);
        if (!pedido) throw new Error('Pedido no encontrado');
        const modal = document.getElementById('modal-update-estado');
        console.log(modal);

        if (!modal) return;
        modal.querySelector('form').action = `/orders/${id}`;
        const select = modal.querySelector('#estado_order');
        select.value = pedido.estado;
        setupModalLifecycle(modal);
    } catch (error) {
        console.error('Error en editOrderStatus:', error);
    }
};

// Búsqueda dinámica de clientes por cédula o nombre
document.addEventListener('DOMContentLoaded', async () => {
    const inputBusqueda = document.getElementById('input_busqueda');
    const contenedorResultados = document.getElementById('resultados_cliente');
    const avisoSinResultados = document.getElementById('sin-resultados-cliente');
    const inputClienteId = document.getElementById('cliente_id');

    const [clientes] = await Promise.all([httpClient.get('/customer').then((res) => res.data)]);

    // 🧩 Filtrar clientes cuando el usuario escribe
    inputBusqueda.addEventListener('input', () => {
        const valor = inputBusqueda.value.trim();
        contenedorResultados.innerHTML = '';
        avisoSinResultados.classList.add('hidden');

        if (!valor) {
            contenedorResultados.classList.add('hidden');
            inputClienteId.value = '';
            avisoSinResultados.classList.remove('hidden');
            return;
        }

        const esCedula = /^[\d\s-]+$/.test(valor);
        const termino = esCedula ? valor.replace(/[\s-]/g, '') : valor.toLowerCase().replace(/\s+/g, ' ');

        // 🔍 Filtrar por cédula o por nombre+apellido
        const coincidencias = clientes.filter((c) => {
            const cedula = c.cedula.replace(/[\s-]/g, '');
            const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase().replace(/\s+/g, ' ');
            return esCedula ? cedula.startsWith(termino) : nombreCompleto.includes(termino);
        });

        // 🧱 Limitar a máximo 10 resultados
        const resultadosLimitados = coincidencias.slice(0, 10);

        if (resultadosLimitados.length === 0) {
            contenedorResultados.classList.add('hidden');
            avisoSinResultados.classList.remove('hidden');
            inputClienteId.value = '';
            return;
        }

        // 🔽 Renderizar coincidencias (máx. 10)
        resultadosLimitados.forEach((c) => {
            const item = document.createElement('div');
            item.className =
                'px-4 py-2 hover:bg-red-100 cursor-pointer text-sm text-gray-800 transition-colors duration-200';

            item.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-semibold text-gray-900">${c.nombre} ${c.apellido}</span>
                    <span class="text-xs text-gray-600">Cédula: ${c.cedula}</span>
                    <span class="text-xs text-gray-600">Tel: ${c.telefono || 'No registrado'}</span>
                    <span class="text-xs text-gray-600">Email: ${c.email || 'No registrado'}</span>
                    <span class="text-xs text-gray-600">Dirección: ${c.direccion || 'No registrada'}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                inputBusqueda.value = `${c.nombre} ${c.apellido} (${c.cedula})`;
                inputClienteId.value = c.id;
                contenedorResultados.classList.add('hidden');
                avisoSinResultados.classList.add('hidden');
            });

            contenedorResultados.appendChild(item);
        });

        contenedorResultados.classList.remove('hidden');
    });

    // Ocultar resultados si hace clic fuera
    document.addEventListener('click', (e) => {
        if (!contenedorResultados.contains(e.target) && e.target !== inputBusqueda) {
            contenedorResultados.classList.add('hidden');
        }
    });
});
// 🧮 Lógica de detalles del pedido con búsqueda dinámica
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const btnAddProducto = document.getElementById('btn-add-producto');
        const containerDetalles = document.getElementById('detalles-pedido');
        const templateDetalle = document.getElementById('template-detalle-producto');

        if (!btnAddProducto || !containerDetalles || !templateDetalle) {
            throw new Error('❌ No se encontró uno de los elementos base: botón, contenedor o template.');
        }

        // 🧾 Cargar productos desde la API
        let productos = [];
        try {
            const res = await httpClient.get('/product');
            productos = res.data;
            if (!Array.isArray(productos)) throw new Error('La respuesta de productos no es un arreglo.');
        } catch (error) {
            console.error('⚠️ Error al cargar los productos desde la API:', error);
            return;
        }

        // ➕ Añadir nuevo detalle
        btnAddProducto.addEventListener('click', () => {
            try {
                const clone = templateDetalle.content.cloneNode(true);
                const id = `${uniqueId(10)}-${new Date().getTime()}`;

                clone.querySelectorAll('input, textarea').forEach((el) => {
                    const name = el.getAttribute('name');
                    if (name) el.setAttribute('id', `${name}-${id}`);
                    const parent = el.closest('.parent');
                    if (parent) parent.setAttribute('data-id', `${name}-${id}`);
                    const label = parent?.querySelector('label');
                    if (label) label.setAttribute('for', `${name}-${id}`);
                });

                const item = clone.querySelector('.detalle-item');
                const inputCodigo = clone.querySelector('.codigo-input');
                const hiddenProductoId = clone.querySelector('.producto-id-hidden');
                const dataProducto = clone.querySelector('[data-producto]');
                const precioInput = clone.querySelector('input[name*="[precio_unitario]"]');
                const rowTokenInput = clone.querySelector('.row-token-input');
                const dropzoneInput = clone.querySelector('[data-dropzone-input]');

                if (!item || !inputCodigo || !hiddenProductoId || !dataProducto || !precioInput) {
                    throw new Error('❌ Faltan elementos dentro del template.');
                }

                if (rowTokenInput) rowTokenInput.value = id;
                if (dropzoneInput) dropzoneInput.name = `detalle_imagen_${id}`;

                dataProducto.classList.add('hidden'); // oculto hasta seleccionar producto

                // 🧩 Contenedor de resultados
                const resultadosDiv = document.createElement('div');
                resultadosDiv.className =
                    'absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg hidden max-h-64 overflow-y-auto';
                inputCodigo.parentNode.appendChild(resultadosDiv);

                // 🔎 Búsqueda dinámica
                inputCodigo.addEventListener('input', () => {
                    try {
                        const valor = inputCodigo.value.trim().toLowerCase();
                        resultadosDiv.innerHTML = '';
                        resultadosDiv.classList.add('hidden');
                        dataProducto.classList.add('hidden');
                        precioInput.value = '';
                        hiddenProductoId.value = '';

                        if (!valor) return;

                        const coincidencias = productos.filter((p) => {
                            const nombre = p.nombre?.toLowerCase() || '';
                            const codigo = p.codigo?.toLowerCase() || '';
                            return nombre.includes(valor) || codigo.includes(valor);
                        });

                        const resultadosLimitados = coincidencias.slice(0, 10);
                        if (resultadosLimitados.length === 0) {
                            resultadosDiv.innerHTML =
                                "<div class='px-4 py-2 text-sm text-gray-500'>Sin resultados</div>";
                            resultadosDiv.classList.remove('hidden');
                            return;
                        }

                        resultadosLimitados.forEach((p) => {
                            const itemRes = document.createElement('div');
                            itemRes.className =
                                'px-4 py-2 hover:bg-red-100 cursor-pointer text-sm text-gray-800 transition-colors duration-200';
                            itemRes.innerHTML = `
                                <div class="flex flex-col">
                                    <span class="font-semibold text-gray-900">${p.nombre}</span>
                                    <span class="text-xs text-gray-600">Código: ${p.codigo}</span>
                                    <span class="text-xs text-gray-600">Categoría: ${
                                        p.categoria?.nombre || 'N/A'
                                    }</span>
                                    <span class="text-xs text-gray-600">Precio: $${p.precio}</span>
                                    <span class="text-xs text-gray-600">Stock: ${p.stock}</span>
                                </div>
                            `;

                            itemRes.addEventListener('click', () => {
                                try {
                                    inputCodigo.value = `${p.codigo} - ${p.nombre}`;
                                    hiddenProductoId.value = p.id;
                                    precioInput.value = Format.float(p.precio);
                                    resultadosDiv.classList.add('hidden');
                                    dataProducto.classList.remove('hidden');
                                    calcularTotales();
                                } catch (err) {
                                    console.error('⚠️ Error al seleccionar producto:', err);
                                }
                            });

                            resultadosDiv.appendChild(itemRes);
                        });

                        resultadosDiv.classList.remove('hidden');
                    } catch (err) {
                        console.error('⚠️ Error durante la búsqueda de productos:', err);
                    }
                });

                // Cerrar lista al hacer clic fuera
                document.addEventListener('click', (e) => {
                    try {
                        if (!resultadosDiv.contains(e.target) && e.target !== inputCodigo) {
                            resultadosDiv.classList.add('hidden');
                        }
                    } catch (err) {
                        console.error('⚠️ Error al cerrar la lista de resultados:', err);
                    }
                });

                const dropzone = clone.querySelector('[data-dropzone]');

                containerDetalles.appendChild(clone);

                if (dropzone) setupImageDropzone(dropzone);
            } catch (err) {
                console.error('❌ Error al agregar nuevo detalle de producto:', err);
            }
        });

        // 🧮 Calcular subtotal dinámicamente
        containerDetalles.addEventListener('input', (e) => {
            try {
                const item = e.target.closest('.detalle-item');
                if (!item) return;

                const cantidadInput = item.querySelector('input[name*="[cantidad]"]');
                const precioInput = item.querySelector('input[name*="[precio_unitario]"]');
                const precioExtraInput = item.querySelector('input[name*="[precio_pedido_producto]"]');
                const subtotalInput = item.querySelector('input[name*="[subtotal]"]');

                const cantidad = parseFloat(cantidadInput?.value) || 0;
                const precio = parseFloat(precioInput?.value.replace(',', '.')) || 0;
                const precioExtra = parseFloat(precioExtraInput?.value.replace(',', '.')) || 0;

                const eventos = ['input', 'change', 'blur'];

                eventos.forEach((event) => {
                    precioExtraInput.addEventListener(event, Format.formatInput);
                });
                const subtotal = cantidad * (precio + precioExtra);
                subtotalInput.value = Format.float(subtotal.toFixed(2));

                calcularTotales();
            } catch (err) {
                console.error('⚠️ Error en el cálculo del subtotal:', err);
            }
        });

        // ❌ Eliminar detalle
        containerDetalles.addEventListener('click', (e) => {
            try {
                if (e.target.classList.contains('remove-detalle')) {
                    e.target.closest('.detalle-item').remove();
                    calcularTotales();
                }
            } catch (err) {
                console.error('⚠️ Error al eliminar un detalle:', err);
            }
        });
    } catch (error) {
        console.error('🚨 Error general en el módulo de detalles del pedido:', error);
    }
});

// 🔁 Calcular subtotal y totales
const calcularTotales = () => {
    let sumaSubTotal = 0;

    const form = document.getElementById('pedido-form');

    const inputSumaSubtotal = form.querySelector('input[name="total"]');
    const inputTotalMasIVA = form.querySelector('input[name="totalMasIVA"]');
    const inputTotalBS = form.querySelector('input[name="total_bs"]');

    document.querySelectorAll('#detalles-pedido input[name*="[subtotal]"]').forEach((input) => {
        const valor = Number(input.value.replace(',', '.'));
        sumaSubTotal += valor;
    });

    const inputIvaPorcentaje = form.querySelector('input[name="iva_porcentaje"]');
    const porcentajeIva = parseFloat(inputIvaPorcentaje?.value) || 0;
    const valueTasaDolar = parseFloat(inputTotalBS.dataset.value) || 0;
    const totalConIva = sumaSubTotal + (sumaSubTotal * porcentajeIva) / 100;
    const totalBS = totalConIva * valueTasaDolar;

    inputSumaSubtotal.value = Format.float(sumaSubTotal.toFixed(2));
    inputTotalMasIVA.value = Format.float(totalConIva.toFixed(2));
    inputTotalBS.value = Format.float(totalBS.toFixed(2));
};
document.getElementById('generate_pdf_order').addEventListener('click', () => {
    generarPDF('#order-general-info', 'detalle_pedido');
});

document.addEventListener('DOMContentLoaded', () => {
    initStatusBar();
});

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    if (orderId) viewOrder(orderId);
});
