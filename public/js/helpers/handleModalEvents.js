import { openModal, closeModal } from './handleModal.js';

export const setupModalLifecycle = (modalElement, onConfirm = () => {}, onCancel = () => {}) => {
    const confirmButton = modalElement.querySelector('[data-confirm="modal"]');
    const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');

    const closeAndCleanup = () => {
        closeModal(modalElement);
        modalElement.removeEventListener('click', handleBackdropClick);
        closeButtons.forEach((btn) => btn.removeEventListener('click', handleDismissClick));
        if (confirmButton) confirmButton.removeEventListener('click', handleConfirmClick);
        document.removeEventListener('keydown', handleEscapeKey);
        onCancel();
    };

    const handleBackdropClick = (event) => {
        if (event.target === modalElement) closeAndCleanup();
    };
    const handleDismissClick = () => closeAndCleanup();
    const handleConfirmClick = () => {
        const form = modalElement.querySelector('form');
        if (form && !form.reportValidity()) return;
        onConfirm();
        closeAndCleanup();
    };
    const handleEscapeKey = (event) => {
        if (event.key === 'Escape') closeAndCleanup();
    };

    modalElement.addEventListener('click', handleBackdropClick);
    closeButtons.forEach((btn) => btn.addEventListener('click', handleDismissClick));
    // if (confirmButton) confirmButton.addEventListener('click', handleConfirmClick);
    document.addEventListener('keydown', handleEscapeKey);

    openModal(modalElement);
};
