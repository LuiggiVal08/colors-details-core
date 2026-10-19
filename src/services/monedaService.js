import { models } from '../models/index.js';

const DEFINICIONES = [
    { codigo: 'USD', simbolo: '$', nombre: 'Dólar estadounidense' },
    { codigo: 'VES', simbolo: 'Bs', nombre: 'Bolívar' },
];

let cache = null;

export function normalizarCodigoMoneda(valor) {
    const codigo = String(valor ?? '')
        .trim()
        .toUpperCase();
    if (['USD', 'US$', '$', 'DOLAR', 'DÓLAR', 'DIVISA'].includes(codigo)) return 'USD';
    return 'VES';
}

export async function seedMonedas() {
    for (const definicion of DEFINICIONES) {
        await models.Moneda.findOrCreate({
            where: { codigo: definicion.codigo },
            defaults: definicion,
        });
    }
    cache = null;
}

export async function getMoneda(codigo, transaction) {
    const code = normalizarCodigoMoneda(codigo);

    if (cache?.[code]) return cache[code];

    const moneda = await models.Moneda.findOne({ where: { codigo: code }, transaction });
    if (!moneda) return null;

    cache = cache || {};
    cache[code] = moneda;
    return moneda;
}

export async function getMonedaId(codigo, transaction) {
    const moneda = await getMoneda(codigo, transaction);
    return moneda?.id ?? null;
}

export async function backfillMonedas() {
    const usd = await models.Moneda.findOne({ where: { codigo: 'USD' } });
    const ves = await models.Moneda.findOne({ where: { codigo: 'VES' } });

    if (ves) {
        await models.MovimientoCaja.update({ moneda_id: ves.id }, { where: { moneda_id: null } });
    }

    if (usd) {
        await models.PagoVenta.update(
            { moneda_id: usd.id, monto_usd: models.sequelize.literal('monto') },
            { where: { moneda_id: null } },
        );
        await models.Pago.update(
            { moneda_id: usd.id, monto_usd: models.sequelize.literal('monto') },
            { where: { moneda_id: null } },
        );
        await models.PagoServicio.update({ moneda_id: usd.id }, { where: { moneda_id: null } });
    }
}
