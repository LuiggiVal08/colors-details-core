import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { Op, fn, col, where } from 'sequelize';
import { computeDeuda } from '../services/payrollPeriodService.js';

const empleadoSchema = z.object({
    empresa_id: z.number().int(),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    cedula: z.string().min(6),
    telefono: z.string().min(6),
    email: z.string().email(),
    direccion: z.string().min(1),
    fecha_ingreso: z.coerce.date(),
    salario_base: z.string(),
    frecuencia_pago: z.enum(['mensual', 'quincenal', 'semanal']).optional().default('mensual'),
    activo: z.boolean().optional(),
});

class EmpleadoController {
    static async getAll(req, res) {
        try {
            const { search, page, limit } = req.query;
            let queryOptions = {
                include: [
                    { model: models.Empresa, as: 'empresa' },
                    { model: models.NominaEmpleado, as: 'nominas', include: [{ model: models.TasaDolar, as: 'tasa' }] },
                ],
                where: {},
            };

            if (search) {
                queryOptions.where = {
                    [Op.or]: [
                        { nombre: { [Op.like]: `%${search}%` } },
                        { apellido: { [Op.like]: `%${search}%` } },
                        { cedula: { [Op.like]: `%${search}%` } },
                        where(fn('concat', col('nombre'), ' ', col('apellido')), { [Op.like]: `%${search}%` }),
                    ],
                };
            }

            // Paginación (opcional para el móvil)
            if (page && limit) {
                queryOptions.limit = parseInt(limit);
                queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
            }

            const empleados = await models.Empleado.findAll(queryOptions);
            res.json(empleados);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const empleado = await models.Empleado.findByPk(id, {
                include: [
                    { model: models.Empresa, as: 'empresa' },
                    { model: models.NominaEmpleado, as: 'nominas', include: [{ model: models.TasaDolar, as: 'tasa' }] },
                ],
            });
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

            const nominaDetalles = await models.NominaDetalle.findAll({
                where: { empleado_id: id },
                include: [
                    {
                        model: models.Nomina,
                        as: 'nomina',
                        include: [
                            { model: models.TasaDolar, as: 'tasa' },
                            {
                                model: models.NominaDetalle,
                                as: 'detalles',
                                attributes: ['id', 'empleado_id', 'monto_total'],
                            },
                        ],
                    },
                ],
            });
            const nominasPorId = new Map(
                nominaDetalles
                    .map((detalle) => detalle.nomina)
                    .filter(Boolean)
                    .map((nomina) => [nomina.id, nomina]),
            );
            const nominaIds = [...nominasPorId.keys()];
            const movimientosPago = nominaIds.length
                ? await models.MovimientoCaja.findAll({
                      where: {
                          [Op.or]: nominaIds.map((nominaId) => ({
                              descripcion: { [Op.like]: `Pago de nómina #${nominaId} %` },
                          })),
                      },
                      order: [['fecha', 'ASC'], ['id', 'ASC']],
                  })
                : [];
            const pagosNomina = nominaIds.length
                ? await models.NominaPago.findAll({
                      where: { nomina_id: nominaIds },
                      include: [{ model: models.NominaPagoDetalle, as: 'detalles' }],
                  })
                : [];
            const pagosPorMovimiento = new Map(pagosNomina.map((pago) => [pago.movimiento_caja_id, pago]));
            const detallesPorNomina = new Map();
            for (const detalle of nominaDetalles) {
                if (!detalle.nomina) continue;
                const detalles = detallesPorNomina.get(detalle.nomina.id) || detalle.nomina.detalles || [];
                detallesPorNomina.set(detalle.nomina.id, detalles);
            }

            const historialNominaGeneral = [];
            for (const movimiento of movimientosPago) {
                const nominaId = Number(movimiento.descripcion.match(/Pago de nómina #(\d+)/)?.[1]);
                const nomina = nominasPorId.get(nominaId);
                const detalles = [...(detallesPorNomina.get(nominaId) || [])].sort((a, b) => a.id - b.id);
                const totalNomina = detalles.reduce((sum, detalle) => sum + Number(detalle.monto_total || 0), 0);
                if (!nomina || totalNomina <= 0) continue;

                const pagoNomina = pagosPorMovimiento.get(movimiento.id);
                const detalleEmpleado = nominaDetalles.find(
                    (detalle) => detalle.nomina?.id === nominaId && detalle.empleado_id === Number(id),
                );
                let montoEmpleado = pagoNomina
                    ?.detalles?.find((detalle) => detalle.nomina_detalle_id === detalleEmpleado?.id)?.monto;

                if (montoEmpleado === undefined) {
                    const montoPago = Number(movimiento.monto || 0);
                    let montoAsignado = 0;
                    const asignaciones = detalles.map((detalle, index) => {
                        const monto = index === detalles.length - 1
                            ? Math.round((montoPago - montoAsignado) * 100) / 100
                            : Math.floor((montoPago * Number(detalle.monto_total) / totalNomina + Number.EPSILON) * 100) / 100;
                        montoAsignado += monto;
                        return { empleado_id: detalle.empleado_id, monto };
                    });
                    montoEmpleado = asignaciones.find((asignacion) => asignacion.empleado_id === Number(id))?.monto;
                }
                if (!detalleEmpleado || Number(montoEmpleado) <= 0) continue;

                const tasa = Number(nomina.tasa?.tasa) || 0;
                historialNominaGeneral.push({
                    nomina_id: nomina.id,
                    periodo_inicio: nomina.periodo_inicio,
                    periodo_fin: nomina.periodo_fin,
                    fecha_pago: movimiento.fecha,
                    monto_bs: Number(montoEmpleado),
                    monto_usd: tasa > 0 ? Math.round((Number(montoEmpleado) / tasa) * 100) / 100 : 0,
                    tasa: nomina.tasa,
                    medio_pago: movimiento.medio_pago,
                    referencia: movimiento.referencia,
                });
            }

            res.json({ ...empleado.toJSON(), historial_nomina_general: historialNominaGeneral });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async getByIdUser(req, res) {
        try {
            const { id: userId } = req.params;
            const user = await models.Usuario.findByPk(userId);
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
            const empleado = await models.Empleado.findOne({ where: { id: user.empleado_id } });
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
            res.json(empleado);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async create(req, res) {
        try {
            const empresa = await models.Empresa.findOne();
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
            const fecha_ingreso = new Date();
            const data = empleadoSchema.parse({ ...req.body, empresa_id: empresa.id, fecha_ingreso });

            const cedulaExistente = await models.Empleado.findOne({
                where: { cedula: data.cedula },
            });
            if (cedulaExistente) {
                return res.status(400).json({ message: 'Ya existe un empleado con esa cédula' });
            }

            const empleado = await models.Empleado.create(data);
            res.status(201).json({ empleado });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const empleado = await models.Empleado.findByPk(id);
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
            const empresa = await models.Empresa.findOne();
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            const data = empleadoSchema.parse({ ...req.body, empresa_id: empresa.id });
            await empleado.update(data);
            res.json({ empleado });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const empleado = await models.Empleado.findByPk(id);
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

            await empleado.destroy();
            res.json({ message: 'Empleado eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async deuda(req, res) {
        try {
            const { id } = req.params;
            const result = await computeDeuda(id);
            if (!result) return res.status(404).json({ message: 'Empleado no encontrado' });
            res.json(result);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default EmpleadoController;
