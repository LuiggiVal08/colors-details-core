export const regExp = {
    name: /^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]{3,}$/,
    dni: /^[\d\s]{9,10}$/,
    rif: /^[VJEGP]-?\d{8,9}-\d$/, // Regex para el RIF
    username: /^[A-Za-z0-9_.\-]{4,16}$/,
    email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    date: /^\d{4}[-\/]\d{2}[-\/]\d{2}$/,
    password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d_.-]{8,16}$/,
    token: /^\d{8}$/,
    phone: /^\+58 \(\d{3}\) \d{3}-\d{4}$/,
    text: /^[A-Za-zÁÉÍÓÚÑáéíóúñüÜ0-9\s.,!?¡¿()-_&$%#@+:;'"]{1,}$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    file: /^\.(sql|json|txt)$/,
    number: /^[0-9]+$/, // Números
    float: /^(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/,
    // Expresión regular para validar URLs
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    // Expresión regular para validar imágenes
    image: /\.(jpe?g|png|gif|bmp|webp)$/i,
};

export class Format {
    static formatInput = (input, callback) => {
        if (input.target.type === 'checkbox') return;
        const methodName = input.target.getAttribute('data-valid');
        if (typeof this[methodName] === 'function') {
            input.target.value = this[methodName](input.target.value);
            // if (methodName === 'float') input.target.value = input.target.value.replace(',', '.');
            const isValid = regExp[methodName].test(input.target.value);

            if (!isValid) {
                input.target.classList.add('inputError');
            } else {
                input.target.classList.remove('inputError');
            }
        } else {
            console.error(`Método no reconocido: ${methodName}`);
            return input.target.value;
        }
    };

    static formatEventInput = (content) => {
        // Filtrar los inputs
        const inputs = Array.from(content.elements).filter(
            (element) => element.tagName === 'INPUT' && element.type !== 'button',
        );

        // Filtrar los selects
        const selects = Array.from(content.elements).filter((element) => element.tagName === 'SELECT');

        // Filtrar los textareas
        const textareas = Array.from(content.elements).filter((element) => element.tagName === 'TEXTAREA');

        const events = ['input', 'blur', 'change'];

        // Agregar eventos a los inputs
        inputs.forEach((input) => {
            // Verificar si el input es de tipo file

            const eventHandler =
                input.type === 'file' && input.dataset.valid === 'img'
                    ? this.image
                    : input.dataset.valid === 'file'
                    ? this.file
                    : this.formatInput;

            events.forEach((event) => input.addEventListener(event, eventHandler));
        });

        // Agregar eventos a los textareas
        textareas.forEach((textarea) => {
            events.forEach((event) => textarea.addEventListener(event, this.formatInput));
        });

        // Agregar eventos a los selects
        selects.forEach((select) => {
            select.addEventListener('change', this.formatInput);
        });
    };

    static image = (input) => {
        const file = input.target.files[0]; // Obtener el archivo seleccionado

        if (!file) return; // Si no hay archivo, salir

        const allowedExtensions = /\.(jpe?g|png|gif|bmp|webp)$/i;
        const isValid = allowedExtensions.test(file.name);

        if (!isValid) {
            alert('Formato de imagen no válido. Usa JPG, PNG, GIF, BMP o WEBP.');
            input.target.value = ''; // Limpiar el input si no es válido
        }
        return file;
    };

    static name = (value) => {
        return value
            .replace(/[^\p{L}\s]/gu, '')
            .replace(/\d+/g, ' ')
            .replace(/\s+/g, ' ');
    };
    static file = (input) => {
        const file = input.target.files[0]; // Obtener el archivo seleccionado

        if (!file) return; // Si no hay archivo, salir

        const allowedExtensions = /\.(sql|json|txt)$/i;
        const isValid = allowedExtensions.test(file.name);

        if (!isValid) {
            alert('Formato de archivo no válido. Usa archivo .sql, .json o .txt.');
            input.target.value = ''; // Limpiar el input si no es válido
        }
        return file;
    };
    static token = (value) => {
        // Reemplazar cualquier carácter que no sea un número
        return value.replace(/\D/g, '').slice(0, 8);
    };

    static dni = (value) => {
        // Elimina todos los caracteres no numéricos al inicio
        const cleanedValue = value.replace(/[^\d]/g, '');

        // Si el valor está vacío o es nulo, devolver cadena vacía
        if (!cleanedValue) return '';

        // Invierte la cadena, agrupa en bloques de 3, luego la devuelve a su formato original
        const reversedValue = cleanedValue.split('').reverse().join('');
        const formattedValue = reversedValue.match(/.{1,3}/g)?.join(' ') || '';
        return formattedValue.split('').reverse().join('');
    };
    static rif = (value) => {
        // Elimina caracteres no alfanuméricos excepto la letra inicial
        const cleanedValue = value.toUpperCase().replace(/[^VJEG0-9]/g, '');

        // Si el valor está vacío o es nulo, devolver cadena vacía
        if (!cleanedValue) return '';

        // Extrae la letra inicial si existe
        const match = cleanedValue.match(/^([VJEG])?(\d+)/);
        if (!match) return cleanedValue;

        const [, letter, numbers] = match;

        // Aplica formato XX-XXXXXXXX-X
        const formattedValue = numbers.replace(/^(\d{1,2})(\d{8})(\d)$/, '$1-$2-$3');

        return letter ? `${letter}-${formattedValue}` : formattedValue;
    };

    static rif = (value) => {
        // 1. Eliminar caracteres inválidos, pero permitir letras, números y guiones
        let numeroLimpio = value.replace(/[^VJEGPvjegp0-9-]/g, '');

        // 2. Convertir la primera letra a mayúscula si existe
        if (numeroLimpio.length > 0) {
            numeroLimpio = numeroLimpio[0].toUpperCase() + numeroLimpio.slice(1);
        }

        // 3. Asegurar que el guion después de la letra se mantenga o se agregue si falta
        numeroLimpio = numeroLimpio.replace(/^([VJEGP])([^-\d])/, '$1-$2'); // Si hay letra y algo que no sea número, fuerza el guion
        if (/^[VJEGP][0-9]/.test(numeroLimpio)) {
            numeroLimpio = numeroLimpio.replace(/^([VJEGP])([0-9])/, '$1-$2'); // Agrega el guion si es necesario
        }

        // 4. Permitir un segundo guion antes del último número si el usuario lo escribe
        numeroLimpio = numeroLimpio.replace(/^([VJEGP]-\d{8,9})-(\d)$/, '$1-$2');

        // 5. Limitar a máximo 13 caracteres (incluyendo guiones) y devolver el resultado
        return numeroLimpio.substring(0, 13);
    };

    static uuid = (value) => {
        // Eliminar caracteres no válidos y formatear
        return value.replace(/[^0-9a-fA-F-]/g, '').toLowerCase();
    };
    static username = (value) => {
        return value.replace(/[^A-Za-z0-9_.-]/g, '');
    };
    static email = (value) => {
        return value.replace(/[^a-zA-Z0-9@._-]/g, '');
    };
    static password = (value) => {
        // Reemplazar caracteres no válidos para el password
        var valueInputReplace = value.replace(/[^A-Za-z0-9_.-]/g, '');
        return valueInputReplace;
    };
    static phone = (value) => {
        // Eliminar cualquier carácter que no sea numérico
        let numeroLimpio = value.replace(/\D/g, '');

        // Asegurar que el prefijo +58 siempre esté presente
        if (numeroLimpio.length > 1 && !numeroLimpio.startsWith('58')) {
            numeroLimpio = '58' + numeroLimpio;
        }

        // Eliminar el '0' que viene justo después del '58'
        if (numeroLimpio.startsWith('580') || (numeroLimpio.length > 2 && numeroLimpio[2] === '5')) {
            numeroLimpio = '58' + numeroLimpio.slice(3);
        }

        // Limitar el número a 13 dígitos (3 del prefijo +58 y 10 para el número)
        numeroLimpio = numeroLimpio.substring(0, 12);

        // Verificar que el primer número después de +58 no sea 5
        if (numeroLimpio.length > 2 && numeroLimpio[2] === '5') {
            numeroLimpio = '58' + numeroLimpio.slice(3);
        }

        // Aplicar el formato progresivo
        if (numeroLimpio.length > 2 && numeroLimpio.length <= 6) {
            // Ejemplo: 5841 -> +58 (41
            return `+58 (${numeroLimpio.substring(2)}`;
        } else if (numeroLimpio.length >= 7 && numeroLimpio.length <= 9) {
            // Ejemplo: 584147 -> +58 (414) 7
            return `+58 (${numeroLimpio.substring(2, 5)}) ${numeroLimpio.substring(5)}`;
        } else if (numeroLimpio.length > 9) {
            // Ejemplo: 584147314426 -> +58 (414) 731-4426
            return `+58 (${numeroLimpio.substring(2, 5)}) ${numeroLimpio.substring(5, 8)}-${numeroLimpio.substring(8)}`;
        }

        return `+58`; // Si el usuario no ha ingresado suficientes dígitos
    };
    /**
     * Esta función toma un valor de texto y elimina cualquier carácter que no sea una letra, número, espacio o ciertos caracteres especiales.
     * Además, permite algunos caracteres de puntuación comunes.
     * @param {string} value - El texto que se va a formatear.
     * @returns {string} - El texto formateado.
     */
    static text = (value) => {
        // Reemplazar caracteres no válidos para el texto, permitiendo letras, números, espacios y algunos signos de puntuación
        let textoLimpio = value.replace(/[^a-zA-Z0-9áéíóúñü\s.,;:!¡¿?()'"-]/g, '');

        // Convertir múltiples espacios en un solo espacio
        textoLimpio = textoLimpio.replace(/\s+/g, ' ');

        // Eliminar espacios al inicio y al final del texto
        // textoLimpio = textoLimpio.trim();

        return textoLimpio;
    };
    static number = (value) => {
        if (value === undefined || value === null || value === '') {
            return ''; // Devolver una cadena vacía en lugar de undefined
        }
        // Reemplazar caracteres no válidos para el número
        value = value.replace(/[^0-9]/g, '');
        // Reemplazar espacios en blanco
        value = value.replace(/\s+/g, '');
        // Devolver el número
        value = value.trim();
        // Convertir el número a un número

        // Convertir el número a un número
        if (value === '') {
            return ''; // Devolver una cadena vacía si el número es un string vacío
        }
        const valueReturn = parseFloat(value);
        return valueReturn;
    };
    static toNumber = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    };
    static float = (value) => {
        if (!value) return value;

        // if (value === null || value === undefined || isNaN(value)) return '0,00';

        // value = String(Number(value).toFixed(2));
        const raw = value.replace(/\D/g, '');

        // Si no hay nada, devolvemos vacío
        if (!raw) return '';

        // Convertimos a número flotante dividido entre 100 para dejar 2 decimales
        const floatValue = (parseInt(raw, 10) / 100).toFixed(2);

        // Formateamos como moneda
        return new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(floatValue);
    };
    static date = (value) => {
        // Reemplazar caracteres no válidos para la fecha
        var valueInputReplace = value.replace(/[^0-9/-]/g, '');
        return valueInputReplace;
    };
}
