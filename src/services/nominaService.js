import { models, sequelize } from '../models/index.js';
import logger from '../config/logger.js';

export async function calcularYGenerarNomina({ periodoInicio, periodoFin, empresaId, usuarioId, io }) {
    const t = await sequelize.transaction();

    try {
        const tasa = await models.TasaDolar.findOne({
            where: { activa: true },
            order: [['id', 'DESC']],
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!tasa) throw new Error('No hay tasa de cambio activa');

        const existente = await models.Nomina.findOne({
            where: {
                periodo_inicio: periodoInicio,
                periodo_fin: periodoFin,
                empresa_id: empresaId,
            },
            transaction: t,
        });
        if (existente && existente.estado !== 'failed') {
            await t.rollback();
            return { skipped: true, nomina: existente };
        }

        const nomina = await models.Nomina.create(
            {
                empresa_id: empresaId,
                usuario_id: usuarioId,
                tasa_id: tasa.id,
                periodo_inicio: periodoInicio,
                periodo_fin: periodoFin,
                estado: 'processing',
            },
            { transaction: t },
        );

        const empleados = await models.Empleado.findAll({
            where: { activo: true, empresa_id: empresaId },
            transaction: t,
        });

        const periodoInicioDate = new Date(periodoInicio);
        const periodoFinDate = new Date(periodoFin);
        const diffDays = Math.ceil((periodoFinDate - periodoInicioDate) / (1000 * 60 * 60 * 24)) + 1;

        const tasaNum = parseFloat(tasa.tasa) || 1;
        const detalles = empleados.map((emp) => {
            const salarioBase = parseFloat(emp.salario_base || 0);
            const freq = emp.frecuencia_pago || 'mensual';
            const periodosPorMes = { mensual: 1, quincenal: 2, semanal: 4 };
            const montoPorPeriodo = Math.round((salarioBase / (periodosPorMes[freq] || 1)) * 100) / 100;
            const montoUsd = Math.round((montoPorPeriodo / 30) * diffDays * 100) / 100;
            const montoBs = Math.round(montoUsd * tasaNum * 100) / 100;
            return {
                nomina_id: nomina.id,
                empleado_id: emp.id,
                salario_base: salarioBase,
                bono: 0,
                deduccion: 0,
                monto_total: montoBs,
                monto_usd: montoUsd,
            };
        });

        await models.NominaDetalle.bulkCreate(detalles, { transaction: t });

        const totalMonto = detalles.reduce((sum, d) => sum + d.monto_total, 0);
        await nomina.update(
            {
                total_empleados: empleados.length,
                total_monto: totalMonto,
                estado: 'completed',
            },
            { transaction: t },
        );

        await t.commit();

        if (io) {
            io.to(`notifs_user_${usuarioId}`).emit('nomina_generada', {
                nomina_id: nomina.id,
                estado: 'completed',
                total_empleados: empleados.length,
                total_monto: totalMonto,
                tasa: tasa.tasa,
                periodo_inicio: periodoInicio,
                periodo_fin: periodoFin,
            });
        }

        logger.info(`[Nomina] Batch ${nomina.id} completado: ${empleados.length} empleados, total ${totalMonto}`);

        return { success: true, nomina };
    } catch (error) {
        await t.rollback();
        logger.error(`[Nomina] Error generando nómina: ${error.message}`);
        throw error;
    }
}
