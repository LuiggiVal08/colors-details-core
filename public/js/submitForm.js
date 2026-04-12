import clearForm from './helpers/clearForm.js';
import showToast from './helpers/Toast.js';
import { validForm } from './helpers/validForm.js';
import submitData from './submitData.js';

export const submitForm = async (e) => {
    e.preventDefault();
    const form = e.target;
    const messageSuccess = form.dataset.message ?? 'Proceso realizado con éxito';
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    const url = new URL(form.action).pathname;
    const method = form.dataset.method ?? form.method;
    const { isValid, formData } = validForm(form.elements, form.enctype);
    console.log(formData);

    if (!isValid || !formData) {
        showToast({ title: 'Error', message: 'Formulario no válido', type: 'error', duration: 5000 });
        submitButton.disabled = false;
        return;
    }

    // Función que se ejecuta al enviar el formulario
    const cancelSubmit = () => (submitButton.disabled = false);

    const submited = async () => {
        const formSubmitted = await submitData(url, method, formData);
        if (formSubmitted) {
            clearForm(form);
            submitButton.disabled = false;

            if (form.dataset.noreload) return;

            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            cancelSubmit();
            return;
        }
    };

    const role = await cookieStore.get('role');
    if (role && role.value === 'admin') {
        // openModalConfirm(() => setTokenHandler(submited, cancelSubmit), cancelSubmit);
        submited();
        return;
    }
    if (url !== '/auth/login') return submited();
    else return submited();
};
