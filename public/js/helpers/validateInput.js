import { regExp } from './Format.js';

/**
 * Valida un solo input y aplica/remueve clase de error
 * @param {HTMLElement} element - El input a validar
 * @returns {Boolean} - true si es válido, false si no
 */
export const validateInputElement = (element) => {
    const name = element.name;
    const valid = element.getAttribute('data-valid');
    const regex = element.getAttribute('data-regex') ? new RegExp(element.getAttribute('data-regex')) : regExp[valid];

    element.classList.remove('inputError');

    if (regex) {
        if (element.type !== 'file' && !regex.test(element.value)) {
            element.classList.add('inputError');
            console.error(`El campo ${name} no es válido, valor: ${element.value}.`);
            return false;
        }
    } else {
        if (!element.value) {
            element.classList.add('inputError');
            console.error(`El campo ${name} no debe estar vacío.`);
            return false;
        }
    }

    return true;
};
