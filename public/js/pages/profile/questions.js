import { Format } from '../../helpers/Format.js';
import showToast from '../../helpers/Toast.js';
import { validForm } from '../../helpers/validForm.js';
import { httpClient } from '../../index.js';

const template = document.getElementById('template-pregunta');
const container = document.getElementById('preguntas-container');
const formValidUser = document.getElementById('form-valid-user');
const formValidQuestions = document.getElementById('form-valid-questions');
const btnCancel = document.getElementById('btn-cancel-questions');

let allQuestions = []; // Para guardar el catálogo del API

// 1. Cargar catálogo de preguntas
const queryQuestions = async () => {
    if (allQuestions.length > 0) return allQuestions;
    const response = await httpClient.get('/questions');
    if (response?.error) {
        showToast({ title: 'Error', message: response.message, type: 'error' });
        return [];
    }
    allQuestions = response.data;
    return allQuestions;
};

// 2. Lógica de Filtrado Dinámico (Proactiva)
// Esta función oculta las preguntas que ya están seleccionadas en otros campos
const refreshSelects = () => {
    const selects = container.querySelectorAll('select');

    // Obtenemos los valores seleccionados actualmente (ignorando el vacío)
    const selectedValues = Array.from(selects)
        .map((s) => s.value)
        .filter((v) => v !== '');

    selects.forEach((currentSelect) => {
        const options = currentSelect.querySelectorAll('option');

        options.forEach((option) => {
            if (option.value === '') return; // Saltamos la opción por defecto

            // Si la opción está en uso por OTRO select, la ocultamos/deshabilitamos
            const isSelectedElsewhere = selectedValues.includes(option.value) && currentSelect.value !== option.value;

            if (isSelectedElsewhere) {
                option.disabled = true;
                option.style.display = 'none';
            } else {
                option.disabled = false;
                option.style.display = 'block';
            }
        });
    });
};

// 3. Función para insertar una pregunta (nueva o existente)
const insertQuestionRow = (index, existingData = null) => {
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector('div');
    const select = clone.querySelector('select');
    const input = clone.querySelector('input');
    // const btnRemove = clone.querySelector('[data-ico="close"]');

    // Estructura clave: preguntas[0][id], preguntas[0][respuesta]
    select.name = `preguntas[${index}][pregunta_id]`;
    input.name = `preguntas[${index}][respuesta]`;

    // Llenar el select con el catálogo
    allQuestions.forEach((q) => {
        const option = document.createElement('option');
        option.value = q.id;
        option.textContent = q.pregunta;
        if (existingData && q.id == existingData.id_pregunta) option.selected = true;
        select.appendChild(option);
    });

    // Si existe data previa, podemos guardar el ID actual en un data-attribute
    // por si necesitas lógica extra, pero con el 'name' indexado basta.
    if (existingData) {
        console.log('Existing Data:', existingData);
        select.value = existingData.pregunta_id || '';

        input.placeholder = '******** (Escribe para cambiar)';
        // Ojo: Si es edición, el usuario DEBE escribir algo si cambia la pregunta.
    }

    select.addEventListener('change', refreshSelects);

    // btnRemove.addEventListener('click', () => {
    //     row.remove();
    // });
    reindexInputs(); // ¡NUEVA FUNCIÓN!
    refreshSelects();

    container.appendChild(clone);
};

// Función para que los índices [0], [1], [2] siempre sean correctos si borras uno intermedio
const reindexInputs = () => {
    const rows = container.querySelectorAll('.relative'); // Tu contenedor de fila
    rows.forEach((row, idx) => {
        row.querySelector('select').name = `preguntas[${idx}][pregunta_id]`;
        row.querySelector('input').name = `preguntas[${idx}][respuesta]`;
    });
};

// 4. Validar usuario y mostrar preguntas
formValidUser.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { isValid, formData } = validForm(e.target.elements, e.target.enctype);
    if (!isValid) return;

    const response = await httpClient.post(new URL(e.target.action).pathname, formData);

    if (response?.error) {
        showToast({ title: 'Error', message: response.message, type: 'error' });
        return;
    }

    // Éxito: Ocultar validación y mostrar preguntas
    formValidUser.classList.add('hidden');
    formValidQuestions.classList.remove('hidden');

    await queryQuestions();
    container.innerHTML = '';

    const userQuestions = response.data.questionsUser || [];

    // Insertamos 3 bloques
    for (let i = 0; i < 3; i++) {
        insertQuestionRow(i, userQuestions[i] || null);
    }

    // Ejecutar filtrado inicial para datos existentes
    refreshSelects();
});

// 5. Botón Cancelar
btnCancel.addEventListener('click', () => {
    formValidQuestions.classList.add('hidden');
    formValidUser.classList.remove('hidden');
    formValidUser.reset();
});

Format.formatEventInput(formValidUser);
Format.formatEventInput(formValidQuestions);

formValidQuestions.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Extraemos los datos agrupándolos manualmente en un Array
    const preguntasArray = [];

    // Buscamos cada bloque de pregunta dentro del contenedor
    // Nota: Asegúrate que tu template tenga la clase 'flex-row' en el div principal
    const rows = container.querySelectorAll('.flex-row');

    rows.forEach((row) => {
        const selectElement = row.querySelector('select');
        const inputElement = row.querySelector('input');

        const pregunta_id = selectElement ? selectElement.value : null;
        const respuesta = inputElement ? inputElement.value : '';

        // Solo agregamos si tienen contenido
        if (pregunta_id && respuesta.trim() !== '') {
            preguntasArray.push({
                pregunta_id: pregunta_id,
                respuesta: respuesta.trim(),
            });
        }
    });

    // 2. Validación: Forzamos a que sean 3
    if (preguntasArray.length < 3) {
        showToast({
            title: 'Atención',
            message: 'Debes configurar las 3 preguntas de seguridad para mayor seguridad.',
            type: 'warning',
        });
        return;
    }

    // 3. Envío al servidor como JSON limpio
    const url = new URL(e.target.action).pathname;
    const response = await httpClient.post(url, { preguntas: preguntasArray });

    if (response?.error) {
        showToast({ title: 'Error', message: response.message, type: 'error' });
        return;
    }

    // 4. Éxito y Reset de la interfaz
    showToast({ title: 'Éxito', message: 'Preguntas de seguridad actualizadas', type: 'success' });

    formValidQuestions.classList.add('hidden');
    formValidUser.classList.remove('hidden');

    // Limpiamos todo para la próxima vez
    formValidUser.reset();
    e.target.reset();
    container.innerHTML = '';
}); // <-- Aquí estaba el error de cierre ;)
