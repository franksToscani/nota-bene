// auth.js - Gestione autenticazione e registrazione per NOTA BENE

/**
 * Configurazione API endpoints
 */
const API_CONFIG = {
    BASE_URL: '/api',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout'
    }
};

/**
 * Utility per gestire le richieste HTTP
 */
class ApiClient {
    /**
     * Effettua una richiesta HTTP generica
     */
    static async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: `Errore HTTP ${response.status}` };
                }
                throw new ApiError(errorData.message || 'Errore del server', response.status, errorData);
            }

            try {
                return await response.json();
            } catch (e) {
                return await response.text();
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Errore di connessione. Verifica la tua connessione internet.', 0, error);
        }
    }

    /**
     * Richiesta POST
     */
    static post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

/**
 * Classe personalizzata per gli errori API
 */
class ApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

/**
 * Servizio di autenticazione
 */
class AuthService {
    /**
     * Effettua il login dell'utente
     */
    static async login(credentials) {
        try {
            const response = await ApiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
                nickname: credentials.nickname.trim(),
                password: credentials.password
            });

            if (response.success && response.user) {
                sessionStorage.setItem('isAuthenticated', 'true');
                sessionStorage.setItem('userNickname', response.user.nickname);
            }

            return response;
        } catch (error) {
            console.error('Errore durante il login:', error);
            throw error;
        }
    }

    /**
     * Effettua la registrazione dell'utente
     */
    static async register(userData) {
        try {
            const response = await ApiClient.post(API_CONFIG.ENDPOINTS.REGISTER, {
                email: userData.email.trim().toLowerCase(),
                nickname: userData.nickname.trim(),
                password: userData.password
            });

            return response;
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            throw error;
        }
    }

    /**
     * Verifica se l'utente è autenticato
     */
    static isAuthenticated() {
        return sessionStorage.getItem('isAuthenticated') === 'true';
    }
}

/**
 * Gestore dei form di autenticazione
 */
class AuthFormHandler {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.init();
    }

    /**
     * Inizializza gli event listener
     */
    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        if (this.registerForm) {
            this.registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Verifica se l'utente è già autenticato e reindirizza a home.html
        if (AuthService.isAuthenticated()) {
            window.location.href = '/home';
        }
    }

    /**
     * Gestisce il submit del form di login
     */
    async handleLogin(event) {
        event.preventDefault();

        const submitButton = this.loginForm.querySelector('button[type="submit"]');
        const formData = new FormData(this.loginForm);

        const credentials = {
            nickname: formData.get('nickname'),
            password: formData.get('password')
        };

        try {
            this.setButtonLoading(submitButton, true);
            this.clearMessages();

            const response = await AuthService.login(credentials);

            if (response.success) {
                this.showSuccessMessage('Login effettuato con successo!');
                setTimeout(() => {
                    window.location.href = '/home';
                }, 1000);
            } else {
                this.showError(response.message || 'Credenziali non valide');
            }

        } catch (error) {
            this.handleAuthError(error, 'login');
        } finally {
            this.setButtonLoading(submitButton, false);
        }
    }

    /**
     * Gestisce il submit del form di registrazione
     */
    async handleRegister(event) {
        event.preventDefault();

        const submitButton = this.registerForm.querySelector('button[type="submit"]');
        const formData = new FormData(this.registerForm);

        const userData = {
            email: formData.get('email'),
            nickname: formData.get('nickname'),
            password: formData.get('password')
        };

        try {
            this.setButtonLoading(submitButton, true);
            this.clearMessages();

            const response = await AuthService.register(userData);

            if (response.success) {
                this.showSuccessMessage('Registrazione completata! Reindirizzamento in corso...');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                this.showError(response.message || 'Errore durante la registrazione. Verifica i dati inseriti');
            }

        } catch (error) {
            this.handleAuthError(error, 'register');
        } finally {
            this.setButtonLoading(submitButton, false);
        }
    }

    /**
     * Gestisce gli errori di autenticazione
     */
    handleAuthError(error, type = 'login') {
        if (error instanceof ApiError) {
            if (type === 'login') {
                this.showError('Credenziali non valide');
            } else if (type === 'register') {
                this.showError('Errore durante la registrazione. Verifica i dati inseriti');
            }
        } else {
            this.showError('Errore di connessione. Verifica la tua connessione internet.');
        }
    }

    /**
     * Mostra un messaggio di errore
     */
    showError(message) {
        this.clearMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background-color: #fee;
            border: 1px solid #fcc;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
        `;
        errorDiv.textContent = message;

        const activeForm = document.querySelector('.form-container.active');
        if (activeForm) {
            activeForm.insertBefore(errorDiv, activeForm.querySelector('.auth-form'));
        }
    }

    /**
     * Mostra un messaggio di successo
     */
    showSuccessMessage(message) {
        this.clearMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background-color: #efe;
            border: 1px solid #cfc;
            color: #363;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 14px;
        `;
        successDiv.textContent = message;

        const activeForm = document.querySelector('.form-container.active');
        if (activeForm) {
            activeForm.insertBefore(successDiv, activeForm.querySelector('.auth-form'));
        }
    }

    /**
     * Pulisce tutti i messaggi esistenti
     */
    clearMessages() {
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());
    }

    /**
     * Imposta lo stato di caricamento del bottone
     */
    setButtonLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');

        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            btnText.style.opacity = '0';
            btnLoader.style.display = 'block';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
        }
    }
}

/**
 * Inizializzazione quando il DOM è carico
 */
document.addEventListener('DOMContentLoaded', function() {
    new AuthFormHandler();
});

// Esporta le classi per uso esterno
window.AuthService = AuthService;
window.ApiClient = ApiClient;