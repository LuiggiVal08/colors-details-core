const clearForm = (form) => {
    if (typeof form === 'string') {
        form = document.querySelector(form);
    }

    if (!form || !(form instanceof HTMLFormElement)) {
        console.error('El formulario no es válido.');
        return;
    }

    form.querySelectorAll('input, select, textarea').forEach((campo) => {
        switch (campo.type) {
            case 'text':
            case 'password':
            case 'email':
            case 'number':
            case 'tel':
            case 'url':
            case 'search':
            case 'date':
            case 'time':
            case 'datetime-local':
            case 'month':
            case 'week':
            case 'color':
                campo.value = '';
                break;
            case 'checkbox':
            case 'radio':
                campo.checked = false;
                break;
            case 'select-one':
                campo.selectedIndex = 0;
                break;
            case 'select-multiple':
                campo.querySelectorAll('option').forEach((option) => {
                    option.selected = false;
                });
                break;
            case 'textarea':
                campo.value = '';
                break;
            default:
                break;
        }
    });
};
export default clearForm;
