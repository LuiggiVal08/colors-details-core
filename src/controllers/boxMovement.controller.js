import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { formatearPrecio } from '../helpers/format.js';
import cajaService from '../services/cajaService.js';

const schemaMovimiento = z.object({
    caja_id: z.string(),
    monto: z.string(),
    descripcion: z.string().optional(),
    tipo: z.enum(['ingreso', 'egreso']),
});
class MovimientoCajaController {
    // =============================
    // 1. Crear movimiento
    // =============================
    static async createMovement(req, res) {
        try {
            const data = schemaMovimiento.parse(req.body);
            const usuario_id = res.locals.user.id;

            const movimiento = await cajaService.realizarMovimiento({
                ...data,
                usuario_id,
            });

            return res.status(201).json({
                error: false,
                message: 'Movimiento registrado',
                data: movimiento,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =============================
    // 2. Movimientos por control
    // =============================
    static async getByControl(req, res) {
        try {
            const { control_id } = req.params;

            const movimientos = await models.MovimientoCaja.findAll({
                where: { control_caja_id: control_id },
                include: [{ model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] }],
                order: [['fecha', 'ASC']],
            });

            return res.json({
                error: false,
                message: 'Movimientos obtenidos',
                data: movimientos,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =============================
    // 3. Movimientos por caja (último control activo)
    // =============================
    static async getByBox(req, res) {
        try {
            const { box_id } = req.params;

            // Obtener el control activo de esa caja
            const controlActivo = await models.ControlCaja.findOne({
                where: {
                    caja_id: box_id,
                    fecha_cierre: null,
                },
            });

            if (!controlActivo) {
                return res.status(404).json({
                    error: true,
                    message: 'La caja no tiene un control activo',
                });
            }

            const movimientos = await models.MovimientoCaja.findAll({
                where: { control_caja_id: controlActivo.id },
                include: [{ model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] }],
                order: [['fecha', 'DESC']],
            });

            return res.json({
                error: false,
                message: 'Movimientos obtenidos',
                data: movimientos,
                control: controlActivo,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =============================
    // 4. Obtener un movimiento
    // =============================
    static async getOne(req, res) {
        try {
            const { id } = req.params;

            const movimiento = await models.MovimientoCaja.findByPk(id, {
                include: [
                    { model: Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.ControlCaja, as: 'control' },
                ],
            });

            if (!movimiento) {
                return res.status(404).json({
                    error: true,
                    message: 'Movimiento no encontrado',
                });
            }

            return res.json({
                error: false,
                message: 'Movimiento obtenido',
                data: movimiento,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default MovimientoCajaController;
