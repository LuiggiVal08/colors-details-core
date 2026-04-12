import { openModal, closeModal } from '../helpers/handleModal.js';
import showToast from '../helpers/Toast.js';

/**
 * Función que abre un modal
 * @param {Object} [actionModal={}] Objeto con la configuración del modal
 * @returns {void}
 */
const modalConfirm = (actionModal = {}) => {
    const template = document.getElementById('template-modal-confirm');
    if (!template) {
        console.error(`El template con ID template-modal-confirm no existe en el DOM.`);
        return;
    }
    const clone = template.content.cloneNode(true);
    const modal = clone.querySelector('div[tabindex="-1"]');

    if (!modal) {
        console.error(`El modal con ID modal-confirm no existe en el DOM.`);
        return;
    }

    modal.querySelector('h2').textContent = actionModal.title;
    modal.querySelector('[role="dialog"]').textContent = actionModal.message;
    modal.querySelector('[data-confirm="modal"]').textContent = actionModal.confirmText;

    const modalContainer = document.getElementById('popup');

    if (!modalContainer) {
        console.error(`El contenedor del modal con ID popup no existe en el DOM.`);
        return;
    }

    modalContainer.appendChild(modal);

    const {
        closeAction = () => console.log('Modal Closed'),
        confirmAction = () => console.log('Confirmed'),
        ...rest
    } = actionModal;

    openModal(modal);

    const handleBackdropClick = (event) => {
        if (modal === event.target) closeAndCleanup();
    };

    const handleDismissClick = () => closeAndCleanup();

    const handleConfirmClick = () => {
        closeAndCleanup();
        confirmAction();
    };

    // === FUNCION para cerrar y limpiar ===
    const closeAndCleanup = () => {
        modal.remove();
        closeModal(modal, closeAction);
        modal.removeEventListener('click', handleBackdropClick);
        closeButtons.forEach((button) => button.removeEventListener('click', handleDismissClick));
        if (confirmButton) confirmButton.removeEventListener('click', handleConfirmClick);
    };

    modal.addEventListener('click', handleBackdropClick);

    const closeButtons = modal.querySelectorAll('[data-dismiss="modal"]');
    closeButtons.forEach((button) => button.addEventListener('click', handleDismissClick));

    const confirmButton = modal.querySelector('[data-confirm="modal"]');
    if (confirmButton) confirmButton.addEventListener('click', handleConfirmClick);
};

document.getElementById('open-modal')?.addEventListener('click', (event) => {
    modalConfirm({
        title: 'Confirmar Acción',
        message: 'Are you sure you want to proceed?',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmAction: () => console.log('Confirm Action'),
        closeAction: () => console.log('Modal Closed'),
    });
});
