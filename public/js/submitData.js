import showToast from './helpers/Toast.js';
import { httpClient } from './index.js';

/**
 * Envía datos a un endpoint.
 * @param {string} url URL del endpoint.
 * @param {string} method Método HTTP (post, get, put, patch, delete).
 * @param {object} data Datos a enviar.
 * @returns {boolean} true si se realizó correctamente, false en caso de error.
 */
const submitData = async (url, method, data) => {
    try {
        const response = await httpClient[method.toLowerCase() ?? 'post'](url, data);
        const { error, status, message } = response || {};

        if (error) {
            let errorMessage = '';
            if (typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (typeof error.error === 'object' && error.error.message) {
                errorMessage = error.error.message;
            } else if (Array.isArray(error.error) && error.error.length > 0) {
                errorMessage = error.error.map((e) => `${e.message} (campo: ${e.path})`).join(', ');
            } else {
                errorMessage = message || 'Ocurrió un error inesperado';
            }
            showToast({ title: `Error: ${status}`, message: errorMessage, type: 'error', duration: 5000 });

            return false;
        }

        if (url !== '/auth/token') {
            showToast({
                title: 'Proceso realizado con éxito',
                message: message || 'Proceso realizado con éxito',
                type: 'success',
                duration: 5000,
            });
        }
        return true;
    } catch (err) {
        console.error(err);
        showToast({ title: 'Error', message: 'Ocurrió un error inesperado', type: 'error', duration: 5000 });
        return false;
    }
};

export default submitData;
