import { normalizarCodigoMoneda } from './monedaService.js';

const TIPOS_EFECTIVO = ['efectivo'];

const tipoMetodo = (metodo) => String(metodo?.tipo ?? '').trim().toLowerCase();

/**
 * Solo el efectivo se considera pago en dinero en efectivo:
 * permite elegir moneda (USD/VES), genera vuelto y mueve la caja.
 */
export function esMetodoEfectivo(metodo) {
    return TIPOS_EFECTIVO.includes(tipoMetodo(metodo));
}

/**
 * Moneda admitida por el método de pago.
 * El efectivo admite USD y VES; el resto de métodos solo admite bolívares.
 */
export function monedaPermitida(metodo, monedaSolicitada) {
    if (esMetodoEfectivo(metodo)) {
        return normalizarCodigoMoneda(monedaSolicitada || 'USD');
    }
    return 'VES';
}

/**
 * Valida que la moneda solicitada sea compatible con el método de pago.
 * Devuelve un mensaje de error o null cuando la combinación es válida.
 */
export function validarMonedaMetodo(metodo, monedaSolicitada) {
    if (esMetodoEfectivo(metodo)) return null;

    const solicitada = normalizarCodigoMoneda(monedaSolicitada || 'VES');
    if (solicitada === 'USD') {
        return `El método de pago "${metodo?.nombre ?? metodo?.tipo}" solo admite pagos en bolívares (Bs).`;
    }
    return null;
}
