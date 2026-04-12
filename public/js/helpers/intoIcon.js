/**
 * Crea un icono a partir de un template
 * @param {string} icon - Nombre del icono
 * @param {object} [options] - Opciones para personalizar
 * @param {string[]} [options.classes=[]] - Clases adicionales para añadir al icono
 * @returns {HTMLElement|null} - El icono generado o null si falla
 */

const intoIcon = (icon, options = {}) => {
    const { classes = [] } = options;
    const iconEl = document.createElement('span');
    iconEl.classList.add('material-symbols-rounded');
    iconEl.dataset.ico = icon;
    if (Array.isArray(classes) && classes.length > 0) {
        const classTrim = classes.map((c) => c.trim());
        iconEl.classList.add(...classTrim.filter((c) => c.trim().length > 0));
    }

    return iconEl;
};

export default intoIcon;
