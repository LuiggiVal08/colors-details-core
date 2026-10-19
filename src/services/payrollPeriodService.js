import { models } from '../models/index.js';

const DIAS_POR_PERIODO = { mensual: 30, quincenal: 15, semanal: 7 };
const PERIODOS_POR_MES = { mensual: 1, quincenal: 2, semanal: 4 };

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Parsea números en formato es-VE ("1.234,56"), números planos ("1234.56")
// y valores ya numéricos. Devuelve 0 si el valor no es válido.
export function parseMonto(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined) return 0;

    const str = String(value).trim();
    if (str === '') return 0;
    if (/^-?\d+(\.\d+)?$/.test(str)) return Number(str);

    const num = Number(str.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
}

function getDaysPerPeriod(frecuencia) {
    return DIAS_POR_PERIODO[frecuencia] ?? 30;
}

function getPeriodosPorMes(frecuencia) {
    return PERIODOS_POR_MES[frecuencia] ?? 1;
}

export function generarPeriodos(empleado) {
    const { fecha_ingreso, frecuencia_pago } = empleado;
    if (!fecha_ingreso) return [];

    const salarioBase = parseMonto(empleado.salario_base);
    const inicio = new Date(fecha_ingreso);
    if (Number.isNaN(inicio.getTime())) return [];

    const hoy = new Date();
    const diasPeriodo = getDaysPerPeriod(frecuencia_pago);
    const montoPorPeriodo = salarioBase / getPeriodosPorMes(frecuencia_pago);

    const periodos = [];
    let currentStart = new Date(inicio);

    while (currentStart <= hoy) {
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + diasPeriodo - 1);

        periodos.push({
            fecha_inicio: new Date(currentStart).toISOString().split('T')[0],
            fecha_fin: currentEnd.toISOString().split('T')[0],
            monto_esperado: round2(montoPorPeriodo),
            pagado: false,
        });

        currentStart.setDate(currentStart.getDate() + diasPeriodo);
    }

    return periodos;
}

/**
 * Reparte cada pago de nómina (USD) entre los períodos impagos que solapan
 * con su rango de fechas, en orden cronológico (FIFO). Un pago parcial deja
 * el período con saldo pendiente en vez de marcarlo como no pagado.
 */
