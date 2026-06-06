export default function setupTabs(
    containerSelector,
    contentPrefix = 'tab-',
    activeClassesBtn = ['bg-red-400', 'text-white'],
    activeClassesTab = [],
    onChange = null,
) {
    const tabGroups =
        typeof containerSelector === 'string' ? document.querySelectorAll(containerSelector) : [containerSelector];

    // Asegurarse de que el prefijo de contenido termina con un guion
    if (!contentPrefix.endsWith('-')) {
        contentPrefix += '-';
    }
    if (tabGroups.length === 0) return;
    tabGroups.forEach((tabGroup) => {
        const buttons = tabGroup.querySelectorAll('button[data-tab]');
        const contents = document.querySelectorAll(`.${contentPrefix}content`);

        if (buttons.length === 0 || contents.length === 0) return;

        const activateTab = (btn) => {
            const module = btn.getAttribute('data-tab');
            const targetId = `${contentPrefix}${module}`;
            const activeTab = document.getElementById(targetId);

            if (!activeTab || btn.disabled) return;

            // Oculta todos los contenidos
            contents.forEach((content) => content.classList.add('hidden'));

            // Resetea estilos de botones
            buttons.forEach((b) => b.classList.remove(...activeClassesBtn));

            // Muestra el contenido correspondiente con animación
            activeTab.classList.remove('hidden');
            activeTab.classList.add('fade-in');
            activeTab.classList.add(...activeClassesTab);
            setTimeout(() => activeTab.classList.remove('fade-in'), 300);

            // Estilo para el botón activo
            const color = btn.dataset.color;
            if (color) {
                btn.classList.add(color);
            } else {
                btn.classList.add(...activeClassesBtn);
            }
            btn.classList.add('text-white');

            // Callback por si quieres hacer algo más
            if (typeof onChange === 'function') {
                onChange(module, activeTab, btn);
            }

            // Guardar en localStorage
            const storageKey = `tabs-${containerSelector}`;
            localStorage.setItem(storageKey, module);

            // Sincronizar query param en URL
            const url = new URL(window.location);
            const current = url.searchParams.get('tab');
            if (current !== module) {
                url.searchParams.set('tab', module);
                window.history.replaceState({}, '', url);
            }
        };

        // Eventos de clic
        buttons.forEach((btn, i) => {
            btn.addEventListener('click', () => activateTab(btn));

            // Soporte para navegación con flechas
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') buttons[(i + 1) % buttons.length].focus();
                if (e.key === 'ArrowLeft') buttons[(i - 1 + buttons.length) % buttons.length].focus();
            });
        });

        // Prioridad de activación: query param > hash > localStorage > first
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const queryBtn = tabParam ? Array.from(buttons).find((b) => b.getAttribute('data-tab') === tabParam) : null;
        if (queryBtn) return activateTab(queryBtn);

        const hash = window.location.hash.replace('#', '');
        const hashBtn = Array.from(buttons).find((b) => b.getAttribute('data-tab') === hash);
        if (hashBtn) return activateTab(hashBtn);

        const saved = localStorage.getItem(`tabs-${containerSelector}`);
        const savedBtn = Array.from(buttons).find((b) => b.getAttribute('data-tab') === saved);
        if (savedBtn) return activateTab(savedBtn);

        // Si nada de eso, activa la primera
        activateTab(buttons[0]);
    });
}
