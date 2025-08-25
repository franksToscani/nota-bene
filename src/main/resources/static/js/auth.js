// auth.js - Gestione autenticazione (solo per pagine di login/register)

(function () {
    'use strict';

    // Verifica se siamo sulla pagina di autenticazione
    const isAuthPage = window.location.pathname === '/' || window.location.pathname === '/auth';

    if (!isAuthPage) {
        // Non eseguire nulla se non siamo sulla pagina di autenticazione
        return;
    }

    /**
     * Verifica se l'utente è già autenticato
     */
    async function checkIfAlreadyAuthenticated() {
        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    // Utente già autenticato, reindirizza alla home
                    window.location.href = '/home';
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Errore durante il controllo autenticazione:', error);
            return false;
        }
    }

    /**
     * Gestisce il submit del form di login
     */
    async function handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.btn-text');
        const buttonLoader = submitButton.querySelector('.btn-loader');
        
        // Disabilita il form durante il submit
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'block';

        try {
            const formData = new FormData(form);
            const loginData = {
                nickname: formData.get('nickname'),
                password: formData.get('password')
            };

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login riuscito
                showNotification('Login effettuato con successo!', 'success');
                // Attendi un momento prima del redirect per mostrare il messaggio
                setTimeout(() => {
                    window.location.href = '/home';
                }, 1000);
            } else {
                // Login fallito
                showNotification(data.message || 'Errore durante il login', 'error');
            }

        } catch (error) {
            console.error('Errore durante il login:', error);
            showNotification('Errore di connessione', 'error');
        } finally {
            // Riabilita il form
            submitButton.disabled = false;
            buttonText.style.display = 'inline';
            buttonLoader.style.display = 'none';
        }
    }

    /**
     * Gestisce il submit del form di registrazione
     */
    async function handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.btn-text');
        const buttonLoader = submitButton.querySelector('.btn-loader');
        
        // Disabilita il form durante il submit
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'block';

        try {
            const formData = new FormData(form);
            const registerData = {
                email: formData.get('email'),
                nickname: formData.get('nickname'),
                password: formData.get('password')
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(registerData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Registrazione riuscita
                showNotification('Registrazione completata con successo!', 'success');
                // Attendi un momento prima del redirect per mostrare il messaggio
                setTimeout(() => {
                    window.location.href = '/home';
                }, 1000);
            } else {
                // Registrazione fallita
                showNotification(data.message || 'Errore durante la registrazione', 'error');
            }

        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            showNotification('Errore di connessione', 'error');
        } finally {
            // Riabilita il form
            submitButton.disabled = false;
            buttonText.style.display = 'inline';
            buttonLoader.style.display = 'none';
        }
    }

    /**
     * Mostra una notifica all'utente
     */
    function showNotification(message, type = 'info') {
        // Rimuovi eventuali notifiche precedenti
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        // Aggiungi gli stili per i colori
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-success { background-color: #16a34a; }
            .notification-error { background-color: #dc2626; }
            .notification-info { background-color: #2563eb; }
        `;
        if (!document.head.querySelector('style[data-notifications]')) {
            style.setAttribute('data-notifications', '');
            document.head.appendChild(style);
        }

        if (type === 'success') {
            notification.style.backgroundColor = '#16a34a';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc2626';
        } else {
            notification.style.backgroundColor = '#2563eb';
        }

        document.body.appendChild(notification);

        // Rimuovi la notifica dopo 4 secondi
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    /**
     * Inizializza la pagina di autenticazione
     */
    async function initAuthPage() {
        // Controlla se l'utente è già autenticato
        const alreadyAuthenticated = await checkIfAlreadyAuthenticated();
        if (alreadyAuthenticated) {
            return; // Il reindirizzamento è già stato fatto
        }

        // Configura gli event listeners per i form
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        }

        // I tab switcher sono già gestiti nell'HTML
        console.log('Pagina di autenticazione inizializzata');
    }

    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthPage);
    } else {
        initAuthPage();
    }

})();