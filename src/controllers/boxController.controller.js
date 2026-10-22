import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { formatearPrecio } from '../helpers/format.js';

class ControlCajaController {
    static async obtenerResumenControl(controlId) {
        const movimientos = await models.MovimientoCaja.findAll({
            where: { control_caja_id: controlId },
            include: [
                { model: models.Moneda, as: 'moneda', attributes: ['codigo'] },
                { model: models.MetodoPago, as: 'metodoPago', attributes: ['tipo'] },
            ],
            attributes: ['tipo', 'medio_pago', 'metodo_pago_id', 'monto', 'descripcion'],
        });
        const resumen = {
            ingresos: {
                efectivo: { VES: 0, USD: 0 },
                digital: { VES: 0, USD: 0 },
                otros: { VES: 0, USD: 0 },
            },
            egresos: {
                efectivo: { VES: 0, USD: 0 },
                digital: { VES: 0, USD: 0 },
                otros: { VES: 0, USD: 0 },
            },
            vueltos: { VES: 0, USD: 0 },
        };
        movimientos.forEach((movimiento) => {
            const moneda = movimiento.moneda?.codigo === 'USD' ? 'USD' : 'VES';
            const tipoMetodo = String(movimiento.metodoPago?.tipo || '').toLowerCase();
            const medio = movimiento.medio_pago === 'efectivo'
                ? 'efectivo'
                : ['otro', 'otros'].includes(tipoMetodo) || tipoMetodo.includes('cripto')
                    ? 'otros'
                    : 'digital';
            const monto = Number(movimiento.monto || 0);
            const grupo = movimiento.tipo === 'egreso' ? 'egresos' : 'ingresos';
            resumen[grupo][medio][moneda] += monto;
            if (grupo === 'egresos' && String(movimiento.descripcion || '').toLowerCase().includes('vuelto')) {
                resumen.vueltos[moneda] += monto;
            }
        });
        return resumen;
    }

    // =======================
    //     CONTROL — LISTAR
    // =======================

