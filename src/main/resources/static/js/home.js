// home.js - Header dinamico + logout + guard + gestione note semplificata

(function () {
    'use strict';

    // Verifica se siamo sulla pagina home
    const isHomePage = window.location.pathname === '/home';

    if (!isHomePage) {
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
        
        // Inizializza il gestore delle note
        new NotePageHandler();
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

    // Inizializza quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomePage);
    } else {
        initHomePage();
    }

})();

/**
 * Gestore delle note - Versione semplificata per sola visualizzazione
 */
class NotePageHandler {
    constructor() {
        this.notesContainer = document.getElementById('notes-container');
        this.emptyState = document.getElementById('empty-state');
        this.searchInput = document.getElementById('search-input');
        this.notes = []; // Cache locale delle note
        this.filteredNotes = []; // Note filtrate per la ricerca
        this.activeDropdown = null; // Riferimento al dropdown attivo

        this.init();
        this.loadNotes();
    }

    init() {
        // Ricerca in tempo reale
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterNotes(e.target.value.trim());
            });
        }

        // Chiudi dropdown se si clicca fuori
        window.addEventListener('click', (e) => {
            if (this.activeDropdown && !e.target.closest('.note-menu')) {
                this.closeDropdown();
            }
        });

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
                } else {
                    // Click sulla nota per espandere
                    this.toggleNoteExpansion(noteCard);
                }
            });
        }
    }

    /**
     * Filtra le note in base al termine di ricerca
     */
    filterNotes(searchTerm) {
        if (!searchTerm) {
            this.filteredNotes = [...this.notes];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredNotes = this.notes.filter(note => 
                note.titolo.toLowerCase().includes(term) || 
                note.contenuto.toLowerCase().includes(term) ||
                (note.tag && note.tag.toLowerCase().includes(term))
            );
        }
        this.renderNotes();
    }

    /**
     * Toggle espansione della nota
     */
    toggleNoteExpansion(noteCard) {
        // Chiudi altre note espanse
        const expandedCards = this.notesContainer.querySelectorAll('.note-card.expanded');
        expandedCards.forEach(card => {
            if (card !== noteCard) {
                card.classList.remove('expanded');
            }
        });

        // Toggle espansione della nota corrente
        noteCard.classList.toggle('expanded');
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
                console.log('Dati ricevuti dal server:', data);
                this.notes = data.note || [];
                this.filteredNotes = [...this.notes];
                console.log('Note caricate:', this.notes);
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
        console.log('Renderizzando note:', this.filteredNotes.length);
        if (!this.notesContainer) {
            console.error('Container delle note non trovato!');
            return;
        }

        if (this.filteredNotes.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();
        this.notesContainer.innerHTML = '';

        this.filteredNotes.forEach(note => {
            const noteCard = this.createNoteCard(note);
            this.notesContainer.appendChild(noteCard);
        });
        
        console.log('Note renderizzate nel DOM:', this.notesContainer.children.length);
    }

    /**
     * Crea un elemento HTML per una nota
     */
    createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.noteId = note.id;
        noteCard.dataset.fullContent = note.contenuto;

        const formattedDate = this.formatDate(note.dataUltimaModifica);
        const truncatedContent = this.truncateContent(note.contenuto, 150);
        
        // Crea il tag HTML se presente
        const tagHtml = note.tag ? `<div class="note-tag">${this.escapeHtml(note.tag)}</div>` : '';

        noteCard.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${this.escapeHtml(note.titolo)}</h3>
                <div class="note-menu">
                    <button class="note-menu-btn" title="Menu opzioni">⋯</button>
                </div>
            </div>
            <div class="note-content">${this.escapeHtml(truncatedContent)}</div>
            <div class="note-footer">
                <div class="note-tags">
                    ${tagHtml}
                </div>
                <div class="note-meta">
                    <span>${formattedDate}</span>
                </div>
            </div>
        `;

        return noteCard;
    }

    /**
     * Naviga alla pagina di modifica nota
     */
    editNote(noteId) {
        window.location.href = `/form?id=${noteId}`;
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
                console.log('Risposta eliminazione nota:', data);
                this.showNotification('Nota eliminata con successo!', 'success');
                await this.loadNotes(); // Ricarica le note
            } else {
                const errorData = await response.json();
                console.error('Errore eliminazione nota:', errorData);
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