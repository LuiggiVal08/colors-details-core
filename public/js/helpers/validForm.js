import { validateInputElement } from './validateInput.js';

export const validForm = (elements, enctype) => {
    const isMultipart = enctype === 'multipart/form-data';
    const formData = isMultipart ? new FormData() : {};
    let isValid = true;

    const tempArrayData = {}; // Temporal para manejar los arrays (detalles[])

    Array.from(elements).forEach((element) => {
        if (!element.name || element.type === 'submit' || element.type === 'button') return;

        const name = element.name;
        const value = element.type === 'checkbox' ? element.checked : element.value;

        // 1. Validar el campo
        const isFieldValid = validateInputElement(element);
        if (!isFieldValid) isValid = false;

        // 2. Manejo especial para multipart
        if (isMultipart) {
            if (element.type === 'file' && element.files.length > 0) {
                formData.append(name, element.files[0]);
            } else {
                formData.append(name, value);
            }
            return;
        }

        // 3. 🧠 Si tiene formato tipo detalles[][campo]
        const match = name.match(/^([a-zA-Z0-9_]+)\[\]\[([a-zA-Z0-9_]+)\]$/);

        if (match) {
            const [_, arrayName, field] = match;

            if (!tempArrayData[arrayName]) tempArrayData[arrayName] = [];

            // Buscar el índice actual para este campo en base al orden de aparición
            let currentIndex = tempArrayData[arrayName].length - 1;

            // Si el último objeto ya tiene este campo, creamos uno nuevo
            if (currentIndex < 0 || tempArrayData[arrayName][currentIndex][field] !== undefined) {
                tempArrayData[arrayName].push({});
                currentIndex++;
            }

            tempArrayData[arrayName][currentIndex][field] = value;
        } else {
            // 4. Campo simple
            formData[name] = value;
        }
    });

    // 5. Unir los datos del array al formData
    if (!isMultipart) {
        for (const key in tempArrayData) {
            formData[key] = tempArrayData[key];
        }
    }

    return { isValid, formData };
};
