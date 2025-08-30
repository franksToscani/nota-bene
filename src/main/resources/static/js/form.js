// form.js - Gestione form di creazione/modifica nota

(function () {
    'use strict';

    // Verifica se siamo sulla pagina form
    const isFormPage = window.location.pathname === '/form';

    if (!isFormPage) {
        return;
    }

    /**
     * Verifica autenticazione tramite server
     */
    async function checkAuthentication() {
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
                return data;
            }
            return { authenticated: false };
        } catch (error) {
            console.error('Errore durante il controllo autenticazione:', error);
            return { authenticated: false };
        }
    }

    /**
     * Genera le iniziali dal nickname
     */
    function getInitials(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    /**
     * Configura il pulsante di logout
     */
    function setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    logoutBtn.disabled = true;
                    logoutBtn.textContent = 'Disconnessione...';
                    
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                } catch (error) {
                    console.error('Errore durante il logout:', error);
                } finally {
                    window.location.href = '/';
                }
            });
        }
    }

    /**
     * Inizializzazione della pagina form
     */
    async function initFormPage() {
        // Guard: verifica se l'utente è autenticato
        const authData = await checkAuthentication();
        
        if (!authData.authenticated) {
            console.log('Utente non autenticato, reindirizzamento al login...');
            window.location.href = '/';
            return;
        }

        // Popola le informazioni dell'utente
        const user = authData.user;
        if (user) {
            const nameEl = document.getElementById('user-name');
            const avatarEl = document.getElementById('user-avatar');

            if (nameEl) nameEl.textContent = user.nickname;
            if (avatarEl) avatarEl.textContent = getInitials(user.nickname);
        }

        // Configura il logout
        setupLogout();
        
        // Inizializza il gestore del form
        new NoteFormHandler();
    }

    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFormPage);
    } else {
        initFormPage();
    }

})();

/**
 * Gestore del form per le note
 */
