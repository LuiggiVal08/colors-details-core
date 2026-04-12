document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('company-form');

    const img = form.querySelector('img');
    const inputImg = form.querySelector('input[type="file"]');
    const imgDefault = form.querySelector('img[data-img-default]');
    const info = document.getElementById('infoArchivo');
    inputImg.addEventListener('change', (e) => {
        const input = e.target;
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => (img.src = e.target.result);
            reader.readAsDataURL(file);

            info.innerHTML = `
                <strong>Nombre:</strong> ${file.name}<br>
                <strong>Tamaño:</strong> ${(file.size / 1024).toFixed(2)} KB<br>
                <strong>Tipo:</strong> ${file.type}
                `;
        } else {
            img.src = imgDefault.getAttribute('data-img-default');
            info.innerHTML = '';
        }
    });
});
