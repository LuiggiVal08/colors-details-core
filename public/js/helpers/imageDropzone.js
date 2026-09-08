const setupImageDropzone = (dropzone, options = {}) => {
    if (!dropzone) return { clear: () => {}, setPreview: () => {} };

    const input = dropzone.querySelector('[data-dropzone-input]');
    const preview = dropzone.querySelector('[data-dropzone-preview]');
    const clearBtn = dropzone.querySelector('[data-dropzone-clear]');
    const placeholder = dropzone.querySelector('[data-dropzone-placeholder]');

    const showSelected = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        if (preview.src) URL.revokeObjectURL(preview.src);
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
        clearBtn.classList.remove('hidden');
        placeholder?.classList.add('hidden');
        options.onSelect?.();
    };

    const clear = () => {
        if (input?.files.length) {
            input.value = '';
            const dt = new DataTransfer();
            input.files = dt.files;
        }
        if (preview.src) URL.revokeObjectURL(preview.src);
        preview.removeAttribute('src');
        preview.classList.add('hidden');
        clearBtn.classList.add('hidden');
        placeholder?.classList.remove('hidden');
        options.onClear?.();
    };

    const setPreview = (url) => {
        if (!url) return;
        preview.src = url;
        preview.classList.remove('hidden');
        clearBtn.classList.remove('hidden');
        placeholder?.classList.add('hidden');
    };

    const toggleActive = (active) => {
        dropzone.classList.toggle('dropzone-active', active);
    };

    dropzone.addEventListener('click', (e) => {
        if (e.target.closest('[data-dropzone-clear]')) {
            clear();
            return;
        }
        input?.click();
    });

    ['dragenter', 'dragover'].forEach((evt) =>
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            toggleActive(true);
        }),
    );
    ['dragleave', 'dragend', 'drop'].forEach((evt) =>
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            toggleActive(false);
        }),
    );

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        const dt = new DataTransfer();
        dt.items.add(file);
        if (input) input.files = dt.files;
        showSelected(file);
    });

    input?.addEventListener('change', () => showSelected(input.files[0]));

    return { clear, setPreview };
};

export default setupImageDropzone;