    static async getAll(req, res) {
        try {
            const controles = await models.ControlCaja.findAll({
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
                order: [['id', 'DESC']],
            });

            res.json(controles);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;

            const control = await models.ControlCaja.findByPk(id, {
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
            });

            if (!control) {
                return res.status(404).json({ message: 'Control no encontrado' });
            }

            res.json(control);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getByCaja(req, res) {
        try {
            const { caja_id } = req.params;

            const controles = await models.ControlCaja.findAll({
                where: { caja_id },
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
                order: [['id', 'DESC']],
            });

            res.json(controles);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getActualByCaja(req, res) {
        try {
            const { caja_id } = req.params;

            // 1️⃣ Intentar encontrar un control ABIERTO
            let control = await models.ControlCaja.findOne({
                where: { caja_id, fecha_cierre: null },
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
                order: [['id', 'DESC']],
            });

            // 2️⃣ Si no hay control abierto, buscar el ÚLTIMO control creado
            if (!control) {
                control = await models.ControlCaja.findOne({
                    where: { caja_id },
                    include: [
                        { model: models.Caja, as: 'caja' },
                        { model: models.Usuario, as: 'usuario' },
                    ],
                    order: [['id', 'DESC']], // último registro
                });
            }

            return res.json({
                error: false,
                message: control ? 'Estado de la caja obtenido' : 'Esta caja aún no tiene controles creados',
                data: control,
                resumen: control ? await ControlCajaController.obtenerResumenControl(control.id) : null,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =======================
    //     CONTROL — MI ACTUAL
    // =======================

    static async getMyActual(req, res) {
        try {
            const usuario_id = res.locals.user.id;
            const control = await models.ControlCaja.findOne({
                where: { usuario_id, fecha_cierre: null, estado: 'abierto' },
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
            });
            return res.json(control);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =======================
    //     CONTROL — APERTURA
    // =======================

    static async apertura(req, res) {
        const transaction = await models.sequelize.transaction();
        try {
            const { caja_id } = req.params;
            const usuario_id = res.locals.user.id;

            const caja = await models.Caja.findByPk(caja_id, { transaction, lock: transaction.LOCK.UPDATE });
            if (!caja) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Caja no encontrada' });
            }
            if (caja.tipo === 'digital') {
                await transaction.rollback();
                return res.status(400).json({
                    message: 'Las cajas digitales no requieren apertura física',
                });
            }

            const controlAbierto = await models.ControlCaja.findOne({
                where: { caja_id, fecha_cierre: null },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (controlAbierto) {
                await transaction.rollback();
                return res.status(400).json({ message: 'La caja ya tiene una apertura activa' });
            }

            const otraCajaAbierta = await models.ControlCaja.findOne({
                where: { usuario_id, fecha_cierre: null, estado: 'abierto' },
                include: [{ model: models.Caja, as: 'caja', where: { tipo: 'fisica' }, attributes: ['id', 'nombre'] }],
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (otraCajaAbierta) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Ya tienes abierta la caja física "${otraCajaAbierta.caja.nombre}". Cierra esa caja antes de abrir otra.`,
                });
            }

            const tieneValor = (valor) => valor !== undefined && valor !== null && String(valor).trim() !== '';
            const { monto_apertura, monto_apertura_usd } = req.body || {};

            let saldoBs = formatearPrecio(caja.monto ?? 0);
            let saldoUsd = formatearPrecio(caja.monto_usd ?? 0);

            // Si el usuario indica el conteo físico inicial, ese pasa a ser el saldo del turno.
            if (tieneValor(monto_apertura) || tieneValor(monto_apertura_usd)) {
                if (tieneValor(monto_apertura)) saldoBs = formatearPrecio(monto_apertura);
                if (tieneValor(monto_apertura_usd)) saldoUsd = formatearPrecio(monto_apertura_usd);
                await caja.update({ monto: saldoBs.toFixed(2), monto_usd: saldoUsd.toFixed(2) }, { transaction });
            }

            const control = await models.ControlCaja.create({
                caja_id,
                usuario_id,
                fecha_apertura: new Date(),
                monto_apertura: saldoBs.toFixed(2),
                monto_apertura_usd: saldoUsd.toFixed(2),
                estado: 'abierto',
            }, { transaction });

            const controlCompleto = await models.ControlCaja.findByPk(control.id, {
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
                transaction,
            });
            const io = req.app.get('io');
            if (io) io.emit('caja:status-changed', controlCompleto);

            await transaction.commit();
            res.status(201).json({ control });
        } catch (error) {
            await transaction.rollback();
            handleErrorsController(error, res, req);
        }
    }

    // =======================
    //     CONTROL — CIERRE
    // =======================

    static async cierre(req, res) {
        try {
            const { caja_id } = req.params;
            const usuario_id = res.locals.user.id;
            const role = res.locals.user.tipo_usuario_name;
            const nota = req.body?.nota || req.body?.nota_cierre || null;

            const caja = await models.Caja.findByPk(caja_id);
            if (!caja) return res.status(404).json({ message: 'Caja no encontrada' });

            const controlAbierto = await models.ControlCaja.findOne({
                where: { caja_id, fecha_cierre: null },
                order: [['id', 'DESC']],
            });

            if (!controlAbierto) {
                return res.status(400).json({ message: 'La caja no tiene una apertura activa' });
            }

            // Solo el usuario que abrió la caja, o un rol superior, puede cerrarla.
            const esDueño = controlAbierto.usuario_id === usuario_id;
            const esSuperior = role === 'admin' || role === 'superadmin';
            if (!esDueño && !esSuperior) {
                return res.status(403).json({
                    message: 'Solo el usuario que abrió esta caja puede cerrarla (o un administrador)',
                });
            }

            await controlAbierto.update({
                fecha_cierre: new Date(),
                monto_cierre: caja.monto,
                monto_cierre_usd: caja.monto_usd,
                estado: 'cerrado',
                cerrado_por_id: usuario_id,
                nota_cierre: nota,
            });

            const controlCerrado = await models.ControlCaja.findByPk(controlAbierto.id, {
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
            });
            const io = req.app.get('io');
            if (io) io.emit('caja:status-changed', controlCerrado);

            res.json({
                message: 'Caja cerrada correctamente',
                control: controlAbierto,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default ControlCajaController;
