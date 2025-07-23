/**
 * NOTA BENE - Authentication Standalone
 * Versione completa senza import - funziona con <script src="auth.js">
 */

// ========================================
// CONFIGURAZIONE SUPABASE
// ========================================

// Carica Supabase da CDN globalmente
const SUPABASE_URL = 'https://ijdurgjffeyrxdwhrqcx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHVyZ2pmZmV5cnhkd2hycWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjYxNTAsImV4cCI6MjA2ODcwMjE1MH0.1487fkHcRhhC6pabOEQEE1BrV1PXjZHrQTP-rv_qJYQ';

// Inizializza Supabase client (sarà disponibile dopo il caricamento della libreria)
let supabase;

// ========================================
// UTILITIES
// ========================================

/**
 * Hash password con SHA-256
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Logging utility
 */
function log(message, data = null) {
    console.log(`🔐 [Auth]: ${message}`, data || '');
}

// ========================================
// AUTH MANAGER
// ========================================

class SimpleAuthManager {
    constructor() {
        this.currentForm = 'login';
        this.elements = {};
        this.isInitialized = false;
    }

    /**
     * Inizializzazione
     */
    async init() {
        if (this.isInitialized) return;

        log('Inizializzazione SimpleAuthManager...');

        // Attendi che Supabase sia disponibile
        await this.waitForSupabase();

        this.cacheElements();
        this.attachEventListeners();
        this.isInitialized = true;

        log('SimpleAuthManager inizializzato ✅');
    }

    /**
     * Attende che Supabase sia caricato dal CDN
     */
    async waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 50; // 5 secondi max