class NoteFormHandler {
    constructor() {
        this.form = document.getElementById('note-form');
        this.titleInput = document.getElementById('note-title-input');
        this.contentInput = document.getElementById('note-content-input');
        this.tagSelect = document.getElementById('note-tag-select');
        this.charCount = document.getElementById('char-count');
        this.saveBtn = document.getElementById('save-note-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.backBtn = document.getElementById('back-btn');
        this.formTitle = document.getElementById('form-title');
        
        this.currentNoteId = null;
        this.mode = 'create'; // 'create' or 'edit'
        this.tags = []; // Cache dei tag disponibili

        this.init();
        this.loadTags();
        this.checkUrlParams();
    }

    init() {
        // Setup contatore caratteri
        if (this.contentInput && this.charCount) {
            this.contentInput.addEventListener('input', () => {
                this.updateCharCount();
            });
        }

        // Submit form
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }

        // Pulsante annulla
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                this.goBack();
            });
        }

        // Pulsante back
        if (this.backBtn) {
            this.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }

        // Aggiorna il contatore iniziale
        this.updateCharCount();
    }

    /**
     * Carica tutti i tag disponibili
     */
    async loadTags() {
        try {
            const response = await fetch('/api/tag', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.tags = data || [];
                this.populateTagSelect();
            } else {
                console.error('Errore nel caricamento dei tag:', response.status);
                this.handleTagLoadError();
            }
        } catch (error) {
            console.error('Errore di rete nel caricamento dei tag:', error);
            this.handleTagLoadError();
        }
    }

    /**
     * Popola il select con i tag disponibili
     */
    populateTagSelect() {
        if (!this.tagSelect) return;

        // Pulisci il select
        this.tagSelect.innerHTML = '';

        // Opzione vuota (nessun tag)
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Nessun tag';
        this.tagSelect.appendChild(emptyOption);

        // Aggiungi i tag disponibili
        this.tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag.id;
            option.textContent = tag.nome;
            this.tagSelect.appendChild(option);
        });
    }

    /**
     * Gestisce errori nel caricamento dei tag
     */
    handleTagLoadError() {
        if (!this.tagSelect) return;
        
        this.tagSelect.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Errore nel caricamento tag';
        errorOption.disabled = true;
        this.tagSelect.appendChild(errorOption);
    }

    /**
     * Controlla i parametri URL per determinare se stiamo modificando una nota esistente
     */
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const noteId = urlParams.get('id');
        
        if (noteId) {
            this.currentNoteId = noteId;
            this.mode = 'edit';
            this.loadNoteForEdit(noteId);
        } else {
            this.mode = 'create';
            this.setupForCreate();
        }
    }

    /**
     * Configura il form per la creazione di una nuova nota
     */
    setupForCreate() {
        if (this.formTitle) {
            this.formTitle.textContent = 'Nuova Nota';
        }
        if (this.saveBtn) {
            this.saveBtn.textContent = 'Crea nota';
        }
        
        // Focus sul campo titolo
        if (this.titleInput) {
            this.titleInput.focus();
        }
    }

    /**
     * Carica una nota esistente per la modifica
     */
    async loadNoteForEdit(noteId) {
        try {
            const response = await fetch(`/api/note/${noteId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const note = await response.json();
                
                if (this.titleInput) this.titleInput.value = note.titolo;
                if (this.contentInput) this.contentInput.value = note.contenuto;
                
                // Imposta il tag se presente
                if (this.tagSelect && note.tag) {
                    this.tagSelect.value = note.tag.id;
                }
                
                if (this.formTitle) this.formTitle.textContent = 'Modifica Nota';
                if (this.saveBtn) this.saveBtn.textContent = 'Salva modifiche';
                
                this.updateCharCount();
                
                // Focus sul campo titolo
                if (this.titleInput) {
                    this.titleInput.focus();
                }
            } else {
                this.showNotification('Errore nel caricamento della nota', 'error');
                this.goBack();
            }
        } catch (error) {
            console.error('Errore nel caricamento della nota:', error);
            this.showNotification('Errore di connessione', 'error');
            this.goBack();
        }
    }

    /**
     * Aggiorna il contatore dei caratteri
     */
    updateCharCount() {
        if (!this.contentInput || !this.charCount) return;
        
        const count = this.contentInput.value.length;
        this.charCount.textContent = count;
        
        if (count >= 280) {
            this.charCount.style.color = '#dc2626';
        } else if (count >= 250) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#6b7280';
        }
    }

    /**
     * Salva la nota (crea o modifica)
     */
    async saveNote() {
        const titolo = this.titleInput.value.trim();
        const contenuto = this.contentInput.value.trim();
        const tagId = this.tagSelect.value || null;

        if (!titolo || !contenuto) {
            this.showNotification('Titolo e contenuto sono obbligatori', 'error');
            return;
        }

        if (contenuto.length > 280) {
            this.showNotification('Il contenuto non può superare i 280 caratteri', 'error');
            return;
        }

        try {
            this.saveBtn.disabled = true;
            this.saveBtn.textContent = 'Salvataggio...';

            const requestBody = { 
                titolo, 
                contenuto,
                tagId 
            };

            let response;
            
            if (this.mode === 'edit') {
                // Modifica nota esistente
                response = await fetch(`/api/note/${this.currentNoteId}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            } else {
                // Crea nuova nota
                response = await fetch('/api/note', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            }

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta salvataggio nota:', data);
                this.showNotification(
                    this.mode === 'edit' ? 'Nota modificata con successo!' : 'Nota creata con successo!', 
                    'success'
                );
                
                // Torna alla home dopo un breve delay
                setTimeout(() => {
                    this.goBack();
                }, 1000);
            } else {
                const errorData = await response.json();
                console.error('Errore salvataggio nota:', errorData);
                this.showNotification(errorData.message || 'Errore nel salvataggio della nota', 'error');
            }

        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            this.showNotification('Errore di connessione', 'error');
        } finally {
            this.saveBtn.disabled = false;
            this.saveBtn.textContent = this.mode === 'edit' ? 'Salva modifiche' : 'Crea nota';
        }
    }

    /**
     * Torna alla pagina home
     */
    goBack() {
        window.location.href = '/home';
    }

    /**
     * Mostra notifica
     */
    showNotification(message, type = 'info') {
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

        // Aggiungi gli stili per i colori se non esistono già  
        if (!document.head.querySelector('style[data-notifications]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notifications', '');
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

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}