import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { formatearPrecio } from '../helpers/format.js';
import { models } from '../models/index.js';
import { getMoneda, normalizarCodigoMoneda } from './monedaService.js';

/**
 * Obtiene el control de caja abierto del usuario.
 */
const obtenerCajaActivaPorUsuario = async (usuario_id, transaction) => {
    const control = await models.ControlCaja.findOne({
        where: {
            usuario_id,
            fecha_cierre: null,
            estado: 'abierto',
        },
        include: [{ model: models.Caja, as: 'caja' }],
        lock: transaction?.LOCK?.UPDATE,
        transaction,
    });

    if (!control) throw new NotFoundError('El usuario no tiene una caja abierta');

    return { control, caja: control.caja };
};

/**
 * Realiza un movimiento en una caja.
 * @param {Object} params
 * @param {number} params.usuario_id
 * @param {number|string} params.monto Monto en la moneda indicada.
 * @param {string} params.descripcion
 * @param {'ingreso'|'egreso'} params.tipo
 * @param {'USD'|'VES'} [params.moneda] Moneda del movimiento (VES por compatibilidad).
 * @param {number|string} [params.tasa] Tasa usada para convertir a la otra moneda.
 * @param {Object} [params.transaction]
 */
async function realizarMovimiento({
    usuario_id,
    monto,
    descripcion,
    tipo,
    moneda = 'VES',
    tasa = null,
    transaction,
}) {
    const t = transaction || (await models.sequelize.transaction());

    try {
        const { control, caja } = await obtenerCajaActivaPorUsuario(usuario_id, t);

        const codigo = normalizarCodigoMoneda(moneda);
        const monedaDoc = await getMoneda(codigo, t);
        if (!monedaDoc) throw new BadRequestError(`Moneda no registrada: ${codigo}`);

        const campoSaldo = codigo === 'USD' ? 'monto_usd' : 'monto';
        const saldoActual = formatearPrecio(caja[campoSaldo] ?? 0);
        const montoMovimiento = formatearPrecio(monto);

        if (tipo === 'egreso' && montoMovimiento > saldoActual) {
            throw new BadRequestError(
                `Fondos insuficientes en caja (${codigo}): disponible ${saldoActual.toFixed(2)}`,
            );
        }

        const mov = await models.MovimientoCaja.create(
            {
                control_caja_id: control.id,
                usuario_id,
                monto: montoMovimiento.toFixed(2),
                moneda_id: monedaDoc.id,
                tasa: tasa != null && tasa !== '' ? Number(tasa) : null,
                tipo,
                descripcion: descripcion || '',
                fecha: new Date(),
            },
            { transaction: t },
        );

        const nuevoSaldo =
            tipo === 'ingreso' ? saldoActual + montoMovimiento : saldoActual - montoMovimiento;

        await caja.update(
            {
                [campoSaldo]: nuevoSaldo.toFixed(2),
            },
            { transaction: t },
        );

        if (!transaction) await t.commit();

        return mov;
    } catch (err) {
        if (!transaction) await t.rollback();
        throw err;
    }
}

export default { realizarMovimiento, obtenerCajaActivaPorUsuario };
