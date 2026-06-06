import handleDropdown from '/js/helpers/handleDropdown.js';
import { httpClient } from '/js/index.js';

const btnProfile = document.getElementById('btn-profile');
const profileDropdown = document.getElementById('profile-dropdown');
if (btnProfile && profileDropdown) {
    handleDropdown(btnProfile, profileDropdown);
}

const logoutBtn = document.getElementById('logout-btn-aside');
logoutBtn?.addEventListener('click', async () => {
    await httpClient.delete('/user/logout');
    location.reload();
});
