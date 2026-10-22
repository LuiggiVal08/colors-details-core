import { normalizarCodigoMoneda } from './monedaService.js';

const TIPOS_EFECTIVO = ['efectivo'];

const tipoMetodo = (metodo) => String(metodo?.tipo ?? '').trim().toLowerCase();
const esMetodoSoloBs = (metodo) => ['tarjeta', 'transferencia'].includes(tipoMetodo(metodo));

/**
 * Solo el efectivo se considera pago en dinero en efectivo:
 * permite elegir moneda (USD/VES), genera vuelto y mueve la caja.
 */
export function esMetodoEfectivo(metodo) {
    return TIPOS_EFECTIVO.includes(tipoMetodo(metodo));
}

/**
 * Todos los métodos pueden registrar el monto recibido en USD o VES.
 */
export function monedaPermitida(metodo, monedaSolicitada) {
    return esMetodoSoloBs(metodo)
        ? 'VES'
        : normalizarCodigoMoneda(monedaSolicitada || 'VES');
}

/**
 * Valida que la moneda solicitada sea compatible con el método de pago.
 * Devuelve un mensaje de error o null cuando la combinación es válida.
 */
export function validarMonedaMetodo(metodo, monedaSolicitada) {
    const solicitada = normalizarCodigoMoneda(monedaSolicitada || 'VES');
    if (esMetodoSoloBs(metodo) && solicitada !== 'VES') {
        return `El método de pago "${metodo?.nombre ?? tipoMetodo(metodo)}" solo admite pagos en bolívares (Bs).`;
    }
    return null;
}
