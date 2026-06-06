import { Format } from '../helpers/Format.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import { httpClient } from '../index.js';

function fmt(val) {
    const n = Number(val) || 0;
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseLocaleNum(str) {
    if (!str) return NaN;
    return Number(String(str).replace(/\./g, '').replace(',', '.')) || 0;
}

function fmtDisplay(val) {
    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(val) || 0);
}

function computeRetrasado(nomina) {
    if (!nomina.fecha_fin) return false;
    const fin = new Date(nomina.fecha_fin);
    const creado = new Date(nomina.creado_en);
    return creado > fin;
}

function renderPendingPeriods(periodos) {
    const container = document.getElementById('pending-periods-container');
    if (!container) return;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencidos = periodos.filter((p) => {
        if (p.pagado) return false;
        return new Date(p.fecha_fin) < hoy;
    });
    if (vencidos.length === 0) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    const list = container.querySelector('.pending-list');
    list.innerHTML = '';
    vencidos.forEach((p) => {
        const el = document.createElement('div');
        el.className = 'flex items-center justify-between p-2 rounded-lg border border-red-200 bg-red-50';
        el.innerHTML = `
            <div>
                <p class='text-sm font-medium'>${new Date(p.fecha_inicio).toLocaleDateString('es-VE')} - ${new Date(p.fecha_fin).toLocaleDateString('es-VE')}</p>
                <p class='text-xs text-gray-600'>Esperado: $${fmt(p.monto_esperado)}</p>
            </div>
            <div class='text-right'>
                <p class='text-sm font-semibold text-red-600'>$${fmt(p.monto_esperado)}</p>
                <p class='text-xs text-red-500'>Vencido</p>
            </div>
        `;
        list.appendChild(el);
    });
}

function autoFillFifoPeriod(periodos) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencidos = periodos.filter((p) => {
        if (p.pagado) return false;
        return new Date(p.fecha_fin) < hoy;
    });
    if (vencidos.length === 0) return;
    const first = vencidos[0];
    const inicioInput = document.getElementById('fecha_inicio_payment_method_create');
    const finInput = document.getElementById('fecha_fin_payment_method_create');
    if (inicioInput) inicioInput.value = first.fecha_inicio;
    if (finInput) finInput.value = first.fecha_fin;
}

