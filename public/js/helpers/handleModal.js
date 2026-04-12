/**
 * Función que abre un modal
 * @param {HTMLElement} modal Elemento del modal que se desea abrir
 * @returns {void}
 * @example openModal(document.getElementById('miModal'))
 */
const openModal = (modal) => {
    if (!(modal instanceof HTMLElement)) {
        console.error(`El parámetro recibido no es un elemento HTML válido.`);
        return;
    }

    if (modal.getAttribute('aria-hidden') === 'false') return;
    modal.querySelectorAll('[data-state="closed"]').forEach((el) => el.setAttribute('data-state', 'open'));

    modal.classList.remove('hidden');
    modal.removeAttribute('inert');
    modal.setAttribute('tabindex', '-1');
    modal.focus();
};

/**
 * Función que cierra un modal
 * @param {HTMLElement} modal Elemento del modal que se desea cerrar
 * @returns {void}
 * @example closeModal(document.getElementById('miModal'))
 */
const closeModal = (modal, actionCloseModal = () => console.log('Modal Closed')) => {
    if (!(modal instanceof HTMLElement)) {
        console.error(`El parámetro recibido no es un elemento HTML válido.`);
        return;
    }
    modal.querySelectorAll('[data-state="open"]').forEach((el) => el.setAttribute('data-state', 'closed'));
    modal.querySelector('form')?.reset();
    modal.classList.add('hidden');
    modal.setAttribute('inert', '');
    modal.removeAttribute('tabindex');
    if (actionCloseModal) actionCloseModal();
};

export { openModal, closeModal };
