import { models } from '../models/index.js';

function getDaysPerPeriod(frecuencia) {
    const map = { mensual: 30, quincenal: 15, semanal: 7 };
    return map[frecuencia] ?? 30;
}

export function generarPeriodos(empleado) {
    const { fecha_ingreso, frecuencia_pago, salario_base } = empleado;
    if (!fecha_ingreso) return [];

    const inicio = new Date(fecha_ingreso);
    const hoy = new Date();
    const diasPeriodo = getDaysPerPeriod(frecuencia_pago);
const periodosPorMes = { mensual: 1, quincenal: 2, semanal: 4 };
const montoPorPeriodo = Number(salario_base || 0) / (periodosPorMes[frecuencia_pago] || 1);

    const periodos = [];
    let currentStart = new Date(inicio);

    while (currentStart <= hoy) {
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + diasPeriodo - 1);

        periodos.push({
            fecha_inicio: new Date(currentStart).toISOString().split('T')[0],
            fecha_fin: currentEnd.toISOString().split('T')[0],
            monto_esperado: Math.round(montoPorPeriodo * 100) / 100,
            pagado: false,
        });

        currentStart.setDate(currentStart.getDate() + diasPeriodo);
    }

    return periodos;
}

export function marcarPeriodosPagados(periodos, nominas) {
    return periodos.map((p) => {
        const pago = nominas.find((n) => {
            const ni = new Date(n.fecha_inicio).getTime();
            const nf = new Date(n.fecha_fin).getTime();
            const pi = new Date(p.fecha_inicio).getTime();
            const pf = new Date(p.fecha_fin).getTime();
            return pi >= ni && pf <= nf;
        });

        return {
            ...p,
            pagado: !!pago,
            monto_pagado: pago ? Number(pago.monto_usd || pago.monto || 0) : 0,
            monto_pagado_bs: pago ? Number(pago.monto || 0) : 0,
            bono: pago ? Number(pago.bono || 0) : 0,
            deduccion: pago ? Number(pago.deduccion || 0) : 0,
            nomina_id: pago ? pago.id : null,
        };
    });
}

export async function computeDeuda(empleadoId) {
    const empleado = await models.Empleado.findByPk(empleadoId);
    if (!empleado) return null;

    const empJson = empleado.toJSON();
    const nominas = await models.NominaEmpleado.findAll({
        where: { empleado_id: empleadoId },
        order: [['fecha_inicio', 'ASC']],
    });

    const periodos = generarPeriodos(empJson);
    const periodosConPago = marcarPeriodosPagados(periodos, nominas.map((n) => n.toJSON()));

    const totalEsperado = periodosConPago.reduce((s, p) => s + p.monto_esperado, 0);
    const totalPagado = periodosConPago.reduce((s, p) => s + (p.pagado ? p.monto_pagado : 0), 0);
    const totalPagadoBs = periodosConPago.reduce((s, p) => s + (p.pagado ? p.monto_pagado_bs : 0), 0);
    const totalBono = periodosConPago.reduce((s, p) => s + p.bono, 0);
    const totalDeduccion = periodosConPago.reduce((s, p) => s + p.deduccion, 0);

    const hoy = new Date();
    const vencidos = periodosConPago.filter((p) => !p.pagado && new Date(p.fecha_fin) < hoy);
    const alDia = periodosConPago.filter((p) => p.pagado);
    const ultimoPago = alDia.length > 0 ? alDia[alDia.length - 1] : null;

    const daysSinceLastPay = ultimoPago
        ? Math.floor((hoy - new Date(ultimoPago.fecha_fin)) / (1000 * 60 * 60 * 24))
        : null;

    const prox = periodosConPago.find((p) => !p.pagado && new Date(p.fecha_fin) >= hoy)
        || periodosConPago.find((p) => !p.pagado);

    return {
        empleado_id: empleadoId,
        frecuencia: empJson.frecuencia_pago,
        salario_base: Number(empJson.salario_base || 0),
        periodos: periodosConPago,
        total_esperado: Math.round(totalEsperado * 100) / 100,
        total_pagado: Math.round(totalPagado * 100) / 100,
        total_pagado_bs: Math.round(totalPagadoBs * 100) / 100,
        total_bono: Math.round(totalBono * 100) / 100,
        total_deduccion: Math.round(totalDeduccion * 100) / 100,
        deuda: Math.round((totalEsperado - totalPagado) * 100) / 100,
        periodos_vencidos: vencidos.length,
        periodos_pagados: alDia.length,
        proximo_pago: prox ? { fecha_fin: prox.fecha_fin, monto: prox.monto_esperado } : null,
        ultimo_pago: ultimoPago
            ? { fecha_fin: ultimoPago.fecha_fin, monto: ultimoPago.monto_pagado }
            : null,
        dias_sin_pago: daysSinceLastPay,
    };
}
