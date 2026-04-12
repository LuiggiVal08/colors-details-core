const handleDropdown = (btn, dropdown) => {
    btn.addEventListener('click', () => {
        dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (event) => {
        if (!btn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });
};

export default handleDropdown;
