import setupTabs from '../../helpers/setupTabs.js';
import { initStatusBar } from '../../components/statusBar.js';

document.addEventListener('DOMContentLoaded', () => {
    initStatusBar();
    setupTabs('#tabs-shopping');
});
