import { httpClient } from '../../index.js';
import { renderSalesChart } from './charts/salesChart.js';
import { renderOrdersChart } from './charts/ordersChart.js';
import { renderStockChart } from './charts/stockChart.js';
import { renderLowStockChart } from './charts/lowStockChart.js';

const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

const loadCharts = async () => {
    try {
        const range = getDateRange();

        // Ejecutamos todas las promesas en paralelo para mayor velocidad
        await Promise.all([
            renderSalesChart(httpClient, range),
            renderOrdersChart(httpClient, range),
            renderStockChart(httpClient),
            renderLowStockChart(httpClient),
        ]);
    } catch (error) {
        console.error('Error loading charts:', error);
        // Aquí podrás manejar la redirección si no hay sesión (e.g., error 401)
    }
};

const checkSecurityQuestions = async () => {
    const alertEl = document.getElementById('alert-security-questions');
    if (!alertEl) return;

    try {
        const res = await httpClient.get('/questions/user-check');
        if (res?.data?.hasQuestions === false) {
            alertEl.classList.remove('hidden');
            alertEl.classList.add('flex');
        }
    } catch {
        // Silently fail - non-critical
    }
};

document.getElementById('dismiss-security-alert')?.addEventListener('click', () => {
    const alertEl = document.getElementById('alert-security-questions');
    if (alertEl) {
        alertEl.classList.remove('flex');
        alertEl.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadCharts();
    checkSecurityQuestions();
});
