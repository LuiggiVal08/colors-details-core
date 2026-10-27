import { httpClient, socket } from '../index.js';
import showToast from '../helpers/Toast.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
import { closeModal } from '../helpers/handleModal.js';
import { Format } from '../helpers/Format.js';

function fmt(val) {
    const n = parseFloat(val) || 0;
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function renderSummary(nominas) {
    document.getElementById('total-nominas').textContent = nominas?.length || '0';
    const totalPaidBs = (nominas || []).reduce((s, n) => s + (parseFloat(n.total_pagado) || 0), 0);
    const latestTasa = nominas?.[0]?.tasa?.tasa ? parseFloat(nominas[0].tasa.tasa) : 0;
    const totalPaidUsd = latestTasa > 0 ? totalPaidBs / latestTasa : 0;
    document.getElementById('total-paid-all').textContent = `$${fmt(totalPaidUsd)}`;
    try {
        const empResp = await httpClient.get('/employe');
        const emps = Array.isArray(empResp?.data) ? empResp.data : [];
        const activos = emps.filter((e) => e.activo).length;
        document.getElementById('total-employees-all').textContent = activos || '0';
    } catch {
        document.getElementById('total-employees-all').textContent = '—';
    }
    if (nominas && nominas.length > 0) {
        const last = new Date(nominas[0].creado_en).toLocaleDateString('es-VE');
        document.getElementById('last-nomina-date').textContent = last;
    }
}

const modalPagarNomina = document.getElementById('modal-pagar-nomina');
const formPagarNomina = document.getElementById('form-pagar-nomina');
const medioPagoNomina = document.getElementById('medio_pago_nomina');
const datosPagoDigitalNomina = document.getElementById('datos-pago-digital-nomina');

medioPagoNomina?.addEventListener('change', () => {
    const esDigital = medioPagoNomina.value === 'digital';
    datosPagoDigitalNomina?.classList.toggle('hidden', !esDigital);
    const referenciaInput = formPagarNomina?.querySelector('[name="referencia"]');
    if (referenciaInput) referenciaInput.required = esDigital;
});

const abrirModalPagarNomina = (nomina) => {
    if (!modalPagarNomina || !formPagarNomina) return console.error('Modal de pago de nómina no encontrado');

    const totalBs = Number(nomina.total_monto) || 0;
    const pagadoBs = Number(nomina.total_pagado) || 0;
    const pendienteBs = Math.max(0, totalBs - pagadoBs);

    modalPagarNomina.querySelector('[data-nomina-periodo]').textContent = `${nomina.periodo_inicio} - ${nomina.periodo_fin}`;
    modalPagarNomina.querySelector('[data-nomina-total]').textContent = `${fmt(totalBs)} Bs`;
    modalPagarNomina.querySelector('[data-nomina-pagado]').textContent = `${fmt(pagadoBs)} Bs`;
    modalPagarNomina.querySelector('[data-nomina-pendiente]').textContent = `${fmt(pendienteBs)} Bs`;

    formPagarNomina.querySelector('[name="nomina_id"]').value = nomina.id;
    const montoInput = formPagarNomina.querySelector('[name="monto"]');
    if (montoInput) montoInput.value = Format.float(pendienteBs.toFixed(2));
    if (medioPagoNomina) medioPagoNomina.value = 'efectivo';
    datosPagoDigitalNomina?.classList.add('hidden');
    const referenciaInput = formPagarNomina.querySelector('[name="referencia"]');
    if (referenciaInput) {
        referenciaInput.value = '';
        referenciaInput.required = false;
    }
    const cuentaInput = formPagarNomina.querySelector('[name="cuenta_receptora"]');
    if (cuentaInput) cuentaInput.value = '';

    setupModalLifecycle(modalPagarNomina);
};

if (formPagarNomina) {
    formPagarNomina.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nominaId = formPagarNomina.querySelector('[name="nomina_id"]').value;
        const monto = formPagarNomina.querySelector('[name="monto"]').value;
        const btn = formPagarNomina.querySelector('[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Procesando...';
        }

        try {
            const response = await httpClient.post(`/nomina/${nominaId}/pagar`, {
                monto,
                medio_pago: medioPagoNomina?.value || 'efectivo',
                referencia: formPagarNomina.querySelector('[name="referencia"]')?.value || undefined,
                cuenta_receptora: formPagarNomina.querySelector('[name="cuenta_receptora"]')?.value || undefined,
            });

            if (response.error) {
                showToast({
                    title: 'Error',
                    message: response.error.error || response.message || 'No se pudo pagar la nómina',
                    type: 'error',
                    duration: 5000,
                });
                return;
            }

            showToast({
                title: 'Nómina pagada',
                message: response.message || 'El pago se registró correctamente',
                type: 'success',
                duration: 5000,
            });

            closeModal(modalPagarNomina);
            await loadNominas();
        } catch (err) {
            showToast({
                title: 'Error',
                message: 'Ocurrió un error inesperado al pagar la nómina',
                type: 'error',
                duration: 5000,
            });
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Confirmar Pago';
            }
        }
    });
}

const tbody = document.getElementById('table-nomina');
const template = document.getElementById('fila-nomina');
const esAdmin = document.getElementById('table-nomina-container')?.dataset.esAdmin === 'true';