document.addEventListener('DOMContentLoaded', async () => {
    const locationPage = location.href;
    const id = locationPage.split('/').pop();

    const [employeResp, deudaResp] = await Promise.all([
        httpClient.get(`/employe/${id}`),
        httpClient.get(`/employe/deuda/${id}`),
    ]);

    const { data: employe } = employeResp;
    const deuda = deudaResp?.data || deudaResp;

    if (deuda) {
        document.getElementById('total-expected').textContent = `$${fmt(deuda.total_esperado)}`;
        document.getElementById('total-paid').textContent = `$${fmt(deuda.total_pagado)}`;
        document.getElementById('debt-estimated').textContent = `$${fmt(deuda.deuda)}`;
        document.getElementById('days-without-pay').textContent = deuda.dias_sin_pago !== null
            ? `${deuda.dias_sin_pago} días`
            : '—';
        if (deuda.proximo_pago) {
            const fecha = new Date(deuda.proximo_pago.fecha_fin).toLocaleDateString('es-VE');
            document.getElementById('next-payment-date').textContent = fecha;
            document.getElementById('next-payment-amount').textContent = `$${fmt(deuda.proximo_pago.monto)}`;
        }
        renderPendingPeriods(deuda.periodos || []);
        autoFillFifoPeriod(deuda.periodos || []);
        if (deuda.total_pagado_bs > 0) {
            const paidBs = document.getElementById('total-paid-bs');
            paidBs.textContent = `≈ ${fmt(deuda.total_pagado_bs)} Bs.`;
            paidBs.classList.remove('hidden');
        }
        try {
            const { tasa: tasaActual } = await httpClient.get('/exchange-rate/actual').then((r) => r.data);
            const t = Number(tasaActual) || 0;
            if (t > 0) {
                const expBs = document.getElementById('total-expected-bs');
                expBs.textContent = `≈ ${fmt(deuda.total_esperado * t)} Bs.`;
                expBs.classList.remove('hidden');
                const debtBs = document.getElementById('debt-estimated-bs');
                debtBs.textContent = `≈ ${fmt(deuda.deuda * t)} Bs.`;
                debtBs.classList.remove('hidden');
            }
        } catch { /* rate unavailable */ }
    }

    const nominasEnriched = (employe.nominas || []).map((n) => ({
        ...n,
        retrasado: computeRetrasado(n),
    }));

    setupFilteredTable({
        data: nominasEnriched,
        filterInputs: {
            searchStartPeriod: document.getElementById('searchStartPeriod'),
            searchEndPeriod: document.getElementById('searchEndPeriod'),
        },
        filterFn: (nomina, inputs) => {
            const { searchStartPeriod, searchEndPeriod } = inputs;

            const fechaInicio = new Date(nomina.fecha_inicio);
            const fechaFin = new Date(nomina.fecha_fin);

            const valueStartPeriod = searchStartPeriod.value.trim();
            const valueEndPeriod = searchEndPeriod.value.trim();

            const filtroFechaInicio = valueStartPeriod === '' || fechaInicio >= new Date(valueStartPeriod);

            const filtroFechaFin = valueEndPeriod === '' || fechaFin <= new Date(valueEndPeriod);
            console.log(filtroFechaInicio, filtroFechaFin);
            return filtroFechaInicio && filtroFechaFin;
        },

        fillTableOptions: {
            templateId: 'fila-ejemplo-nomina',
            tableSelector: '#table-employee-nomina',
            actions: {
                editar: (e) => {
                    editNomina(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                fecha: (dato) => `${dato.fecha_inicio} - ${dato.fecha_fin}`,
                tasa: (dato) => dato.tasa?.tasa ? `${Format.float(dato.tasa.tasa)} Bs.` : '—',
                monto: (dato) => {
                    if (dato.monto_usd) {
                        return `$${fmt(dato.monto_usd)}`;
                    }
                    const monto = parseLocaleNum(dato.monto);
                    const tasa = dato.tasa?.tasa ? parseLocaleNum(dato.tasa.tasa) : NaN;
                    if (!isNaN(tasa) && tasa > 0) {
                        return `$${fmtDisplay(monto / tasa)}`;
                    }
                    return '$—';
                },
                date: (dato) => {
                    const dateCreate = new Date(dato.creado_en);
                    return dateCreate.toLocaleDateString('es-AR');
                },
                periodo: (dato) => {
                    const formatter = new Intl.DateTimeFormat('es-VE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                    });

                    const desde = formatter.format(new Date(dato.fecha_inicio));
                    const hasta = formatter.format(new Date(dato.fecha_fin));

                    return `${desde} - ${hasta}`;
                },
                monto_usd: (dato) => `${Format.float(dato.monto)} Bs.`,
                status: (dato) => {
                    if (dato.retrasado) {
                        return `<span class='px-2 py-0.5 text-xs text-white rounded-full bg-red-500'>Con retraso</span>`;
                    }
                    return `<span class='px-2 py-0.5 text-xs text-white rounded-full bg-green-500'>A tiempo</span>`;
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-iva .btn-paginar:nth-child(1)'),
            next: document.querySelector('#paginador-tabla-iva .btn-paginar:nth-child(2)'),
        },
        itemsPerPage: 4,
    });
});
document.getElementById('btnAddPayroll').addEventListener('click', async () => {
    const modalCreateEmployeePayroll = document.getElementById('modal-create-employee-payroll');
    if (!modalCreateEmployeePayroll) {
        console.error('Modal element not found');
        return;
    }
    setupModalLifecycle(modalCreateEmployeePayroll);
});

document.addEventListener('DOMContentLoaded', async () => {
    const [{ tasa }] = await Promise.all([httpClient.get('/exchange-rate/actual').then((response) => response.data)]);

    const inputUSD = document.getElementById('monto_payment_method_create_usd');
    const inputBS = document.getElementById('monto_payment_method_create');

    inputUSD.addEventListener('input', () => {
        const valorUSD = parseLocaleNum(inputUSD.value);
        const usdtobs = valorUSD * Number(tasa);
        inputBS.value = fmtDisplay(usdtobs);
    });
    inputBS.addEventListener('input', () => {
        const valorBS = parseLocaleNum(inputBS.value);
        const bstousd = valorBS / Number(tasa);
        inputUSD.value = fmtDisplay(bstousd);
    });
});
