// form.js - Versione semplificata con funzioni comuni rimosse
(function () {
    'use strict';

    // Verifica se siamo sulla pagina form
    const isFormPage = window.location.pathname === '/form';

    if (!isFormPage) {
        return;
    }

    /**
     * Inizializzazione della pagina form
     */
    async function initFormPage() {
        // Guard: verifica se l'utente è autenticato
        const authData = await checkAuthentication(); // Usa la funzione comune!
        
        if (!authData.authenticated) {
            console.log('Utente non autenticato, reindirizzamento al login...');
            window.location.href = '/';
            return;
        }

        // L'header è già stato popolato dagli script comuni!
        // Inizializza solo il gestore del form
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
        this.mode = 'create';
        this.tags = [];
        this.sharedUsers = [];
        this.currentUserEmail = null;
        this.isOwner = true;

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

        this.updateCharCount();
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

        this.tagSelect.innerHTML = '';
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Nessun tag';
        this.tagSelect.appendChild(emptyOption);

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
                
                if (this.titleInput) this.titleInput.value = note.titolo || '';
                if (this.contentInput) this.contentInput.value = note.contenuto || '';
                
                if (this.tagSelect && note.tag) {
                    if (this.tags.length === 0) {
                        await this.loadTags();
                    }
                    this.tagSelect.value = note.tag;
                }
                
                // Ottieni l'email dell'utente corrente
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
                
                this.sharedUsers = note.condivisioni || [];
                this.updateSharedUsersList();
                this.updateSharingSection();
                
                if (this.formTitle) this.formTitle.textContent = 'Modifica Nota';
                if (this.saveBtn) this.saveBtn.textContent = 'Salva modifiche';
                
                this.updateCharCount();
                
                if (this.titleInput) {
                    this.titleInput.focus();
                }
            } else if (response.status === 400) {
                const errorData = await response.json();
                showNotification(errorData.message || 'Non hai i permessi per accedere a questa nota', 'error'); // Usa la funzione comune!
                this.goBack();
            } else {
                showNotification('Errore nel caricamento della nota', 'error'); // Usa la funzione comune!
                this.goBack();
            }
        } catch (error) {
            showNotification('Errore di connessione', 'error'); // Usa la funzione comune!
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
            sharingSection.style.display = 'block';
        } else {
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
            showNotification('Inserire un indirizzo email', 'error'); // Usa la funzione comune!
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Inserire un indirizzo email valido', 'error'); // Usa la funzione comune!
            return;
        }

        if (email === this.currentUserEmail) {
            showNotification('Non puoi condividere la nota con te stesso', 'error'); // Usa la funzione comune!
            return;
        }

        const existingUser = this.sharedUsers.find(user => user.emailUtente === email);
        if (existingUser) {
            existingUser.tipo = permission;
            showNotification('Permessi aggiornati per questo utente', 'info'); // Usa la funzione comune!
        } else {
            this.sharedUsers.push({
                emailUtente: email,
                tipo: permission
            });
            showNotification('Utente aggiunto alla condivisione', 'success'); // Usa la funzione comune!
        }

        this.shareEmailInput.value = '';
        this.updateSharedUsersList();
    }

    /**
     * Rimuove un utente dalla lista di condivisione
     */
    removeSharedUser(email) {
        this.sharedUsers = this.sharedUsers.filter(user => user.emailUtente !== email);
        this.updateSharedUsersList();
        showNotification('Utente rimosso dalla condivisione', 'info'); // Usa la funzione comune!
    }

    /**
     * Cambia il permesso di un utente
     */
    changeUserPermission(email, newPermission) {
        const user = this.sharedUsers.find(user => user.emailUtente === email);
        if (user) {
            user.tipo = newPermission;
            this.updateSharedUsersList();
            showNotification('Permessi aggiornati', 'success'); // Usa la funzione comune!
        }
    }

    /**
     * Aggiorna la visualizzazione della lista degli utenti condivisi
     */
    updateSharedUsersList() {
        if (!this.sharedUsersList) return;

        this.sharedUsersList.innerHTML = '';

        if (this.sharedUsers.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-sharing';
            emptyDiv.textContent = 'Nessuna condivisione configurata';
            this.sharedUsersList.appendChild(emptyDiv);
            return;
        }

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

        const email = document.createElement('div');
        email.className = 'shared-user-email';
        email.textContent = user.emailUtente;

        const roleContainer = document.createElement('div');
        roleContainer.className = 'shared-user-role-container';

        if (this.mode === 'create' || this.isOwner) {
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
            const permissionText = document.createElement('span');
            permissionText.className = 'permission-readonly';
            permissionText.textContent = user.tipo === 'lettura' ? 'Lettore' : 'Scrittore';
            roleContainer.appendChild(permissionText);
        }

        userInfo.appendChild(email);
        userInfo.appendChild(roleContainer);

        const actions = document.createElement('div');
        actions.className = 'shared-user-actions';

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
     * Salva la nota (crea o modifica) con le condivisiones
     */

async saveNote() {
    const titolo = this.titleInput.value.trim();
    const contenuto = this.contentInput.value.trim();
    const tagId = this.tagSelect.value || null;

    // Recupera l'id della cartella selezionata (UUID come stringa o null)
    const folderSelect = document.getElementById('note-folder-select');
    const idCartella = folderSelect?.value || null;

    if (!titolo || !contenuto) {
        showNotification('Titolo e contenuto sono obbligatori', 'error');
        return;
    }

    if (contenuto.length > 280) {
        showNotification('Il contenuto non può superare i 280 caratteri', 'error');
        return;
    }

    try {
        this.saveBtn.disabled = true;
        this.saveBtn.textContent = 'Salvataggio...';

        // Prepara il body della richiesta
        const requestBody = { 
            titolo, 
            contenuto,
            tagId,
            idCartella // UUID stringa o null
        };

        // Solo il proprietario o in creazione può inviare le condivisioni
        if (this.mode === 'create' || this.isOwner) {
            requestBody.condivisioni = this.sharedUsers.length > 0 ? this.sharedUsers : null;
        }

        let response;

        if (this.mode === 'edit') {
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
            showNotification(
                this.mode === 'edit' ? 'Nota modificata con successo!' : 'Nota creata con successo!', 
                'success'
            );
            
            setTimeout(() => this.goBack(), 1000);
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Errore nel salvataggio della nota', 'error');
        }

    } catch (error) {
        showNotification('Errore di connessione', 'error');
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
}