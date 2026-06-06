import { initPeriods } from './periods.js';
import { initPayments } from './payments.js';

document.addEventListener('DOMContentLoaded', () => {
    const locationPage = location.href;
    const id = locationPage.split('/').pop();

    try {
        initPeriods(id);
    } catch (err) {
        console.warn('No se pudo inicializar periods', err);
    }
    try {
        initPayments(id);
    } catch (err) {
        console.warn('No se pudo inicializar payments', err);
    }
});