        while (!window.supabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            log('Supabase client inizializzato ✅');
        } else {
            throw new Error('Supabase non disponibile');
        }
    }

    /**
     * Cache elementi DOM
     */
    cacheElements() {
        // Toggle tabs
        this.elements.loginTab = document.getElementById('login-tab');
        this.elements.registerTab = document.getElementById('register-tab');

        // Form containers
        this.elements.loginForm = document.getElementById('login-form');
        this.elements.registerForm = document.getElementById('register-form');

        // Forms
        this.elements.loginFormElement = document.getElementById('loginForm');
        this.elements.registerFormElement = document.getElementById('registerForm');

        // Login inputs
        this.elements.loginNickname = document.getElementById('login-nickname');
        this.elements.loginPassword = document.getElementById('login-password');

        // Register inputs
        this.elements.registerEmail = document.getElementById('register-email');
        this.elements.registerNickname = document.getElementById('register-nickname');
        this.elements.registerPassword = document.getElementById('register-password');

        // Submit buttons
        this.elements.loginSubmitBtn = this.elements.loginFormElement.querySelector('.auth-btn');
        this.elements.registerSubmitBtn = this.elements.registerFormElement.querySelector('.auth-btn');
    }

    /**
     * Event listeners
     */
    attachEventListeners() {
        // Toggle tabs
        this.elements.loginTab.addEventListener('click', () => this.switchForm('login'));
        this.elements.registerTab.addEventListener('click', () => this.switchForm('register'));

        // Form submissions
        this.elements.loginFormElement.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.registerFormElement.addEventListener('submit', (e) => this.handleRegister(e));

        log('Event listeners collegati ✅');
    }

    /**
     * Switch tra form login e registrazione
     */
    switchForm(formType) {
        log(`Switch al form: ${formType}`);

        this.currentForm = formType;

        // Update tabs
        this.elements.loginTab.classList.toggle('active', formType === 'login');
        this.elements.registerTab.classList.toggle('active', formType === 'register');

        // Update form containers
        this.elements.loginForm.classList.toggle('active', formType === 'login');
        this.elements.registerForm.classList.toggle('active', formType === 'register');

        // Clear messages
        this.clearMessages();

        // Focus sul primo input
        setTimeout(() => {
            if (formType === 'login') {
                this.elements.loginNickname.focus();
            } else {
                this.elements.registerEmail.focus();
            }
        }, 150);
    }

    /**
     * 🆕 REGISTRAZIONE - Inserimento in tabella Utente
     */
    async handleRegister(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const registerData = {
            email: formData.get('email').trim(),
            nickname: formData.get('nickname').trim(),
            password: formData.get('password')
        };

        // Validazione base
        if (!this.validateRegisterData(registerData)) {
            return;
        }

        // UI loading
        this.setLoadingState(this.elements.registerSubmitBtn, true);

        try {
            log('🔄 Tentativo registrazione...', {
                email: registerData.email,
                nickname: registerData.nickname
            });

            // Hash della password
            const hashedPassword = await hashPassword(registerData.password);

            // 🎯 INSERIMENTO nella tabella Utente con Email come PK
            const { data, error } = await supabase
                .from('Utente')  // Nome tabella esatto
                .insert([{
                    Email: registerData.email,        // PK
                    Nickname: registerData.nickname,  // Campo text
                    Password: hashedPassword           // Campo text hashato
                }])
                .select();

            if (error) {
                throw error;
            }

            log('✅ Registrazione completata con successo!', data);

            // Success feedback
            this.showSuccessMessage('Account creato con successo! ✅');

            // Reset form
            this.elements.registerFormElement.reset();

            // Switch a login dopo 2 secondi
            setTimeout(() => {
                this.switchForm('login');
                // Pre-compila nickname
                this.elements.loginNickname.value = registerData.nickname;
                this.elements.loginPassword.focus();
            }, 2000);

        } catch (error) {
            log('❌ Errore durante registrazione:', error);
            this.showErrorMessage(this.getErrorMessage(error));
        } finally {
            this.setLoadingState(this.elements.registerSubmitBtn, false);
        }
    }

    /**
     * 🔐 LOGIN - Ricerca per Nickname e controllo Password
     */
    async handleLogin(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const loginData = {
            nickname: formData.get('nickname').trim(),
            password: formData.get('password')
        };

        // Validazione base
        if (!this.validateLoginData(loginData)) {
            return;
        }

        // UI loading
        this.setLoadingState(this.elements.loginSubmitBtn, true);

        try {
            log('🔄 Tentativo login...', { nickname: loginData.nickname });

            // Hash della password per confronto
            const hashedPassword = await hashPassword(loginData.password);

            // 🔍 RICERCA nella tabella Utente per Nickname e Password
            const { data, error } = await supabase
                .from('Utente')
                .select('Email, Nickname')  // Seleziona solo campi necessari (non password)
                .eq('Nickname', loginData.nickname)
                .eq('Password', hashedPassword);

            if (error) {
                throw error;
            }

            if (data.length === 0) {
                throw new Error('Credenziali non valide');
            }

            const user = data[0];
            log('✅ Login completato con successo!', {
                email: user.Email,
                nickname: user.Nickname
            });

            // Salva dati utente nel localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                email: user.Email,
                nickname: user.Nickname
            }));
            localStorage.setItem('isLoggedIn', 'true');

            // Success feedback
            this.showSuccessMessage('Accesso effettuato! Reindirizzamento... ✅');

            // Redirect dopo 1.5 secondi
            setTimeout(() => {
                window.location.href = 'dashboard.html';  // O la pagina principale
            }, 1500);

        } catch (error) {
            log('❌ Errore durante login:', error);
            this.showErrorMessage(this.getErrorMessage(error));
        } finally {
            this.setLoadingState(this.elements.loginSubmitBtn, false);
        }
    }

    /**
     * Validazione dati registrazione
     */
    validateRegisterData(data) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            this.showErrorMessage('Inserisci un indirizzo email valido');
            this.elements.registerEmail.focus();
            return false;
        }

        // Nickname validation
        if (!data.nickname || data.nickname.length < 3) {
            this.showErrorMessage('Il nickname deve essere di almeno 3 caratteri');
            this.elements.registerNickname.focus();
            return false;
        }

        if (data.nickname.length > 20) {
            this.showErrorMessage('Il nickname non può superare i 20 caratteri');
            this.elements.registerNickname.focus();
            return false;
        }

        // Password validation
        if (!data.password || data.password.length < 6) {
            this.showErrorMessage('La password deve essere di almeno 6 caratteri');
            this.elements.registerPassword.focus();
            return false;
        }

        return true;
    }

    /**
     * Validazione dati login
     */
    validateLoginData(data) {
        if (!data.nickname || data.nickname.length < 3) {
            this.showErrorMessage('Inserisci un nickname valido');
            this.elements.loginNickname.focus();
            return false;
        }

        if (!data.password || data.password.length < 6) {
            this.showErrorMessage('Inserisci una password valida');
            this.elements.loginPassword.focus();
            return false;
        }

        return true;
    }

    /**
     * Set loading state per i bottoni
     */
    setLoadingState(button, isLoading) {
        const textSpan = button.querySelector('.btn-text');
        const loader = button.querySelector('.btn-loader');

        if (isLoading) {
            button.disabled = true;
            textSpan.textContent = 'Caricamento...';
            loader.style.display = 'block';
        } else {
            button.disabled = false;
            // Ripristina testo originale
            if (button === this.elements.loginSubmitBtn) {
                textSpan.textContent = 'Accedi';
            } else {
                textSpan.textContent = 'Crea Account';
            }
            loader.style.display = 'none';
        }
    }

    /**
     * Mostra messaggio di successo
     */
    showSuccessMessage(message) {
        // Rimuovi eventuali messaggi precedenti
        this.clearMessages();

        // Crea elemento messaggio
        const successDiv = document.createElement('div');
        successDiv.className = 'message success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 12px 16px;
            border-radius: 6px;
            margin: 10px 0;
            border: 1px solid #c3e6cb;
            font-size: 14px;
            text-align: center;
        `;

        // Inserisci nel form attivo
        const activeForm = this.currentForm === 'login' ?
            this.elements.loginForm : this.elements.registerForm;
        activeForm.querySelector('.auth-form').appendChild(successDiv);

        // Auto-remove dopo 5 secondi
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }

    /**
     * Mostra messaggio di errore
     */
    showErrorMessage(message) {
        // Rimuovi eventuali messaggi precedenti
        this.clearMessages();

        // Crea elemento messaggio
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 6px;
            margin: 10px 0;
            border: 1px solid #f5c6cb;
            font-size: 14px;
            text-align: center;
        `;

        // Inserisci nel form attivo
        const activeForm = this.currentForm === 'login' ?
            this.elements.loginForm : this.elements.registerForm;
        activeForm.querySelector('.auth-form').appendChild(errorDiv);

        // Auto-remove dopo 5 secondi
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Pulisci tutti i messaggi
     */
    clearMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }

    /**
     * Gestione messaggi di errore user-friendly
     */
    getErrorMessage(error) {
        // Unique constraint violation per Email (PK)
        if (error.code === '23505' && error.details?.includes('Email')) {
            return 'Email già registrata. Prova ad effettuare il login o usa un\'altra email.';
        }

        // Altri errori database
        if (error.code === '23505') {
            return 'Dati già presenti nel sistema.';
        }

        // Errori di connessione
        if (error.message?.includes('fetch')) {
            return 'Errore di connessione. Verifica la tua connessione internet.';
        }

        // Errori generici
        if (error.message === 'Credenziali non valide') {
            return 'Nickname o password non corretti.';
        }

        // Fallback
        return error.message || 'Si è verificato un errore imprevisto. Riprova.';
    }
}

