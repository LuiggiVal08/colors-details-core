import { changeTypeInputPassword, httpClient } from '../index.js';
import { Format } from '../helpers/Format.js';
import showToast from '../helpers/Toast.js';
import { validForm } from '../helpers/validForm.js';

const progressBar = document.getElementById('progressBar');
const stepText = progressBar.querySelector('[data-step]');
const progressText = progressBar.querySelector('[data-progress]');
const barProgress = progressBar.querySelector('[data-bar-progress]');

const cards = Array.from(document.querySelectorAll('[data-step-card]'));
const prevButtons = document.querySelectorAll('[data-prev-step]');

// ---------- State ----------

let currentStep = 0;
const totalSteps = cards.length;

// ---------- Helpers ----------
const renderStep = () => {
    // Cards
    cards.forEach((card, index) => {
        card.classList.toggle('active', index === currentStep);
    });

    // Texto
    stepText.textContent = `Paso ${currentStep + 1} de ${totalSteps}`;

    const percent = Math.round(((currentStep + 1) / totalSteps) * 100);
    progressText.textContent = `${percent}% completado`;

    // Barra
    barProgress.style.transform = `translateX(-${100 - percent}%)`;
};

const nextStep = () => {
    if (currentStep < totalSteps - 1) {
        currentStep++;
        renderStep();
    }
};

const prevStep = () => {
    if (currentStep > 0) {
        currentStep--;
        renderStep();
    }
};

prevButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); // 🔴 CRÍTICO
        prevStep();
    });
});
// ---------- Init ----------
renderStep();

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

        return true;
    } catch (err) {
        console.error(err);
        showToast({ title: 'Error', message: 'Ocurrió un error inesperado', type: 'error', duration: 5000 });
        return false;
    }
};

const formUsername = document.getElementById('form-username');
const formQuestions = document.getElementById('form-questions');
const formPassword = document.getElementById('form-password');
Format.formatEventInput(formUsername);
formUsername.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('[type="submit"]');
    // submitButton.disabled = true;

    const method = form.dataset.method ?? form.method;

    const url = new URL(form.action).pathname;

    if (!form || !form.action || !method) return;

    const { isValid, formData } = validForm(form.elements, form.enctype);

    if (!isValid || !formData) {
        showToast({ title: 'Error', message: 'Formulario no válido', type: 'error', duration: 5000 });
        return;
    }
    try {
        const response = await httpClient[method.toLowerCase() ?? 'post'](url, formData);
        const { error, status, message, data } = response || {};

        if (error && error.isError) {
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
            return;
        }
        const questions = Array.isArray(data.preguntas_seguridad) ? [...data.preguntas_seguridad] : [];

        // Mezclar aleatoriamente (Fisher-Yates)
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        // Tomar solo las primeras 2
        const randomTwo = questions.slice(0, 2);

        if (randomTwo.length === 0) {
            showToast({
                title: 'Error',
                message: 'No se pudieron obtener las preguntas de seguridad',
                type: 'error',
                duration: 5000,
            });
            return false;
        }

        const questionsContainer = document.getElementById('questions');
        questionsContainer.innerHTML = '';
        const template = document.getElementById('question-template');

        randomTwo.forEach((question) => {
            const questionElement = template.content.cloneNode(true);

            const questionLabel = questionElement.querySelector('[data-question]');
            const answerInput = questionElement.querySelector('[data-answer]');

            questionLabel.textContent = question.pregunta;
            answerInput.value = '';
            answerInput.name = '[question]' + question.id;

            questionsContainer.appendChild(questionElement);
        });
        formQuestions.dataset.id = data.user_id; // Guardamos el user_id en un atributo data del formulario
        Format.formatEventInput(formQuestions);
        nextStep();
        changeTypeInputPassword();
    } catch (err) {
        console.error(err);
        showToast({ title: 'Error', message: 'Ocurrió un error inesperado', type: 'error', duration: 5000 });
    }
});
formQuestions.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    const submitButton = form.querySelector('[type="submit"]');
    // submitButton.disabled = true;

    const method = (form.dataset.method ?? form.method).toLowerCase();
    const url = new URL(form.action, window.location.origin).pathname;

    const { isValid, formData } = validForm(form.elements, form.enctype);

    if (!isValid || !formData) {
        showToast({ title: 'Error', message: 'Formulario no válido', type: 'error', duration: 5000 });
        submitButton.disabled = false; // Importante: rehabilitar si falla
        return;
    }

    // --- TRANSFORMACIÓN A ARRAY ---
    const payload = Object.entries(formData).map(([key, value]) => {
        const idMatch = key.match(/\d+/);
        return {
            question_id: idMatch ? parseInt(idMatch[0]) : key,
            answer: value,
        };
    });

    try {
        // Enviamos el payload como un objeto que contiene el array
        const response = await httpClient[method](`${url}${formQuestions.dataset.id}`, { answers: payload });

        const { error, status, message, data } = response || {};

        if (error && error.isError) {
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
            return;
        }
        showToast({
            title: 'Éxito',
            message: data.success ? message : '',
            type: 'success',
        });
        nextStep();
        formPassword.dataset.id = formQuestions.dataset.id; // Pasamos el user_id al siguiente formulario
    } catch (err) {
        console.error(err);
        showToast({ title: 'Error', message: 'Error de red inesperado', type: 'error' });
        submitButton.disabled = false;
        return false;
    }
});
formPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    const submitButton = form.querySelector('[type="submit"]');
    // submitButton.disabled = true;

    const method = form.dataset.method ?? form.method;
    const url = new URL(form.action).pathname;

    if (!form || !form.action || !method) return;

    const { isValid, formData } = validForm(form.elements, form.enctype);

    if (!isValid || !formData) {
        showToast({ title: 'Error', message: 'Formulario no válido', type: 'error', duration: 5000 });
        return;
    }
    try {
        const response = await httpClient[method.toLowerCase() ?? 'post'](`${url}${formPassword.dataset.id}`, formData);
        const { error, status, message, data } = response || {};

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
        showToast({
            title: 'Éxito',
            message: message,
            type: 'success',
        });
        nextStep();
        return true;
    } catch (err) {
        console.error(err);
        showToast({ title: 'Error', message: 'Ocurrió un error inesperado', type: 'error', duration: 5000 });
        return false;
    }
});
