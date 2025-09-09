(function () {
    'use strict';

    const isFormPage = window.location.pathname === '/form';

    if (!isFormPage) {
        return;
    }

    async function initFormPage() {
        const authData = await checkAuthentication(); 
        
        if (!authData.authenticated) {
            console.log('Utente non autenticato, reindirizzamento al login...');
            window.location.href = '/';
            return;
        }
        new NoteFormHandler();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFormPage);
    } else {
        initFormPage();
    }

})();

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
        if (this.contentInput && this.charCount) {
            this.contentInput.addEventListener('input', () => {
                this.updateCharCount();
            });
        }

        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                this.goBack();
            });
        }

        if (this.backBtn) {
            this.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }

        if (this.addShareBtn) {
            this.addShareBtn.addEventListener('click', () => {
                this.addSharedUser();
            });
        }

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

    handleTagLoadError() {
        if (!this.tagSelect) return;
        
        this.tagSelect.innerHTML = '';
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Errore nel caricamento tag';
        errorOption.disabled = true;
        this.tagSelect.appendChild(errorOption);
    }

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
                showNotification(errorData.message || 'Non hai i permessi per accedere a questa nota', 'error');
                this.goBack();
            } else {
                showNotification('Errore nel caricamento della nota', 'error');
                this.goBack();
            }
        } catch (error) {
            showNotification('Errore di connessione', 'error'); 
            this.goBack();
        }
    }

    updateSharingSection() {
        const sharingSection = document.querySelector('.sharing-section');
        if (!sharingSection) return;

        if (this.mode === 'create' || this.isOwner) {
            sharingSection.style.display = 'block';
        } else {
            sharingSection.style.display = 'none';
        }
    }

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

    addSharedUser() {
        const email = this.shareEmailInput.value.trim();
        const permission = this.permissionSelect.value;

        if (!email) {
            showNotification('Inserire un indirizzo email', 'error'); 
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Inserire un indirizzo email valido', 'error'); 
            return;
        }

        if (email === this.currentUserEmail) {
            showNotification('Non puoi condividere la nota con te stesso', 'error'); 
            return;
        }

        const existingUser = this.sharedUsers.find(user => user.emailUtente === email);
        if (existingUser) {
            existingUser.tipo = permission;
            showNotification('Permessi aggiornati per questo utente', 'info'); 
        } else {
            this.sharedUsers.push({
                emailUtente: email,
                tipo: permission
            });
            showNotification('Utente aggiunto alla condivisione', 'success'); 
        }

        this.shareEmailInput.value = '';
        this.updateSharedUsersList();
    }

    removeSharedUser(email) {
        this.sharedUsers = this.sharedUsers.filter(user => user.emailUtente !== email);
        this.updateSharedUsersList();
        showNotification('Utente rimosso dalla condivisione', 'info'); 
    }

    changeUserPermission(email, newPermission) {
        const user = this.sharedUsers.find(user => user.emailUtente === email);
        if (user) {
            user.tipo = newPermission;
            this.updateSharedUsersList();
            showNotification('Permessi aggiornati', 'success');
        }
    }

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

async saveNote() {
    const titolo = this.titleInput.value.trim();
    const contenuto = this.contentInput.value.trim();
    const tagId = this.tagSelect.value || null;
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

        const requestBody = { 
            titolo, 
            contenuto,
            tagId,
            idCartella 
        };

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

    goBack() {
        window.location.href = '/home';
    }
}