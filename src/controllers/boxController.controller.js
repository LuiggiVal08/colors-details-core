import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';

class ControlCajaController {
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
        try {
            const { caja_id } = req.params;
            const usuario_id = res.locals.user.id;

            const caja = await models.Caja.findByPk(caja_id);
            if (!caja) return res.status(404).json({ message: 'Caja no encontrada' });

            const controlAbierto = await models.ControlCaja.findOne({
                where: { caja_id, fecha_cierre: null },
            });

            if (controlAbierto) {
                return res.status(400).json({ message: 'La caja ya tiene una apertura activa' });
            }

            const control = await models.ControlCaja.create({
                caja_id,
                usuario_id,
                fecha_apertura: new Date(),
                monto_apertura: caja.monto,
                estado: 'abierto',
            });

            const controlCompleto = await models.ControlCaja.findByPk(control.id, {
                include: [
                    { model: models.Caja, as: 'caja' },
                    { model: models.Usuario, as: 'usuario' },
                ],
            });
            const io = req.app.get('io');
            if (io) io.emit('caja:status-changed', controlCompleto);

            res.status(201).json({ control });
        } catch (error) {
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
