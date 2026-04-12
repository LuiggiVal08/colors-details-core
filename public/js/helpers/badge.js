/**
 * Crea un badge a partir de un template
 * @param {string} content - Contenido del badge (texto o HTML)
 * @param {object} [options] - Opciones para personalizar
 * @param {boolean} [options.html=false] - Si es true, el contenido se mete como HTML
 * @param {string[]} [options.classes=[]] - Clases adicionales para añadir al badge
 * @returns {HTMLElement|null} - El badge generado o null si falla
 */
const badge = (content, options = {}) => {
    const { html = false, classes = [] } = options;

    const template = document.getElementById('template-badge');
    if (!template) {
        console.error('No se encontró el template con ID: template-badge');
        return null;
    }

    const badgeEl = template.content.firstElementChild.cloneNode(true);
    badgeEl.classList.add('flex', 'items-center', 'gap-2');
    if (html) {
        badgeEl.appendChild(content);
    } else {
        badgeEl.textContent = content;
    }

    if (Array.isArray(classes) && classes.length > 0) {
        const classTrim = classes.map((c) => c.trim());
        badgeEl.classList.add(...classTrim.filter((c) => c.trim().length > 0));
    }

    return badgeEl;
};

export default badge;
