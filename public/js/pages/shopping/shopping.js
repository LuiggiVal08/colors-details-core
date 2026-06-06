import { httpClient } from '../../index.js';
import { setupModalLifecycle } from '../../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../../helpers/setupFilteredTable.js';
// import badge from '../../helpers/badge.js';
// import { validateInputElement } from '../../helpers/validateInput.js';
import { Format } from '../../helpers/Format.js';
import uniqueId from '../../helpers/uniqueId.js';
import { generarPDF } from '../../helpers/generatePdf.js';
// llenado de tabla de compras
document.addEventListener('DOMContentLoaded', async () => {
    const [ventas, tasaDolar] = await Promise.all([
        httpClient.get('/shopping').then((res) => res.data),
        httpClient.get('/exchange-rate/actual').then((res) => res.data),
    ]);

    setupFilteredTable({
        data: ventas,
        filterInputs: {
            search: document.getElementById('inputSearchShopping'),
        },
        filterFn: (venta, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            const nombre = venta?.cliente?.nombre?.toLowerCase() ?? '';
            const apellido = venta?.cliente?.apellido?.toLowerCase() ?? '';
            const nombreCompleto = `${nombre} ${apellido}`.trim();
            return texto ? nombreCompleto.includes(texto) : true;
        },

        fillTableOptions: {
            templateId: 'fila-ejemplo-shopping',
            tableSelector: '#ejemplo-shopping-tabla-body',
            actions: {
                view: (e) => {
                    viewPurchase(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                cliente: (sale) => `${sale.cliente.nombre} ${sale.cliente.apellido}`,
                fecha: (sale) =>
                    new Date(sale.fecha).toLocaleDateString('es-ES') +
                    '-' +
                    new Date(sale.fecha).toLocaleTimeString('es-ES'),

                total: (sale) => {
                    const porcentajeIva = (Number(sale.iva.porcentaje) * Number(sale.total)) / 100;
                    return `$${Format.float((Number(sale.total) + porcentajeIva).toFixed(2))}`;
                },
                total_bs: (sale) => {
                    const totalBs = sale.pagos.reduce((acum, pago) => {
                        const monto = parseFloat(pago.monto || 0);
                        const tasa = parseFloat(pago?.tasa?.tasa || 0);
                        return acum + monto * tasa;
                    }, 0);
                    const porcentajeIva = (Number(sale.iva.porcentaje) * Number(totalBs)) / 100;
                    return `${Format.float((Number(totalBs) + porcentajeIva).toFixed(2))}BS.s`;
                },
                observaciones: (sale) => sale.observaciones,
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-shopping .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-shopping .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 10,
    });
});

document.getElementById('btnAddShopping').addEventListener('click', () => {
    const modalCreate = document.querySelector('#modal-create-shopping');
    if (!modalCreate) {
        console.error('Modal de creación de Método de Pago no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
const viewPurchase = async (id) => {
    try {
        const modalViewPurchase = document.getElementById('modal-view-purchase');
        if (!modalViewPurchase) return;

        const [purchase, { tasa }] = await Promise.all([
            httpClient.get(`/shopping/${id}`).then((res) => res.data),
            httpClient.get('/exchange-rate/actual').then((res) => res.data),
        ]);

        const { detalles, observaciones, pagos, total, usuario, cliente, iva, fecha } = purchase;

        const calcIva = (Number(total) * Number(iva.porcentaje)) / 100;
        const totalMasIva = Number(total) + calcIva;

        // --- Información del cliente ---
        if (cliente) {
            modalViewPurchase.querySelector('[data-client-name]').textContent = cliente.nombre + ' ' + cliente.apellido;
            modalViewPurchase.querySelector('[data-client-email]').textContent = cliente.email;
            modalViewPurchase.querySelector('[data-client-phone]').textContent = cliente.telefono;
            modalViewPurchase.querySelector('[data-client-address]').textContent = cliente.direccion;
        }

        // --- Información de la compra ---
        modalViewPurchase.querySelector('[data-purchase-date]').textContent =
            new Date(fecha).toLocaleDateString('es-ES') + ' - ' + new Date(fecha).toLocaleTimeString('es-ES');
        modalViewPurchase.querySelector('[data-purchase-user]').textContent =
            usuario?.empleado?.nombre + ' ' + usuario?.empleado?.apellido;
        // modalViewPurchase.querySelector('[data-purchase-observaciones]').textContent = observaciones || '-';
        modalViewPurchase.querySelector('[data-purchase-total]').textContent =
            '$' + Format.float(totalMasIva.toFixed(2));

        // --- Detalles de la compra ---
        if (detalles) {
            setupFilteredTable({
                data: detalles,
                fillTableOptions: {
                    templateId: 'fila-ejemplo-detalles-purchase',
                    tableSelector: '#purchase-detalles',
                    formatters: {
                        producto: (item) => item.producto.nombre,
                        cantidad: (item) => item.cantidad,
                        precio_unitario: (item) => `$${Format.float(item.precio_unitario)}`,
                        subtotal: (item) => `$${Format.float(item.subtotal)}`,
                    },
                },
            });
            modalViewPurchase.querySelector('[data-purchase-subtotal]').textContent = '$' + Format.float(total);
            modalViewPurchase.querySelector('[data-purchase-iva-porcentaje]').textContent = iva.porcentaje + '%';
            modalViewPurchase.querySelector('[data-purchase-iva]').textContent = '$' + Format.float(calcIva.toFixed(2));
            modalViewPurchase.querySelector('[data-purchase-detalle-total]').textContent =
                '$' + Format.float(totalMasIva.toFixed(2));
        }

        // --- Pagos ---
        if (pagos) {
            setupFilteredTable({
                data: pagos,
                fillTableOptions: {
                    templateId: 'fila-ejemplo-pago-purchase',
                    tableSelector: '#purchase-pagos',
                 formatters: {
                     fecha: (p) => new Date(p.fecha).toLocaleDateString('es-ES'),
                     tipo: (p) => p.metodo_pago.nombre,
                     referencia: (p) => p.referencia_pago,
                     monto: (p) => '$' + Format.float(p.monto),
                     monto_bs: (p) => '$' + Format.float((Number(p.monto) * Number(tasa)).toFixed(2)),
                 },
                },
            });

            const totalPagos = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

            modalViewPurchase.querySelector('[data-purchase-pago-total]').textContent =
                '$' + Format.float(totalPagos.toFixed(2));
        }

        // --- Botones ---
        const btnAgregarPago = modalViewPurchase.querySelector('[data-btn="agregar-pago"]');
        if (btnAgregarPago) {
            btnAgregarPago.addEventListener('click', () => addPurchasePayment(id));
        }

        setupModalLifecycle(
            modalViewPurchase,
            () => {},
            () => btnAgregarPago?.removeEventListener('click', () => addPurchasePayment(id)),
        );
    } catch (error) {
        console.error('Error al mostrar la compra:', error);
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

//  Pagos de venta
document.addEventListener('DOMContentLoaded', async () => {
    const response = await httpClient.get('/exchange-rate/actual');
    const { data: tasaDolar } = response;

    const btnAddPago = document.getElementById('btn-add-pago');
    const templatePago = document.getElementById('template-pago');
    const containerPagos = document.getElementById('pagos-venta');
    const totalPagoInput = document.getElementById('total_pago');

    const tasa = parseFloat(tasaDolar?.tasa) || 0;

    // ✅ FUNCIÓN PRINCIPAL PARA CALCULAR TOTALES
    const calcularTotales = () => {
        let totalUSD = 0;

        containerPagos.querySelectorAll('.pago-item').forEach((item) => {
            const inputUSD = item.querySelector('input[name="pagos[][monto]"]');
            const valor = parseFloat(inputUSD?.value.replace(/\./g, '').replace(',', '.')) || 0;
            totalUSD += valor;
        });

        totalPagoInput.value = Format.float(totalUSD.toFixed(2));

        // 🔹 Calculamos restante (si existe totalMasIVA)
        const totalMasIVAInput = document.getElementById('totalMasIVA');
        if (totalMasIVAInput) {
            const totalVenta = parseFloat(totalMasIVAInput.value.replace(',', '.')) || 0;
            const restante = totalVenta - totalUSD;

            const lblRestanteGlobal = document.getElementById('total_faltante');
            if (lblRestanteGlobal) {
                lblRestanteGlobal.value = Format.float(restante.toFixed(2));
                lblRestanteGlobal.classList.toggle('text-red-500', restante > 0);
                lblRestanteGlobal.classList.toggle('text-green-600', restante <= 0);
            }

            const restanteGlobalBs = restante * tasa;
            const lblRestanteGlobalBs = document.getElementById('total_faltante_bs');
            if (lblRestanteGlobalBs) {
                lblRestanteGlobalBs.value = Format.float(restanteGlobalBs.toFixed(2));
                lblRestanteGlobalBs.classList.toggle('text-red-500', restanteGlobalBs > 0);
                lblRestanteGlobalBs.classList.toggle('text-green-600', restanteGlobalBs <= 0);
            }

            // Actualizar los inputs de "restante" por cada pago
            containerPagos.querySelectorAll('.restante-input').forEach((input) => {
                input.value = Format.float(restante.toFixed(2));
                input.classList.toggle('text-red-500', restante > 0);
                input.classList.toggle('text-green-600', restante <= 0);
            });
        }
    };

    // ✅ AGREGA LÓGICA DE CÁLCULO A CADA PAGO (bidireccional Bs ↔ USD)
    const agregarLogicaPago = (root) => {
        const montoPaymentInput = root.querySelector('input[name="pagos[][monto_payment]"]'); // Bs.
        const methodPaymentSelect = root.querySelector('select[name="pagos[][metodo_pago_id]"]');
        const montoUSDInput = root.querySelector('input[name="pagos[][monto]"]'); // $
        const referenciaContainer = root.querySelector('[data-referencia-container]');
        const referenciaInput = root.querySelector('input[name="pagos[][referencia_pago]"]');

        Format.formatEventInput({ elements: root.querySelectorAll('input, select') });

        const toggleReferencia = () => {
            const methodsAccep = ['transferencia', 'digital'];
            const metodoSeleccionado = methodPaymentSelect.options[methodPaymentSelect.selectedIndex];
            const metodoTexto = metodoSeleccionado?.dataset?.tipo.toLowerCase() || '';
            const requiereReferencia = methodsAccep.some((m) => metodoTexto.includes(m));
            console.log(metodoTexto);

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

        // Limpieza inicial
        montoPaymentInput.value = '0,00';
        montoUSDInput.value = '0,00';

        const calcularValores = (origen = 'bs') => {
            let montoBS = 0;
            let montoUSD = 0;

            if (origen === 'bs') {
                // 💵 Usuario modificó el campo de bolívares
                const montoIngresado = parseFloat(montoPaymentInput.value.replace(/\./g, '').replace(',', '.')) || 0;
                montoBS = montoIngresado;
                montoUSD = montoIngresado / tasa;
            } else if (origen === 'usd') {
                // 💵 Usuario modificó el campo de dólares
                const montoIngresadoUSD = parseFloat(montoUSDInput.value.replace(/\./g, '').replace(',', '.')) || 0;
                montoUSD = montoIngresadoUSD;
                montoBS = montoIngresadoUSD * tasa;
            }

            // 🧾 Actualizamos campos
            montoPaymentInput.value = Format.float(montoBS.toFixed(2));
            montoUSDInput.value = Format.float(montoUSD.toFixed(2));

            calcularTotales();
        };

        // 📌 Eventos sincronizados
        methodPaymentSelect.addEventListener('change', () => {
            calcularValores('bs');
            toggleReferencia();
        });
        montoPaymentInput.addEventListener('input', () => calcularValores('bs')); // Bs → USD
        montoUSDInput.addEventListener('input', () => calcularValores('usd')); // USD → Bs

        // 🔹 Ejecutar cálculo inicial por si hay valores precargados
        calcularTotales();
    };

    // ✅ CUANDO SE AGREGA UN NUEVO PAGO
    btnAddPago.addEventListener('click', () => {
        const clone = templatePago.content.cloneNode(true);
        const id = `${uniqueId(10)}-${new Date().getTime()}`;

        clone.querySelectorAll('input, select').forEach((el) => {
            const name = el.getAttribute('name');
            el.setAttribute('id', `${name}-${id}`);
            const parent = el.closest('.parent');
            parent?.setAttribute('data-id', `${name}-${id}`);
            const label = parent?.querySelector('label');
            label?.setAttribute('for', `${name}-${id}`);
        });

        const newPagoItem = clone.querySelector('.pago-item');
        containerPagos.appendChild(clone);

        // 🔹 Aplicar lógica de cálculo al nuevo pago
        agregarLogicaPago(containerPagos.lastElementChild);

        // 🔹 Recalcular totales al agregar
        calcularTotales();
    });

    // ✅ CUANDO SE ELIMINA UN PAGO
    containerPagos.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pago')) {
            const item = e.target.closest('.pago-item');
            item.remove();
            calcularTotales();
        }
    });

    // ✅ LÓGICA PARA PAGOS YA EXISTENTES
    containerPagos.querySelectorAll('.pago-item').forEach((item) => {
        agregarLogicaPago(item);
    });

    // 🔹 Calcular totales iniciales al cargar todo
    calcularTotales();
});

// Gestión de detalles de productos en la compra
document.addEventListener('DOMContentLoaded', async () => {
    const btnAddProducto = document.getElementById('btn-add-producto');
    const containerDetalles = document.getElementById('detalles-venta');
    const templateDetalle = document.getElementById('template-detalle-producto');

    // Cargar productos desde API
    const [productos] = await Promise.all([httpClient.get('/product').then((res) => res.data)]);

    btnAddProducto.addEventListener('click', () => {
        const clone = templateDetalle.content.cloneNode(true);
        const id = `${uniqueId(10)}-${new Date().getTime()}`;
        clone.querySelectorAll('input').forEach((el) => {
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

        // Inicialmente ocultar el bloque de datos del producto
        dataProducto.classList.add('hidden');

        // Crear contenedor de resultados
        const resultadosDiv = document.createElement('div');
        resultadosDiv.className =
            'absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg hidden max-h-64 overflow-y-auto';
        inputCodigo.parentNode.appendChild(resultadosDiv);

        // 🧩 Búsqueda dinámica
        inputCodigo.addEventListener('input', () => {
            const valor = inputCodigo.value.trim().toLowerCase();
            resultadosDiv.innerHTML = '';
            resultadosDiv.classList.add('hidden');
            dataProducto.classList.add('hidden');
            precioInput.value = '';
            hiddenProductoId.value = ''; // 🔴 Limpia el ID si se borra el texto

            if (!valor) return;

            // Filtrar por código o nombre
            const coincidencias = productos.filter((p) => {
                const nombre = p.nombre.toLowerCase();
                const codigo = p.codigo.toLowerCase();
                return nombre.includes(valor) || codigo.includes(valor);
            });

            // Limitar a 10 resultados
            const resultadosLimitados = coincidencias.slice(0, 10);

            if (resultadosLimitados.length === 0) {
                resultadosDiv.innerHTML = "<div class='px-4 py-2 text-sm text-gray-500'>Sin resultados</div>";
                resultadosDiv.classList.remove('hidden');
                return;
            }

            // Renderizar resultados
            resultadosLimitados.forEach((p) => {
                const itemRes = document.createElement('div');
                itemRes.className =
                    'px-4 py-2 hover:bg-red-100 cursor-pointer text-sm text-gray-800 transition-colors duration-200';
                itemRes.innerHTML = `
                    <div class="flex flex-col">
                        <span class="font-semibold text-gray-900">${p.nombre}</span>
                        <span class="text-xs text-gray-600">Código: ${p.codigo}</span>
                        <span class="text-xs text-gray-600">Categoría: ${p.categoria?.nombre || 'N/A'}</span>
                        <span class="text-xs text-gray-600">Precio: $${p.precio}</span>
                        <span class="text-xs text-gray-600">Stock: ${p.stock}</span>
                    </div>
                `;

                itemRes.addEventListener('click', () => {
                    inputCodigo.value = `${p.codigo} - ${p.nombre}`;
                    hiddenProductoId.value = p.id; // ✅ Guardar el ID en el input hidden
                    precioInput.value = Format.float(p.precio);
                    resultadosDiv.classList.add('hidden');
                    dataProducto.classList.remove('hidden');
                    calcularTotales();
                });

                resultadosDiv.appendChild(itemRes);
            });

            resultadosDiv.classList.remove('hidden');
        });

        // Cerrar resultados al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!resultadosDiv.contains(e.target) && e.target !== inputCodigo) {
                resultadosDiv.classList.add('hidden');
            }
        });

        containerDetalles.appendChild(clone);
    });

    // 🧮 Delegación para cantidad y subtotal
    containerDetalles.addEventListener('input', (e) => {
        const item = e.target.closest('.detalle-item');
        if (!item) return;

        const cantidadInput = item.querySelector('input[name*="[cantidad]"]');
        const precioInput = item.querySelector('input[name*="[precio_unitario]"]');
        const subtotalInput = item.querySelector('input[name*="[subtotal]"]');

        if (e.target.name?.includes('[cantidad]') || e.target.name?.includes('[precio_unitario]')) {
            const cantidad = parseFloat(cantidadInput.value) || 0;
            const precio = parseFloat(precioInput.value.replace(',', '.')) || 0;
            subtotalInput.value = Format.float((cantidad * precio).toFixed(2));
            calcularTotales();
        }
    });

    // ❌ Eliminar producto
    containerDetalles.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-detalle')) {
            e.target.closest('.detalle-item').remove();
            calcularTotales();
        }
    });
});

const calcularTotales = () => {
    const form = document.getElementById('shopping-form');
    const inputSumaSubtotal = form.querySelector('input[name="total"]');
    const inputTotalMasIVA = form.querySelector('input[name="totalMasIVA"]');
    const inputTotalBS = form.querySelector('input[name="total_bs"]');

    // 🔹 Cálculo de subtotales e IVA
    let sumaSubTotal = 0;
    document.querySelectorAll('#detalles-venta input[name*="[subtotal]"]').forEach((input) => {
        const valor = Number(input.value.replace(',', '.')) || 0;
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

    // 🔹 Cálculo de los pagos (en dólares)
    const containerPagos = document.getElementById('pagos-venta');
    const totalPagoInput = form.querySelector('input[name="total_pago"]');
    let totalPagosUSD = 0;

    containerPagos?.querySelectorAll('.pago-item').forEach((item) => {
        const inputUSD = item.querySelector('input[name="pagos[][monto]"]');
        const valor = parseFloat(inputUSD?.value.replace(/\./g, '').replace(',', '.')) || 0;
        totalPagosUSD += valor;
    });

    if (totalPagoInput) totalPagoInput.value = Format.float(totalPagosUSD.toFixed(2));

    // 🔹 Calcular restante (lo que falta por pagar)
    const restanteGlobal = totalConIva - totalPagosUSD;
    console.log('restante global', restanteGlobal);
    const restanteGlobalBs = restanteGlobal * valueTasaDolar;
    // 🔹 Mostrar restante global (si tienes un campo visible)
    console.log('hola');
    const lblRestanteGlobal = document.getElementById('total_faltante');
    if (lblRestanteGlobal) {
        lblRestanteGlobal.value = Format.float(restanteGlobal.toFixed(2));
        lblRestanteGlobal.classList.toggle('text-red-500', restanteGlobal > 0);
        lblRestanteGlobal.classList.toggle('text-green-600', restanteGlobal <= 0);
    }
    const lblRestanteGlobalBs = document.getElementById('total_faltante_bs');
    console.log('hola');
    if (lblRestanteGlobalBs) {
        lblRestanteGlobalBs.value = Format.float(restanteGlobalBs.toFixed(2));
        lblRestanteGlobalBs.classList.toggle('text-red-500', restanteGlobalBs > 0);
        lblRestanteGlobalBs.classList.toggle('text-green-600', restanteGlobalBs <= 0);
    }
};
document.getElementById('generate_pdf_shopping').addEventListener('click', () => {
    generarPDF('#purchase-info-container', 'detalle_compra');
});