async function renderNominas(nominas) {
        await renderSummary(nominas);
        tbody.innerHTML = '';
        if (!nominas || nominas.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="10" class="text-center p-3 text-gray-500">No hay nóminas registradas</td></tr>';
            return;
        }
        nominas.forEach((nom) => {
            const row = template.content.cloneNode(true);
            const cells = row.querySelectorAll('[data-key]');
            cells.forEach((cell) => {
                const key = cell.dataset.key;
                if (key === 'periodo') {
                    const desde = new Date(nom.periodo_inicio).toLocaleDateString('es-VE');
                    const hasta = new Date(nom.periodo_fin).toLocaleDateString('es-VE');
                    cell.textContent = `${desde} - ${hasta}`;
                } else if (key === 'tasa') {
                    cell.textContent = `${fmt(nom.tasa?.tasa || 0)} Bs.`;
                } else if (key === 'total_empleados') {
                    cell.textContent = nom.total_empleados || '0';
                } else if (key === 'total_monto') {
                    const usd = nom.total_monto && nom.tasa?.tasa ? parseFloat(nom.total_monto) / parseFloat(nom.tasa.tasa) : 0;
                    cell.textContent = `$${fmt(usd)}`;
                } else if (key === 'total_bs') {
                    cell.textContent = `${fmt(nom.total_monto || 0)} Bs.`;
                } else if (key === 'pendiente') {
                    const pendienteBs = (nom.total_monto || 0) - (nom.total_pagado || 0);
                    const pendienteUsd = nom.tasa?.tasa ? pendienteBs / parseFloat(nom.tasa.tasa) : 0;
                    const badge = document.createElement('span');
                    if (pendienteBs <= 0) {
                        badge.className = 'px-2 py-0.5 text-xs text-white rounded-full bg-green-500';
                        badge.textContent = 'Pagado';
                    } else {
                        badge.className = 'px-2 py-0.5 text-xs text-white rounded-full bg-amber-500';
                        badge.textContent = `$${fmt(pendienteUsd)}`;
                    }
                    cell.appendChild(badge);
                } else if (key === 'estado_pago') {
                    const estadoPago = nom.estado_pago || 'pendiente';
                    const configPago = {
                        pagada: { texto: 'Pagada', clase: 'bg-green-500' },
                        parcial: { texto: 'Parcial', clase: 'bg-amber-500' },
                        pendiente: { texto: 'Pendiente', clase: 'bg-gray-400' },
                    }[estadoPago] || { texto: estadoPago, clase: 'bg-gray-400' };
                    const badgePago = document.createElement('span');
                    badgePago.className = `px-2 py-0.5 text-xs text-white rounded-full ${configPago.clase}`;
                    badgePago.textContent = configPago.texto;
                    cell.appendChild(badgePago);
                } else if (key === 'estado') {
                    const badge = document.createElement('span');
                    const colores = { completed: 'bg-green-500', processing: 'bg-yellow-500', failed: 'bg-red-500' };
                    badge.className = `px-2 py-1 text-xs text-white rounded-full ${colores[nom.estado] || 'bg-gray-400'}`;
                    badge.textContent = nom.estado === 'completed' ? 'Completado' : nom.estado === 'processing' ? 'Procesando' : 'Fallido';
                    cell.appendChild(badge);
                } else if (key === 'usuario') {
                    cell.textContent = nom.usuario?.username || '-';
                } else if (key === 'acciones') {
                    if (esAdmin && nom.estado === 'completed' && nom.estado_pago !== 'pagada') {
                        const btnPagar = document.createElement('button');
                        btnPagar.type = 'button';
                        btnPagar.className =
                            'inline-flex items-center gap-1 bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium rounded-md px-3 py-1.5 cursor-pointer';
                        btnPagar.textContent = 'Pagar';
                        btnPagar.addEventListener('click', () => abrirModalPagarNomina(nom));
                        cell.appendChild(btnPagar);
                    }
                }
            });
            tbody.appendChild(row);
        });
}

async function loadNominas() {
    try {
        const response = await httpClient.get('/nomina');
        await renderNominas(response.data);
    } catch (err) {
        console.error('Error cargando nóminas:', err);
        tbody.innerHTML =
            '<tr><td colspan="10" class="text-center p-3 text-red-500">Error al cargar nóminas</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('form-generar-nomina');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-generar-nomina');
        btn.disabled = true;
        btn.textContent = 'Procesando...';

        const formData = new FormData(form);
        const data = {
            periodo_inicio: formData.get('periodo_inicio'),
            periodo_fin: formData.get('periodo_fin'),
        };

        try {
            const response = await httpClient.post('/nomina/generate', data);
            if (response.error) {
                showToast({ title: 'Error', message: response.error.error || response.message, type: 'error', duration: 5000 });
            } else {
                showToast({ title: 'Nómina en proceso', message: response.message, type: 'success', duration: 5000 });
            }
        } catch (err) {
            showToast({ title: 'Error', message: 'Error al generar nómina', type: 'error', duration: 5000 });
        } finally {
            btn.disabled = false;
            btn.textContent = 'Generar Nómina';
        }
    });

    if (socket) {
        socket.on('nomina_generada', (data) => {
            const usdTotal = data.tasa ? (data.total_monto || 0) / parseFloat(data.tasa) : 0;
            showToast({
                title: 'Nómina generada',
                message: `${data.total_empleados} empleados - $${fmt(usdTotal)}`,
                type: 'success',
                duration: 5000,
            });
            loadNominas();
        });
    }

    await loadNominas();
});
