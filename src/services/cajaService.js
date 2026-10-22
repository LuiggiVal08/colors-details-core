import { BadRequestError } from '../errors/BadRequestError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { formatearPrecio } from '../helpers/format.js';
import { models } from '../models/index.js';
import { getMoneda, normalizarCodigoMoneda } from './monedaService.js';

/**
 * Obtiene el control de caja abierto del usuario.
 */
const obtenerCajaActivaPorUsuario = async (usuario_id, transaction) => {
    const controles = await models.ControlCaja.findAll({
        where: {
            usuario_id,
            fecha_cierre: null,
            estado: 'abierto',
        },
        include: [{ model: models.Caja, as: 'caja', where: { tipo: 'fisica' } }],
        lock: transaction?.LOCK?.UPDATE,
        transaction,
        order: [['id', 'ASC']],
    });

    if (controles.length === 0) throw new NotFoundError('El usuario no tiene una caja física abierta');
    if (controles.length > 1) {
        throw new BadRequestError(
            'El usuario tiene más de una caja física abierta. Cierre las cajas adicionales antes de registrar movimientos.',
        );
    }

    return { control: controles[0], caja: controles[0].caja };
};

const obtenerCajaDigitalPorUsuario = async (usuario_id, transaction) => {
    const usuario = await models.Usuario.findByPk(usuario_id, {
        include: [{ model: models.Empleado, as: 'empleado', attributes: ['empresa_id'] }],
        transaction,
    });
    const empresaId = usuario?.empleado?.empresa_id;
    if (!empresaId) throw new BadRequestError('El usuario no tiene una empresa asociada');

    const caja = await models.Caja.findOne({
        where: { empresa_id: empresaId, tipo: 'digital', activo: true },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction?.LOCK?.UPDATE,
    });
    if (!caja) throw new BadRequestError('No existe una caja digital activa para registrar el pago');
    return caja;
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
 * @param {number|string} [params.caja_id] Caja física o cuenta digital destino.
 * @param {'efectivo'|'digital'} [params.medio_pago] Fuente del movimiento.
 * @param {number|string} [params.metodo_pago_id] Método de pago usado.
 * @param {string} [params.referencia] Referencia de la operación digital.
 * @param {string} [params.cuenta_receptora] Cuenta que recibió el dinero.
 * @param {Object} [params.transaction]
 */
async function realizarMovimiento({
    usuario_id,
    monto,
    descripcion,
    tipo,
    moneda = 'VES',
    tasa = null,
    caja_id = null,
    medio_pago = null,
    metodo_pago_id = null,
    referencia = null,
    cuenta_receptora = null,
    transaction,
}) {
    const t = transaction || (await models.sequelize.transaction());

    try {
        let control = null;
        let caja;
        if (caja_id) {
            caja = await models.Caja.findByPk(caja_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!caja) throw new NotFoundError('Caja no encontrada');
            if (caja.tipo === 'fisica') {
                const cajaActiva = await obtenerCajaActivaPorUsuario(usuario_id, t);
                if (cajaActiva.caja.id !== caja.id) {
                    throw new BadRequestError('La caja indicada no es la caja física abierta por el usuario');
                }
                ({ control, caja } = cajaActiva);
            }
        } else {
            ({ control, caja } = await obtenerCajaActivaPorUsuario(usuario_id, t));
        }

        const codigo = normalizarCodigoMoneda(moneda);
        const monedaDoc = await getMoneda(codigo, t);
        if (!monedaDoc) throw new BadRequestError(`Moneda no registrada: ${codigo}`);

        const campoSaldo = codigo === 'USD' ? 'monto_usd' : 'monto';
        const saldoActual = formatearPrecio(caja[campoSaldo] ?? 0);
        const montoMovimiento = formatearPrecio(monto);
        const metodo = metodo_pago_id
            ? await models.MetodoPago.findByPk(metodo_pago_id, { transaction: t })
            : null;
        const medioPago = medio_pago || (metodo && String(metodo.tipo).toLowerCase() === 'efectivo'
            ? 'efectivo'
            : caja.tipo === 'digital' || metodo
                ? 'digital'
                : 'efectivo');

        if (medioPago === 'efectivo' && caja.tipo !== 'fisica') {
            throw new BadRequestError('Los movimientos en efectivo deben registrarse en una caja física');
        }
        if (medioPago === 'digital' && tipo === 'ingreso' && !referencia) {
            throw new BadRequestError('La referencia es obligatoria para ingresos digitales');
        }

        if (tipo === 'egreso' && montoMovimiento > saldoActual) {
            throw new BadRequestError(
                `Fondos insuficientes en caja (${codigo}): disponible ${saldoActual.toFixed(2)}`,
            );
        }

        const mov = await models.MovimientoCaja.create(
            {
                control_caja_id: control?.id || null,
                caja_id: caja.id,
                usuario_id,
                monto: montoMovimiento.toFixed(2),
                moneda_id: monedaDoc.id,
                tasa: tasa != null && tasa !== '' ? Number(tasa) : null,
                tipo,
                medio_pago: medioPago,
                metodo_pago_id: metodo_pago_id || null,
                referencia: referencia || null,
                cuenta_receptora: cuenta_receptora || caja.cuenta_receptora || null,
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

export default { realizarMovimiento, obtenerCajaActivaPorUsuario, obtenerCajaDigitalPorUsuario };