// ========================================
// INIZIALIZZAZIONE GLOBALE
// ========================================

// Crea istanza globale
let authManager;

// Funzione di inizializzazione
async function initializeAuth() {
    try {
        log('Avvio inizializzazione...');
        authManager = new SimpleAuthManager();
        await authManager.init();

        // Rendi disponibile per debug
        window.authManager = authManager;

        log('Sistema di autenticazione pronto! 🚀');
    } catch (error) {
        console.error('❌ Errore durante inizializzazione:', error);

        // Mostra errore all'utente
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #f8d7da; color: #721c24; padding: 15px 20px;
            border-radius: 8px; border: 1px solid #f5c6cb;
            z-index: 1000; font-family: Arial, sans-serif;
        `;
        errorMsg.textContent = 'Errore di connessione. Ricarica la pagina.';
        document.body.appendChild(errorMsg);
    }
}

// Attende caricamento DOM e Supabase
document.addEventListener('DOMContentLoaded', () => {
    log('DOM caricato, attendo Supabase...');

    // Carica Supabase da CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        log('Supabase caricato, inizializzazione...');
        initializeAuth();
    };
    script.onerror = () => {
        console.error('❌ Errore caricamento Supabase CDN');
    };
    document.head.appendChild(script);
});

// ========================================
// DEBUG UTILITIES
// ========================================

// Utilities per debug (solo in sviluppo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugAuth = {
        // Pulisci localStorage
        clearStorage: () => {
            localStorage.clear();
            console.log('🧹 Storage pulito');
        },

        // Vedi utente corrente
        getCurrentUser: () => {
            const user = localStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        },

        // Test connessione Supabase
        testConnection: async () => {
            if (!supabase) {
                console.log('🔌 Supabase non ancora inizializzato');
                return;
            }
            try {
                const { data, error } = await supabase.from('Utente').select('count');
                console.log('🔌 Test connessione:', error ? '❌' : '✅', data || error);
            } catch (e) {
                console.log('🔌 Test connessione: ❌', e);
            }
        },

        // Vedi tutti gli utenti (solo per debug)
        showAllUsers: async () => {
            if (!supabase) {
                console.log('👥 Supabase non ancora inizializzato');
                return;
            }
            try {
                const { data, error } = await supabase.from('Utente').select('Email, Nickname');
                console.log('👥 Utenti registrati:', data || error);
            } catch (e) {
                console.log('👥 Errore nel recupero utenti:', e);
            }
        }
    };
}