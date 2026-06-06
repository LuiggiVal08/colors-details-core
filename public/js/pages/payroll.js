import { httpClient, socket } from '../index.js';
import showToast from '../helpers/Toast.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';

function fmt(val) {
    const n = parseFloat(val) || 0;
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function renderSummary(nominas) {
    document.getElementById('total-nominas').textContent = nominas?.length || '0';
    const totalPaidBs = (nominas || []).reduce((s, n) => s + (parseFloat(n.total_monto) || 0), 0);
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

function renderDetailsModal(nomina) {
    const modal = document.getElementById('modal-global');
    if (!modal) return;
    const body = modal.querySelector('.modal-body');
    if (!body) return;

    const desde = new Date(nomina.periodo_inicio).toLocaleDateString('es-VE');
    const hasta = new Date(nomina.periodo_fin).toLocaleDateString('es-VE');
    const tasa = nomina.tasa?.tasa || 0;
    const usdTotal = tasa > 0 ? (parseFloat(nomina.total_monto) || 0) / parseFloat(tasa) : 0;

    let html = `
        <div class='p-4 space-y-4'>
            <div class='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <div class='bg-gray-50 rounded p-2'>
                    <p class='text-xs text-gray-500'>Período</p>
                    <p class='font-semibold'>${desde} - ${hasta}</p>
                </div>
                <div class='bg-gray-50 rounded p-2'>
                    <p class='text-xs text-gray-500'>Tasa Bs.</p>
                    <p class='font-semibold'>${fmt(tasa)} Bs.</p>
                </div>
                <div class='bg-gray-50 rounded p-2'>
                    <p class='text-xs text-gray-500'>Total USD</p>
                    <p class='font-semibold text-green-600'>$${fmt(usdTotal)}</p>
                    <p class='text-xs text-gray-500'>${fmt(nomina.total_monto)} Bs.</p>
                </div>
                <div class='bg-gray-50 rounded p-2'>
                    <p class='text-xs text-gray-500'>Estado</p>
                    <p class='font-semibold'>${nomina.estado === 'completed' ? 'Completado' : nomina.estado}</p>
                </div>
            </div>
            <div class='overflow-x-auto'>
                <table class='w-full border-collapse'>
                    <thead>
                        <tr class='border-b border-gray-200'>
                            <th class='text-left p-2 text-sm font-medium text-gray-700'>Empleado</th>
                            <th class='text-right p-2 text-sm font-medium text-gray-700'>Salario Base</th>
                            <th class='text-right p-2 text-sm font-medium text-gray-700'>Bono</th>
                            <th class='text-right p-2 text-sm font-medium text-gray-700'>Deducción</th>
                            <th class='text-right p-2 text-sm font-medium text-gray-700'>Total USD</th>
                            <th class='text-right p-2 text-sm font-medium text-gray-700'>Total Bs.</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    const detalles = nomina.detalles || [];
    if (detalles.length === 0) {
        html += '<tr><td colspan="6" class="text-center p-4 text-gray-400">Sin detalles</td></tr>';
    } else {
        detalles.forEach((d) => {
            const nombre = d.empleado ? `${d.empleado.nombre} ${d.empleado.apellido}` : `Empleado #${d.empleado_id}`;
            html += `
                <tr class='border-b border-gray-100 hover:bg-gray-50'>
                    <td class='p-2 text-sm'>${nombre}</td>
                    <td class='p-2 text-sm text-right'>$${fmt(d.salario_base)}</td>
                    <td class='p-2 text-sm text-right text-green-600'>$${fmt(d.bono)}</td>
                    <td class='p-2 text-sm text-right text-red-500'>$${fmt(d.deduccion)}</td>
                    <td class='p-2 text-sm text-right font-medium'>$${fmt(d.monto_usd)}</td>
                    <td class='p-2 text-sm text-right text-gray-500'>${fmt(d.monto_total)} Bs.</td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    body.innerHTML = html;
    modal.classList.remove('hidden');
    modal.removeAttribute('inert');
    setupModalLifecycle(modal);
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('form-generar-nomina');
    const tbody = document.getElementById('table-nomina');
    const template = document.getElementById('fila-nomina');

    async function renderNominas(nominas) {
        await renderSummary(nominas);
        tbody.innerHTML = '';
        if (!nominas || nominas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-3 text-gray-500">No hay nóminas registradas</td></tr>';
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
                } else if (key === 'estado') {
                    const badge = document.createElement('span');
                    const colores = { completed: 'bg-green-500', processing: 'bg-yellow-500', failed: 'bg-red-500' };
                    badge.className = `px-2 py-1 text-xs text-white rounded-full ${colores[nom.estado] || 'bg-gray-400'}`;
                    badge.textContent = nom.estado === 'completed' ? 'Completado' : nom.estado === 'processing' ? 'Procesando' : 'Fallido';
                    cell.appendChild(badge);
                } else if (key === 'usuario') {
                    cell.textContent = nom.usuario?.username || '-';
                }
            });
            const viewBtn = row.querySelector('[data-btn="view"]');
            if (viewBtn) {
                viewBtn.dataset.idModel = nom.id;
                viewBtn.addEventListener('click', async () => {
                    try {
                        const resp = await httpClient.get(`/nomina/${nom.id}`);
                        const detalle = resp?.data || resp;
                        renderDetailsModal(detalle);
                    } catch (err) {
                        showToast({ title: 'Error', message: 'No se pudo cargar el detalle', type: 'error', duration: 5000 });
                    }
                });
            }
            tbody.appendChild(row);
        });
    }

    async function loadNominas() {
        try {
            const response = await httpClient.get('/nomina');
            renderNominas(response.data);
        } catch (err) {
            console.error('Error cargando nóminas:', err);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-3 text-red-500">Error al cargar nóminas</td></tr>';
        }
    }

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
