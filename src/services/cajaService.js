import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { formatearPrecio } from '../helpers/format.js';
import { models } from '../models/index.js';

/**
 * Realiza un movimiento en una caja.
 * @param {Object} params - Parámetros para el movimiento.
 * @param {number} params.caja_id - ID de la caja.
 * @param {number} params.monto - Monto del movimiento.
 * @param {string} params.descripcion - Descripción del movimiento.
 * @param {string} params.tipo - Tipo del movimiento (ingreso o egreso).
 * @param {number} params.usuario_id - ID del usuario que realiza el movimiento.
 * @param {Object} transaction - Transacción a utilizar.
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

async function realizarMovimiento({ usuario_id, monto, descripcion, tipo, transaction }) {
    const t = transaction || (await models.sequelize.transaction());

    try {
        const { control, caja } = await obtenerCajaActivaPorUsuario(usuario_id, t);

        const parseNum = (v) => {
            const s = String(v || '0');
            if (/^-?\d+(\.\d{1,2})?$/.test(s)) return Number(s);
            return Number(s.replace(/\./g, '').replace(',', '.'));
        };
        const montoBox = parseNum(caja.monto);
        const montoMovement = parseNum(monto);

        if (tipo === 'egreso' && montoMovement > montoBox) throw new BadRequestError('Fondos insuficientes en caja');

        const mov = await models.MovimientoCaja.create(
            {
                control_caja_id: control.id,
                usuario_id,
                monto: montoMovement.toFixed(2),
                tipo,
                descripcion: descripcion || '',
                fecha: new Date(),
            },
            { transaction: t },
        );

        const newBoxAmount = tipo === 'ingreso' ? montoBox + montoMovement : montoBox - montoMovement;

        await caja.update(
            {
                monto: newBoxAmount.toFixed(2).replace('.', ','),
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
