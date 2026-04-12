import setupTabs from '../../helpers/setupTabs.js';

document.addEventListener('DOMContentLoaded', () => {
    setupTabs('#tabs-settings'); // selector del contenedor donde están los botones
    setupTabs('#tabs-db-export', 'tab-db-', ['!bg-red-400', 'text-white'], ['flex']);
});
