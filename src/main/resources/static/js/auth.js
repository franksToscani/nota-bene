(function () {
    'use strict';

    const isAuthPage = window.location.pathname === '/' || window.location.pathname === '/auth';
    if (!isAuthPage) return;

    async function initAuthPage() {
        if (await redirectIfAuthenticated()) return;

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => 
                handleAuthFormSubmit(e, '/api/auth/login', 'Login effettuato con successo!')
            );
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => 
                handleAuthFormSubmit(e, '/api/auth/register', 'Registrazione completata con successo!')
            );
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthPage);
    } else {
        initAuthPage();
    }
})();