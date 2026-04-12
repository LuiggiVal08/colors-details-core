// controllers/ServicioPrecioController.js
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { Op } from 'sequelize';

const schemaPrecio = z.object({
    servicio_id: z.number(),
    precio: z.union([z.string(), z.number()]),
    fecha_inicio: z.string(), // ISO date string esperada
    applyToFuture: z.boolean().optional(), // opcional: actualizar periodos no pagados desde esta fecha
});

function parsePrecioToNumber(value) {
    if (typeof value === 'number') return Number(value);
    if (typeof value === 'string') {
        // acepta "12,50" o "12.50"
        const normalized = value.replace(/\./g, '').replace(',', '.'); // maneja formatos tipo "1.234,56"
        const n = Number(normalized);
        if (Number.isNaN(n)) throw new Error('Precio inválido');
        return n;
    }
    throw new Error('Precio inválido');
}

function parseDateOnly(str) {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) throw new Error('Fecha inválida');
    // Normalizar a date-only (midnight)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

class ServicioPrecioController {
    // Crear nuevo precio (y cerrar el precio anterior).
    // body: { servicio_id, precio, fecha_inicio, applyToFuture? }
    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const data = schemaPrecio.parse(req.body);

            const servicioId = data.servicio_id;
            const precioNum = parsePrecioToNumber(data.precio);
            const fechaInicio = parseDateOnly(data.fecha_inicio);
            const applyToFuture = Boolean(data.applyToFuture);

            // Obtener último precio (si existe)
            const ultimo = await models.ServicioPrecio.findOne({
                where: { servicio_id: servicioId },
                order: [['fecha_inicio', 'DESC']],
                transaction: t,
            });

            if (ultimo) {
                const ultimoInicio = new Date(ultimo.fecha_inicio);
                // No permitir insertar una fecha_inicio anterior o igual al último inicio
                if (fechaInicio.getTime() <= ultimoInicio.getTime()) {
                    await t.rollback();
                    return res
                        .status(400)
                        .json({ error: true, message: 'fecha_inicio debe ser posterior al último precio registrado' });
                }
            }

            // Cerrar precio vigente (si existe uno con fecha_fin NULL o posterior)
            if (ultimo && (ultimo.fecha_fin === null || new Date(ultimo.fecha_fin) >= fechaInicio)) {
                // fecha_fin = fecha_inicio - 1 día
                const prevFechaFin = new Date(fechaInicio);
                prevFechaFin.setDate(prevFechaFin.getDate() - 1);

                await models.ServicioPrecio.update(
                    { fecha_fin: prevFechaFin },
                    { where: { servicio_id: servicioId, fecha_fin: null }, transaction: t },
                );
            }

            // Crear nuevo precio (precioNum será guardado en campo DECIMAL)
            const nuevo = await models.ServicioPrecio.create(
                {
                    servicio_id: servicioId,
                    precio: precioNum,
                    fecha_inicio: fechaInicio,
                    fecha_fin: null,
                },
                { transaction: t },
            );

            // Opcional: actualizar periodos futuros no pagados a la nueva tarifa
            let updatedPeriodos = [];
            if (applyToFuture) {
                // buscamos periodos cuya fecha_generada >= fechaInicio y que estén pending/partial
                const periodos = await models.ServicioPeriodo.findAll({
                    where: {
                        servicio_id: servicioId,
                        fecha_generada: { [Op.gte]: fechaInicio },
                        estado: { [Op.in]: ['pending', 'partial'] },
                    },
                    transaction: t,
                });

                for (const periodo of periodos) {
                    // tomar amount_due actual como numero (aceptamos que venga con coma o punto)
                    const oldDueRaw = periodo.amount_due;
                    let oldDueNum = 0;
                    if (typeof oldDueRaw === 'number') oldDueNum = Number(oldDueRaw);
                    else if (typeof oldDueRaw === 'string')
                        oldDueNum = Number(String(oldDueRaw).replace(/\./g, '').replace(',', '.'));
                    else oldDueNum = Number(oldDueRaw) || 0;

                    const delta = precioNum - oldDueNum;

                    // nuevo amount_due
                    const newAmountDue = precioNum;

                    // ajustar amount_balance solo si no está fully paid (aquí son pending/partial)
                    // Si el periodo estaba parcial, sumamos el delta al balance. Si delta es positivo, aumenta lo que falta.
                    // Si delta es negativo (reducción de precio), reducimos el balance pero no por debajo de 0.
                    let oldBalanceNum = 0;
                    if (typeof periodo.amount_balance === 'number') oldBalanceNum = Number(periodo.amount_balance);
                    else if (typeof periodo.amount_balance === 'string')
                        oldBalanceNum = Number(String(periodo.amount_balance).replace(/\./g, '').replace(',', '.'));
                    else oldBalanceNum = Number(periodo.amount_balance) || 0;

                    let newBalance = oldBalanceNum + delta;
                    if (newBalance < 0) newBalance = 0;

                    await periodo.update(
                        {
                            amount_due: newAmountDue,
                            amount_balance: newBalance,
                        },
                        { transaction: t },
                    );

                    updatedPeriodos.push(periodo.id);
                }
            }

            await t.commit();
            return res.status(201).json({ message: 'Precio creado', precio: nuevo, updatedPeriodos });
        } catch (err) {
            if (!t.finished) await t.rollback();
            console.error(err);
            return handleErrorsController(err, res, req);
        }
    }

    static async history(req, res) {
        try {
            const servicio_id = Number(req.params.id);
            const precios = await models.ServicioPrecio.findAll({
                where: { servicio_id },
                order: [['fecha_inicio', 'DESC']],
            });

            res.json(precios);
        } catch (err) {
            handleErrorsController(err, res);
        }
    }
}

export default ServicioPrecioController;
