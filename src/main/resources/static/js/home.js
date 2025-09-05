// home.js - Versione semplificata con funzioni comuni rimosse
(function () {
    'use strict';

    // Verifica se siamo sulla pagina home
    const isHomePage = window.location.pathname === '/home';

    if (!isHomePage) {
        return;
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
        // L'header è già stato popolato dagli script comuni!
        // Inizializza solo il gestore delle note
        new NotePageHandler();
    }

    // Inizializza quando il DOM è pronto
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
        this.searchInput = document.getElementById('search-input');
        this.toolbar = document.querySelector('.toolbar');
        this.createdFrom = document.getElementById('createdFrom');
        this.createdTo = document.getElementById('createdTo');
        this.modifiedFrom = document.getElementById('modifiedFrom');
        this.modifiedTo = document.getElementById('modifiedTo');
        this.applyFiltersBtn = document.getElementById('apply-filters-btn');
        this.resetFiltersBtn = document.getElementById('reset-filters-btn');
        this.notes = [];
        this.filteredNotes = [];
        this.activeDropdown = null;
        this.currentUserEmail = null;

        this.init();
        this.loadCurrentUser();
        this.loadNotes();
    }

    init() {
        // Ricerca in tempo reale
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterNotes(e.target.value.trim());
            });
        }

        this.initFilterButtons();

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
                    } else if (e.target.classList.contains('copy')) {
                    this.copyNote(noteId);
                    }
                    this.closeDropdown();
                } else {
                    this.toggleNoteExpansion(noteCard);
                }
            });
        }
    }
    initFilterButtons() {
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => {
                console.log('Filtra: handler chiamato senza problemi');
                this.applyFilters();
            });        }
        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }
    }
    /**
     * Carica l'email dell'utente corrente
     */
    async loadCurrentUser() {
        try {
            const response = await fetch('/api/auth/check', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const authData = await response.json();
                this.currentUserEmail = authData.user?.email;
            }
        } catch (error) {
            console.error('Errore nel caricamento utente corrente:', error);
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
        if (this.toolbar) {
            this.toolbar.classList.toggle('filters-active', !!searchTerm);
        }
        this.renderNotes();
    }
    /**
     * Toggle espansione della nota
     */
    toggleNoteExpansion(noteCard) {
        const expandedCards = this.notesContainer.querySelectorAll('.note-card.expanded');
        expandedCards.forEach(card => {
            if (card !== noteCard) {
                card.classList.remove('expanded');
            }
        });
        noteCard.classList.toggle('expanded');
    }

    /**
     * Gestisce l'apertura/chiusura del dropdown
     */
    toggleDropdown(menuBtn, noteId) {
        if (this.activeDropdown) {
            this.closeDropdown();
        }

        if (this.activeDropdown && this.activeDropdown.previousElementSibling === menuBtn) {
            return;
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'note-menu-dropdown';
        dropdown.innerHTML = `
            <button class="note-menu-item edit">Modifica</button>
            <button class="note-menu-item copy">Duplica</button>
            <button class="note-menu-item delete">Elimina</button>
        `;

        menuBtn.parentNode.appendChild(dropdown);
        
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


    async applyFilters() {
        this.toolbar.classList.add('filters-active');
        const params = new URLSearchParams();
        /**Normalizzazione delle date prima di pasarle alla ricerca**/
        const normalizeDate = (dateStr) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
            ? `${dateStr}T00:00:00Z`
            : dateStr;
        if (this.createdFrom && this.createdFrom.value) {
            params.append('createdFrom', normalizeDate(this.createdFrom.value));
        }
        if (this.createdTo && this.createdTo.value) {
            params.append('createdTo', normalizeDate(this.createdTo.value));
        }
        if (this.modifiedFrom && this.modifiedFrom.value) {
            params.append('modifiedFrom', normalizeDate(this.modifiedFrom.value));
        }
        if (this.modifiedTo && this.modifiedTo.value) {
            params.append('modifiedTo', normalizeDate(this.modifiedTo.value));
        }
        try {
            console.log(params.toString());
            const response = await fetch('/api/note/search?' + params.toString(), {
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Filtra: risposta non OK', response.status, await response.text());
                return;
            }
            console.log('Filtra: risposta OK: il filtro funziona bene');

            const data = await response.json();
            this.notes = data.note || [];
            this.filteredNotes = data.note || [];
            const searchTerm = this.searchInput ? this.searchInput.value.trim() : '';
            if (searchTerm) {
                this.filterNotes(searchTerm);
            } else {
                this.renderNotes();
            }
        } catch (error) {
            console.error('Errore nell\'applicazione dei filtri:', error);
        }
    }

    async resetFilters() {
        this.toolbar.classList.remove('filters-active');
        if (this.createdFrom) this.createdFrom.value = '';
        if (this.createdTo) this.createdTo.value = '';
        if (this.modifiedFrom) this.modifiedFrom.value = '';
        if (this.modifiedTo) this.modifiedTo.value = '';
        if (this.searchInput) this.searchInput.value = '';
        await this.loadNotes();
        this.filterNotes('');
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
                this.notes = data.note || [];
                this.filteredNotes = [...this.notes];
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
        if (!this.notesContainer) return;

        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            const searchActive = this.searchInput && this.searchInput.value.trim() !== '';
            const filtersActive = this.toolbar && this.toolbar.classList.contains('filters-active');
            resultsCount.textContent = (searchActive || filtersActive) ? this.filteredNotes.length : '0';
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
    }

    /**
     * Crea un elemento HTML per una nota
     */
    createNoteCard(note) {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.noteId = note.id;
        noteCard.dataset.fullContent = note.contenuto;

        const formattedDate = formatDate(note.dataUltimaModifica); // Usa la funzione comune!
        const truncatedContent = truncateContent(note.contenuto, 150); // Usa la funzione comune!
        
        const tagHtml = note.tag ? `<div class="note-tag">${escapeHtml(note.tag)}</div>` : ''; // Usa la funzione comune!

        const isShared = this.currentUserEmail && note.proprietario !== this.currentUserEmail;
        const sharedIndicator = isShared ? `<div class="note-shared-indicator">
            Condivisa da ${escapeHtml(note.proprietario)}</div>` : ''; // Usa la funzione comune!

        noteCard.innerHTML = `
            <div class="note-header">
                <div class="note-title-container">
                    ${sharedIndicator}
                    <h3 class="note-title">${escapeHtml(note.titolo)}</h3>
                </div>
                <div class="note-menu">
                    <button class="note-menu-btn" title="Menu opzioni">⋯</button>
                </div>
            </div>
            <div class="note-content">${escapeHtml(truncatedContent)}</div>
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
        try {
            const response = await fetch(`/api/note/${noteId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showNotification('Nota eliminata con successo!', 'success'); // Usa la funzione comune!
                await this.loadNotes();
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Errore nell\'eliminazione della nota', 'error'); // Usa la funzione comune!
            }

        } catch (error) {
            showNotification('Errore di connessione', 'error'); // Usa la funzione comune!
        }
    }

    /**
     * Duplica una nota
     */
    async copyNote(noteId) {
        try {
            const response = await fetch(`/api/note/${noteId}/copy`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showNotification('Nota duplicata con successo!', 'success'); // Usa la funzione comune!
                await this.loadNotes();
            } else {
                const errorData = await response.json();
                showNotification(errorData.message || 'Errore nella duplicazione della nota', 'error'); // Usa la funzione comune!
            }

        } catch (error) {
            showNotification('Errore di connessione', 'error'); // Usa la funzione comune!
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
}