// home.js - Header dinamico + logout + guard + gestione note semplificata

(function () {
    'use strict';

    // Verifica se siamo sulla pagina home - AGGIUNGI QUESTO CONTROLLO
    const isHomePage = window.location.pathname === '/home';

    if (!isHomePage) {
        // Non eseguire nulla se non siamo sulla pagina home
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
     * Inizializzazione della pagina home
     */
    async function initHomePage() {
        // Guard: verifica se l'utente Ã¨ autenticato
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
        
        // Inizializza il gestore delle note
        if (window.location.pathname === '/home') {
            new NotePageHandler();
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

    // Inizializza quando il DOM Ã¨ pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomePage);
    } else {
        initHomePage();
    }

})();

/**
 * Gestore delle note - Versione semplificata
 */
class NotePageHandler {
    constructor() {
        this.notesContainer = document.getElementById('notes-container');
        this.emptyState = document.getElementById('empty-state');
        this.newNoteBtn = document.getElementById('new-note-btn');
        this.modal = document.getElementById('note-modal');
        this.closeBtn = this.modal?.querySelector('.close-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.form = document.getElementById('note-form');
        this.titleInput = document.getElementById('note-title-input');
        this.contentInput = document.getElementById('note-content-input');
        this.charCount = document.getElementById('char-count');
        this.currentNoteId = null;
        this.notes = []; // Cache locale delle note
        this.activeDropdown = null; // Riferimento al dropdown attivo

        this.init();
        this.loadNotes();
    }

    init() {
        // Evento per nuova nota
        if (this.newNoteBtn) {
            this.newNoteBtn.addEventListener('click', () => this.openModal());
        }

        // Eventi per chiusura modal
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Chiudi modal cliccando fuori
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
            
            // Chiudi dropdown se si clicca fuori
            if (this.activeDropdown && !e.target.closest('.note-menu')) {
                this.closeDropdown();
            }
        });

        // Submit form
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNote();
            });
        }

        // Contatore caratteri
        if (this.contentInput && this.charCount) {
            this.contentInput.addEventListener('input', () => {
                const count = this.contentInput.value.length;
                this.charCount.textContent = count;
                
                if (count >= 280) {
                    this.charCount.style.color = '#dc2626';
                } else if (count >= 250) {
                    this.charCount.style.color = '#f59e0b';
                } else {
                    this.charCount.style.color = '#6b7280';
                }
            });
        }

        // Event delegation per i pulsanti delle note
        if (this.notesContainer) {
            this.notesContainer.addEventListener('click', (e) => {
                const noteCard = e.target.closest('.note-card');
                if (!noteCard) return;

                // Gestione del menu a tendina
                if (e.target.classList.contains('note-menu-btn')) {
                    e.stopPropagation();
                    const noteId = noteCard.dataset.noteId;
                    this.toggleDropdown(e.target, noteId);
                } else if (e.target.classList.contains('note-menu-item')) {
                    const noteId = noteCard.dataset.noteId;
                    if (e.target.classList.contains('edit')) {
                        this.editNote(noteId);
                    } else if (e.target.classList.contains('delete')) {
                        this.deleteNote(noteId);
                    }
                    this.closeDropdown();
                }
            });
        }
    }

    /**
     * Gestisce l'apertura/chiusura del dropdown
     */
    toggleDropdown(menuBtn, noteId) {
        // Se c'è già un dropdown aperto, chiudilo
        if (this.activeDropdown) {
            this.closeDropdown();
        }

        // Se stiamo riaprendo lo stesso dropdown, non fare nulla
        if (this.activeDropdown && this.activeDropdown.previousElementSibling === menuBtn) {
            return;
        }

        // Crea il dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'note-menu-dropdown';
        dropdown.innerHTML = `
            <button class="note-menu-item edit">Modifica</button>
            <button class="note-menu-item delete">Elimina</button>
        `;

        // Aggiungi il dropdown dopo il pulsante
        menuBtn.parentNode.appendChild(dropdown);
        
        // Mostra il dropdown con animazione
        setTimeout(() => {
            dropdown.classList.add('show');
        }, 10);

        this.activeDropdown = dropdown;
    }

    /**
     * Chiude il dropdown attivo
     */
    closeDropdown() {
        if (this.activeDropdown) {
            this.activeDropdown.classList.remove('show');
            setTimeout(() => {
                if (this.activeDropdown && this.activeDropdown.parentNode) {
                    this.activeDropdown.parentNode.removeChild(this.activeDropdown);
                }
                this.activeDropdown = null;
            }, 150);
        }
    }

    /**
     * Carica tutte le note dal server
     */
    async loadNotes() {
        try {
            const response = await fetch('/api/note', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Dati ricevuti dal server:', data); // Debug
                this.notes = data.note || [];
                console.log('Note caricate:', this.notes); // Debug
                this.renderNotes();
            } else {
                console.error('Errore nel caricamento delle note', response.status);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Errore di rete nel caricamento delle note:', error);
            this.showEmptyState();
        }
    }

    /**
     * Renderizza le note nell'interfaccia
     */
    renderNotes() {
        console.log('Renderizzando note:', this.notes.length); // Debug
        if (!this.notesContainer) {
            console.error('Container delle note non trovato!');
            return;
        }

        if (this.notes.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.notesContainer.innerHTML = '';

        this.notes.forEach(note => {
            const noteCard = this.createNoteCard(note);
            this.notesContainer.appendChild(noteCard);
        });
        
        console.log('Note renderizzate nel DOM:', this.notesContainer.children.length); // Debug
    }

    /**
     * Crea un elemento HTML per una nota
     */
    createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.noteId = note.id;

        const formattedDate = this.formatDate(note.dataUltimaModifica);
        const truncatedContent = this.truncateContent(note.contenuto, 150);

        noteCard.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${this.escapeHtml(note.titolo)}</h3>
                <div class="note-menu">
                    <button class="note-menu-btn" title="Menu opzioni">⋯</button>
                </div>
            </div>
            <div class="note-content">${this.escapeHtml(truncatedContent)}</div>
            <div class="note-footer">
                <div class="note-meta">
                    <span>${formattedDate}</span>
                </div>
            </div>
        `;

        return noteCard;
    }

    /**
     * Apre il modal per creare/modificare una nota
     */
    openModal(noteId = null) {
        if (!this.modal) return;

        this.currentNoteId = noteId;
        const saveButton = document.getElementById('save-note-btn');
        
        if (noteId) {
            // Modifica nota esistente
            const note = this.notes.find(n => n.id === noteId);
            if (note) {
                this.titleInput.value = note.titolo;
                this.contentInput.value = note.contenuto;
                document.getElementById('modal-title').textContent = 'Modifica Nota';
                saveButton.textContent = 'Salva modifiche';
            }
        } else {
            // Nuova nota
            this.titleInput.value = '';
            this.contentInput.value = '';
            document.getElementById('modal-title').textContent = 'Nuova Nota';
            saveButton.textContent = 'Crea nota';
        }

        // Aggiorna contatore caratteri
        if (this.charCount) {
            const count = this.contentInput.value.length;
            this.charCount.textContent = count;
        }

        this.modal.style.display = 'flex';
        this.titleInput.focus();
    }

    /**
     * Chiude il modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.currentNoteId = null;
        }
    }

    /**
     * Salva la nota (crea o modifica)
     */
    async saveNote() {
        const titolo = this.titleInput.value.trim();
        const contenuto = this.contentInput.value.trim();

        if (!titolo || !contenuto) {
            this.showNotification('Titolo e contenuto sono obbligatori', 'error');
            return;
        }

        if (contenuto.length > 280) {
            this.showNotification('Il contenuto non può superare i 280 caratteri', 'error');
            return;
        }

        try {
            const saveButton = document.getElementById('save-note-btn');
            saveButton.disabled = true;
            saveButton.textContent = 'Salvataggio...';

            let response;
            
            if (this.currentNoteId) {
                // Modifica nota esistente
                response = await fetch(`/api/note/${this.currentNoteId}`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ titolo, contenuto })
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
                    body: JSON.stringify({ titolo, contenuto })
                });
            }

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta creazione nota:', data); // Debug
                this.showNotification(this.currentNoteId ? 'Nota modificata con successo!' : 'Nota creata con successo!', 'success');
                this.closeModal();
                await this.loadNotes(); // Ricarica le note
            } else {
                const errorData = await response.json();
                console.error('Errore salvataggio nota:', errorData); // Debug
                this.showNotification(errorData.message || 'Errore nel salvataggio della nota', 'error');
            }

        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            this.showNotification('Errore di connessione', 'error');
        } finally {
            const saveButton = document.getElementById('save-note-btn');
            saveButton.disabled = false;
            saveButton.textContent = this.currentNoteId ? 'Salva modifiche' : 'Crea nota';
        }
    }

    /**
     * Modifica una nota esistente
     */
    editNote(noteId) {
        this.openModal(noteId);
    }

    /**
     * Elimina una nota
     */
    async deleteNote(noteId) {
        if (!confirm('Sei sicuro di voler eliminare questa nota? Questa azione non può essere annullata.')) {
            return;
        }

        try {
            const response = await fetch(`/api/note/${noteId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Risposta eliminazione nota:', data); // Debug
                this.showNotification('Nota eliminata con successo!', 'success');
                await this.loadNotes(); // Ricarica le note
            } else {
                const errorData = await response.json();
                console.error('Errore eliminazione nota:', errorData); // Debug
                this.showNotification(errorData.message || 'Errore nell\'eliminazione della nota', 'error');
            }

        } catch (error) {
            console.error('Errore nell\'eliminazione:', error);
            this.showNotification('Errore di connessione', 'error');
        }
    }

    /**
     * Mostra lo stato vuoto
     */
    showEmptyState() {
        if (this.emptyState) this.emptyState.style.display = 'block';
        if (this.notesContainer) this.notesContainer.style.display = 'none';
    }

    /**
     * Nasconde lo stato vuoto
     */
    hideEmptyState() {
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.notesContainer) this.notesContainer.style.display = 'grid';
    }

    /**
     * Utility: formatta una data
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ora';
        if (diffMins < 60) return `${diffMins} min fa`;
        if (diffHours < 24) return `${diffHours} ore fa`;
        if (diffDays < 7) return `${diffDays} giorni fa`;
        
        return date.toLocaleDateString('it-IT');
    }

    /**
     * Utility: tronca il testo
     */
    truncateContent(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Utility: escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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