export function marcarPeriodosPagados(periodos, nominas) {
    const acumulados = periodos.map((p) => ({
        ...p,
        monto_esperado: round2(p.monto_esperado),
        monto_pagado: 0,
        monto_pagado_bs: 0,
        bono: 0,
        deduccion: 0,
        nomina_ids: [],
    }));

    const ordenadas = [...nominas].sort(
        (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    );

    for (const nomina of ordenadas) {
        const ni = new Date(nomina.fecha_inicio);
        const nf = new Date(nomina.fecha_fin);
        if (Number.isNaN(ni.getTime()) || Number.isNaN(nf.getTime())) continue;

        const tasa = parseMonto(nomina.tasa?.tasa ?? nomina.tasa_num ?? 0);
        const montoBs = parseMonto(nomina.monto);
        const montoUsd =
            nomina.monto_usd !== null && nomina.monto_usd !== undefined && nomina.monto_usd !== ''
                ? parseMonto(nomina.monto_usd)
                : tasa > 0
                ? round2(montoBs / tasa)
                : 0;

        let restanteUsd = Math.max(0, montoUsd);

        const candidatos = acumulados
            .filter((p) => {
                if (p.pagado) return false;
                const pi = new Date(p.fecha_inicio);
                const pf = new Date(p.fecha_fin);
                return pi <= nf && pf >= ni;
            })
            .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

        let primeraAplicacion = null;

        for (const periodo of candidatos) {
            if (restanteUsd <= 0.009) break;

            const saldo = Math.max(0, round2(periodo.monto_esperado - periodo.monto_pagado));
            if (saldo <= 0.009) continue;

            const aplicado = Math.min(saldo, restanteUsd);
            periodo.monto_pagado = round2(periodo.monto_pagado + aplicado);
            periodo.monto_pagado_bs = round2(
                periodo.monto_pagado_bs + (tasa > 0 ? aplicado * tasa : 0),
            );
            periodo.nomina_ids.push(nomina.id);

            if (!primeraAplicacion) primeraAplicacion = periodo;
            restanteUsd = round2(restanteUsd - aplicado);
        }

        // Bono/deducción se atribuyen una sola vez (no por cada período alcanzado).
        if (primeraAplicacion) {
            primeraAplicacion.bono = round2(primeraAplicacion.bono + parseMonto(nomina.bono));
            primeraAplicacion.deduccion = round2(
                primeraAplicacion.deduccion + parseMonto(nomina.deduccion),
            );
        }
    }

    return acumulados.map((p) => {
        const saldo = Math.max(0, round2(p.monto_esperado - p.monto_pagado));
        return {
            ...p,
            saldo,
            pagado: saldo <= 0.009,
            nomina_id: p.nomina_ids.length ? p.nomina_ids[p.nomina_ids.length - 1] : null,
        };
    });
}

export async function computeDeuda(empleadoId) {
    const empleado = await models.Empleado.findByPk(empleadoId);
    if (!empleado) return null;

    const empJson = empleado.toJSON();
    const nominas = await models.NominaEmpleado.findAll({
        where: { empleado_id: empleadoId },
        include: [{ model: models.TasaDolar, as: 'tasa' }],
        order: [['fecha_inicio', 'ASC']],
    });

    const nominasJson = nominas.map((n) => n.toJSON());
    const periodos = generarPeriodos(empJson);
    const periodosConPago = marcarPeriodosPagados(periodos, nominasJson);

    const totalEsperado = round2(
        periodosConPago.reduce((sum, p) => sum + p.monto_esperado, 0),
    );
    const totalPagado = round2(
        periodosConPago.reduce((sum, p) => sum + p.monto_pagado, 0),
    );
    const totalPagadoBs = round2(
        periodosConPago.reduce((sum, p) => sum + p.monto_pagado_bs, 0),
    );
    const totalBono = round2(periodosConPago.reduce((sum, p) => sum + p.bono, 0));
    const totalDeduccion = round2(periodosConPago.reduce((sum, p) => sum + p.deduccion, 0));
    const deuda = round2(periodosConPago.reduce((sum, p) => sum + p.saldo, 0));

    const hoy = new Date();
    const vencidos = periodosConPago.filter(
        (p) => !p.pagado && new Date(p.fecha_fin) < hoy,
    );
    const pagados = periodosConPago.filter((p) => p.pagado);

    const ultimaNomina = nominasJson.length ? nominasJson[nominasJson.length - 1] : null;
    const ultimoPago = ultimaNomina
        ? { fecha_fin: ultimaNomina.fecha_fin, monto: parseMonto(ultimaNomina.monto_usd) }
        : null;

    const daysSinceLastPay = ultimaNomina?.fecha_fin
        ? Math.floor((hoy - new Date(ultimaNomina.fecha_fin)) / (1000 * 60 * 60 * 24))
        : null;

    const prox =
        periodosConPago.find((p) => !p.pagado && new Date(p.fecha_fin) >= hoy) ||
        periodosConPago.find((p) => !p.pagado);

    return {
        empleado_id: empleadoId,
        frecuencia: empJson.frecuencia_pago,
        salario_base: parseMonto(empJson.salario_base),
        periodos: periodosConPago,
        total_esperado: totalEsperado,
        total_pagado: totalPagado,
        total_pagado_bs: totalPagadoBs,
        total_bono: totalBono,
        total_deduccion: totalDeduccion,
        deuda,
        periodos_vencidos: vencidos.length,
        periodos_pagados: pagados.length,
        proximo_pago: prox ? { fecha_fin: prox.fecha_fin, monto: prox.saldo } : null,
        ultimo_pago: ultimoPago,
        dias_sin_pago: daysSinceLastPay,
    };
}
