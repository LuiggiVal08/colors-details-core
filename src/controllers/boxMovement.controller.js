import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { Op } from 'sequelize';
import { formatearPrecio } from '../helpers/format.js';
import cajaService from '../services/cajaService.js';

const schemaMovimiento = z.object({
    caja_id: z.coerce.number().int().positive(),
    monto: z.string(),
    descripcion: z.string().optional(),
    tipo: z.enum(['ingreso', 'egreso']),
    moneda: z.string().optional(),
    tasa: z.string().optional().nullable(),
    medio_pago: z.enum(['efectivo', 'digital']).optional(),
    metodo_pago_id: z.coerce.number().int().positive().optional().nullable(),
    referencia: z.string().max(120).optional().nullable(),
    cuenta_receptora: z.string().max(160).optional().nullable(),
});
class MovimientoCajaController {
    // =============================
    // 1. Crear movimiento
    // =============================
    static async createMovement(req, res) {
        try {
            const data = schemaMovimiento.parse(req.body);
            const usuario_id = res.locals.user.id;
            const metodo = data.metodo_pago_id
                ? await models.MetodoPago.findByPk(data.metodo_pago_id)
                : null;
            if (!metodo) {
                return res.status(400).json({
                    error: true,
                    message: 'El método de pago seleccionado no existe',
                });
            }
            if (['tarjeta', 'transferencia'].includes(String(metodo.tipo).toLowerCase()) && data.moneda === 'USD') {
                return res.status(400).json({
                    error: true,
                    message: 'Los pagos por tarjeta o transferencia solo pueden registrarse en bolívares (Bs)',
                });
            }

            const movimiento = await cajaService.realizarMovimiento({
                ...data,
                medio_pago: metodo?.tipo?.toLowerCase() === 'efectivo' ? 'efectivo' : 'digital',
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
                include: [
                    { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.Moneda, as: 'moneda', attributes: ['id', 'codigo', 'simbolo'] },
                    { model: models.Caja, as: 'caja', attributes: ['id', 'nombre', 'tipo', 'cuenta_receptora'] },
                    { model: models.MetodoPago, as: 'metodoPago', attributes: ['id', 'nombre', 'tipo'] },
                ],
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
            const caja = await models.Caja.findByPk(box_id);
            if (!caja) {
                return res.status(404).json({
                    error: true,
                    message: 'Caja no encontrada',
                });
            }

            // Las cajas digitales no necesitan apertura física; las físicas sí.
            const controlActivo =
                caja.tipo === 'digital'
                    ? null
                    : await models.ControlCaja.findOne({
                          where: {
                              caja_id: box_id,
                              fecha_cierre: null,
                          },
                      });

            if (!controlActivo && caja.tipo !== 'digital') {
                return res.status(404).json({
                    error: true,
                    message: 'La caja no tiene un control activo',
                });
            }

            const movimientos = await models.MovimientoCaja.findAll({
                where: controlActivo ? { control_caja_id: controlActivo.id } : { caja_id: box_id },
                include: [
                    { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.Moneda, as: 'moneda', attributes: ['id', 'codigo', 'simbolo'] },
                    { model: models.Caja, as: 'caja', attributes: ['id', 'nombre', 'tipo', 'cuenta_receptora'] },
                    { model: models.MetodoPago, as: 'metodoPago', attributes: ['id', 'nombre', 'tipo'] },
                ],
                order: [['fecha', 'DESC']],
            });

            return res.json({
                error: false,
                message: 'Movimientos obtenidos',
                data: movimientos,
                control: controlActivo,
                caja,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getGlobalBalance(req, res) {
        try {
            const empresaId = z.coerce.number().int().positive().parse(req.query.empresa_id);
            const cajas = await models.Caja.findAll({ where: { empresa_id: empresaId } });
            const movimientos = await models.MovimientoCaja.findAll({
                where: { caja_id: { [Op.in]: cajas.map((caja) => caja.id) } },
                include: [{ model: models.Moneda, as: 'moneda', attributes: ['codigo'] }],
                attributes: ['caja_id', 'tipo', 'medio_pago', 'monto'],
            });
            const cajaActual = req.query.caja_id
                ? cajas.find((caja) => caja.id === Number(req.query.caja_id))
                : null;
            const balance = cajas.reduce(
                (result, caja) => {
                    result.global.VES += Number(caja.monto || 0);
                    result.global.USD += Number(caja.monto_usd || 0);
                    if (caja.tipo === 'digital') {
                        result.digital.VES += Number(caja.monto || 0);
                        result.digital.USD += Number(caja.monto_usd || 0);
                    }
                    return result;
                },
                {
                    efectivo: { VES: 0, USD: 0 },
                    digital: { VES: 0, USD: 0 },
                    global: { VES: 0, USD: 0 },
                },
            );
            movimientos.forEach((movimiento) => {
                const caja = cajas.find((item) => item.id === movimiento.caja_id);
                const codigo = movimiento.moneda?.codigo === 'USD' ? 'USD' : 'VES';
                const signo = movimiento.tipo === 'egreso' ? -1 : 1;
                const grupo = movimiento.medio_pago === 'digital' ? 'digital' : 'efectivo';
                if (grupo === 'digital' && caja?.tipo === 'digital') return;
                balance[grupo][codigo] += signo * Number(movimiento.monto || 0);
            });
            balance.efectivo.VES = balance.global.VES - balance.digital.VES;
            balance.efectivo.USD = balance.global.USD - balance.digital.USD;
            return res.json({
                error: false,
                data: {
                    ...balance,
                    caja: cajaActual
                        ? {
                              id: cajaActual.id,
                              nombre: cajaActual.nombre,
                              tipo: cajaActual.tipo,
                              VES: Number(cajaActual.monto || 0),
                              USD: Number(cajaActual.monto_usd || 0),
                          }
                        : null,
                },
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
                    { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.Moneda, as: 'moneda', attributes: ['id', 'codigo', 'simbolo'] },
                    { model: models.ControlCaja, as: 'control' },
                    { model: models.Caja, as: 'caja' },
                    { model: models.MetodoPago, as: 'metodoPago' },
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
