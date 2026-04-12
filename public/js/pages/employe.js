import { Format } from '../helpers/Format.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import { httpClient } from '../index.js';

document.addEventListener('DOMContentLoaded', async () => {
    const locationPage = location.href;
    const id = locationPage.split('/').pop();
    const response = await httpClient.get(`/employe/${id}`);
    const { data: employe } = response;

    setupFilteredTable({
        data: employe.nominas,
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
                tasa: (dato) => `${Format.float(dato.tasa.tasa)} Bs.`,
                monto: (dato) => `${Format.float(dato.monto)} Bs.`,
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
                monto_usd: (dato) => {
                    console.log('dato monto sin formato', dato.monto);
                    console.log('dato tasa sin formato', dato.tasa.tasa);

                    const monto = parseFloat(dato.monto.toString().replace(/\./g, '').replace(',', '.'));
                    const tasa = parseFloat(dato.tasa.tasa.toString().replace(/\./g, '').replace(',', '.'));

                    const monto_usd = monto / tasa;

                    console.log('monto', monto);
                    console.log('tasa', tasa);
                    console.log('monto_usd', monto_usd);

                    return `$${monto_usd.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`;
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
        const valorUSD = Number(inputUSD.value.replace(/\./g, '').replace(',', '.')) || 0;
        const usdtobs = valorUSD * Number(tasa);
        inputBS.value = Format.float(usdtobs.toFixed(2));
    });
    inputBS.addEventListener('input', () => {
        const valorBS = Number(inputBS.value.replace(/\./g, '').replace(',', '.')) || 0;
        const bstousd = valorBS / Number(tasa);

        inputUSD.value = Format.float(bstousd.toFixed(2));
    });
});
