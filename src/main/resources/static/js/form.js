// form.js - Gestione form di creazione/modifica nota con permessi

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
 * Gestore del form per le note con gestione permessi
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
        
        // Elementi per la condivisione
        this.shareEmailInput = document.getElementById('share-email-input');
        this.permissionSelect = document.getElementById('permission-select');
        this.addShareBtn = document.getElementById('add-share-btn');
        this.sharedUsersList = document.getElementById('shared-users-list');
        
        this.currentNoteId = null;
        this.mode = 'create'; // 'create' or 'edit'
        this.tags = []; // Cache dei tag disponibili
        this.sharedUsers = []; // Lista degli utenti con cui è condivisa la nota
        this.currentUserEmail = null; // Email dell'utente corrente
        this.isOwner = true; // Flag per sapere se l'utente corrente è il proprietario della nota

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

        // Gestione condivisione
        if (this.addShareBtn) {
            this.addShareBtn.addEventListener('click', () => {
                this.addSharedUser();
            });
        }

        // Permettere di aggiungere un utente premendo Invio
        if (this.shareEmailInput) {
            this.shareEmailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addSharedUser();
                }
            });
        }

        // Aggiorna il contatore iniziale
        this.updateCharCount();
        
        // Aggiorna la lista di condivisione iniziale
        this.updateSharedUsersList();
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
                console.log('Nota caricata:', note);
                
                if (this.titleInput) this.titleInput.value = note.titolo || '';
                if (this.contentInput) this.contentInput.value = note.contenuto || '';
                
                // Imposta il tag se presente - il tag arriva come stringa dal server
                if (this.tagSelect && note.tag) {
                    // Aspetta che i tag siano caricati prima di impostare il valore
                    if (this.tags.length === 0) {
                        await this.loadTags();
                    }
                    this.tagSelect.value = note.tag;
                }
                
                // Ottieni l'email dell'utente corrente per verificare se è il proprietario
                const authResponse = await fetch('/api/auth/check', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (authResponse.ok) {
                    const authData = await authResponse.json();
                    this.currentUserEmail = authData.user?.email;
                    this.isOwner = this.currentUserEmail === note.proprietario;
                }
                
                // Carica le condivisioni esistenti
                this.sharedUsers = note.condivisioni || [];
                this.updateSharedUsersList();
                
                // Mostra/nascondi la sezione condivisioni in base ai permessi
                this.updateSharingSection();
                
                if (this.formTitle) this.formTitle.textContent = 'Modifica Nota';
                if (this.saveBtn) this.saveBtn.textContent = 'Salva modifiche';
                
                this.updateCharCount();
                
                // Focus sul campo titolo
                if (this.titleInput) {
                    this.titleInput.focus();
                }
            } else if (response.status === 400) {
                const errorData = await response.json();
                this.showNotification(errorData.message || 'Non hai i permessi per accedere a questa nota', 'error');
                this.goBack();
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
     * Aggiorna la visibilità della sezione condivisioni
     */
    updateSharingSection() {
        const sharingSection = document.querySelector('.sharing-section');
        if (!sharingSection) return;

        if (this.mode === 'create' || this.isOwner) {
            // Mostra la sezione condivisioni per nuove note o se sei il proprietario
            sharingSection.style.display = 'block';
        } else {
            // Nascondi la sezione condivisioni se non sei il proprietario
            sharingSection.style.display = 'none';
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
     * Aggiunge un utente alla lista di condivisione
     */
    addSharedUser() {
        const email = this.shareEmailInput.value.trim();
        const permission = this.permissionSelect.value;

        if (!email) {
            this.showNotification('Inserire un indirizzo email', 'error');
            return;
        }

        // Validazione email base
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Inserire un indirizzo email valido', 'error');
            return;
        }

        // Impedisci di condividere con se stessi
        if (email === this.currentUserEmail) {
            this.showNotification('Non puoi condividere la nota con te stesso', 'error');
            return;
        }

        // Controlla se l'utente è già nella lista
        const existingUser = this.sharedUsers.find(user => user.emailUtente === email);
        if (existingUser) {
            // Aggiorna il permesso se l'utente esiste già
            existingUser.tipo = permission;
            this.showNotification('Permessi aggiornati per questo utente', 'info');
        } else {
            // Aggiungi nuovo utente
            this.sharedUsers.push({
                emailUtente: email,
                tipo: permission
            });
            this.showNotification('Utente aggiunto alla condivisione', 'success');
        }

        // Pulisci il campo email e aggiorna la lista
        this.shareEmailInput.value = '';
        this.updateSharedUsersList();
    }

    /**
     * Rimuove un utente dalla lista di condivisione
     */
    removeSharedUser(email) {
        this.sharedUsers = this.sharedUsers.filter(user => user.emailUtente !== email);
        this.updateSharedUsersList();
        this.showNotification('Utente rimosso dalla condivisione', 'info');
    }

    /**
     * Cambia il permesso di un utente
     */
    changeUserPermission(email, newPermission) {
        const user = this.sharedUsers.find(user => user.emailUtente === email);
        if (user) {
            user.tipo = newPermission;
            this.updateSharedUsersList();
            this.showNotification('Permessi aggiornati', 'success');
        }
    }

    /**
     * Aggiorna la visualizzazione della lista degli utenti condivisi
     */
    updateSharedUsersList() {
        if (!this.sharedUsersList) return;

        // Pulisci la lista
        this.sharedUsersList.innerHTML = '';

        if (this.sharedUsers.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-sharing';
            emptyDiv.textContent = 'Nessuna condivisione configurata';
            this.sharedUsersList.appendChild(emptyDiv);
            return;
        }

        // Aggiungi ogni utente condiviso
        this.sharedUsers.forEach(user => {
            const userItem = this.createSharedUserItem(user);
            this.sharedUsersList.appendChild(userItem);
        });
    }

    /**
     * Crea l'elemento per un singolo utente condiviso
     */
    createSharedUserItem(user) {
        const item = document.createElement('div');
        item.className = 'shared-user-item';

        const userInfo = document.createElement('div');
        userInfo.className = 'shared-user-info';

        // Email dell'utente
        const email = document.createElement('div');
        email.className = 'shared-user-email';
        email.textContent = user.emailUtente;

        // Container per il ruolo
        const roleContainer = document.createElement('div');
        roleContainer.className = 'shared-user-role-container';

        // Solo il proprietario può modificare i permessi
        if (this.mode === 'create' || this.isOwner) {
            // Select per cambiare permesso integrato nel layout
            const permissionSelect = document.createElement('select');
            permissionSelect.className = 'permission-select-inline';
            permissionSelect.innerHTML = `
                <option value="lettura" ${user.tipo === 'lettura' ? 'selected' : ''}>Lettore</option>
                <option value="scrittura" ${user.tipo === 'scrittura' ? 'selected' : ''}>Scrittore</option>
            `;
            permissionSelect.addEventListener('change', (e) => {
                this.changeUserPermission(user.emailUtente, e.target.value);
            });
            
            roleContainer.appendChild(permissionSelect);
        } else {
            // Solo visualizzazione del ruolo se non si può modificare
            const permissionText = document.createElement('span');
            permissionText.className = 'permission-readonly';
            permissionText.textContent = user.tipo === 'lettura' ? 'Lettore' : 'Scrittore';
            roleContainer.appendChild(permissionText);
        }

        userInfo.appendChild(email);
        userInfo.appendChild(roleContainer);

        // Azioni (solo pulsante rimuovi)
        const actions = document.createElement('div');
        actions.className = 'shared-user-actions';

        // Pulsante rimuovi (solo se proprietario)
        if (this.mode === 'create' || this.isOwner) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn danger small';
            removeBtn.textContent = 'Rimuovi';
            removeBtn.addEventListener('click', () => {
                this.removeSharedUser(user.emailUtente);
            });

            actions.appendChild(removeBtn);
        }

        item.appendChild(userInfo);
        item.appendChild(actions);

        return item;
    }

    /**
     * Salva la nota (crea o modifica) con le condivisioni
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

            // Include le condivisioni solo se sei il proprietario o stai creando una nuova nota
            if (this.mode === 'create' || this.isOwner) {
                requestBody.condivisioni = this.sharedUsers;
            }

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