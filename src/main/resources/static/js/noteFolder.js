// home-folders.js
(function () {
    'use strict';

    const isHomePage = window.location.pathname === '/home';
    if (!isHomePage) return;

    class FolderNotesHandler {
        constructor() {
            this.notesContainer = document.getElementById('notes-container');
            this.emptyState = document.getElementById('empty-state');
            this.currentUserEmail = null;
            this.notes = [];
            this.cartelle = [];
            this.viewByFolders = false; // false = lista normale, true = per cartelle

            this.init();
        }

        async init() {
            try {
                const authData = await checkAuthentication();
                if (!authData.authenticated) return;

                this.currentUserEmail = authData.user?.email;

                await this.loadNotes();
                await this.loadCartelle();

                this.renderNotes();

                const toggleBtn = document.getElementById('toggle-view-btn');
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', () => {
                        this.viewByFolders = !this.viewByFolders;
                        this.renderNotes();
                        toggleBtn.textContent = this.viewByFolders ? 'Visualizza lista normale' : 'Visualizza per cartelle';
                    });
                }

            } catch (error) {
                console.error('Errore inizializzazione FolderNotesHandler:', error);
                this.showEmptyState();
            }
        }

        async loadNotes() {
            try {
                const response = await fetch('/api/note', {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.notes = data.note || [];
                } else {
                    console.error('Errore caricamento note:', response.status);
                }
            } catch (err) {
                console.error('Errore di rete caricamento note:', err);
            }
        }

        async loadCartelle() {
            try {
                const response = await fetch(`/api/cartelle?proprietario=${encodeURIComponent(this.currentUserEmail)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    this.cartelle = await response.json();
                } else {
                    console.error('Errore caricamento cartelle:', response.status);
                }
            } catch (err) {
                console.error('Errore di rete caricamento cartelle:', err);
            }
        }

        renderNotes() {
            if (!this.notesContainer) return;
            this.notesContainer.innerHTML = '';

            if (!this.notes || this.notes.length === 0) {
                this.showEmptyState();
                return;
            }

            if (this.viewByFolders) {
                this.renderNotesByFolder();
            } else {
                this.renderNotesList();
            }

            this.hideEmptyState();
        }

        renderNotesByFolder() {
    if (!this.cartelle || this.cartelle.length === 0) {
        this.showEmptyState();
        return;
    }

    this.notesContainer.innerHTML = '';

    this.cartelle.forEach(cartella => {

        const folderSection = document.createElement('div');
        folderSection.className = 'folder-section';

        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header';
        folderHeader.textContent = cartella.nome;
        folderSection.appendChild(folderHeader);

        const folderNotesContainer = document.createElement('div');
        folderNotesContainer.className = 'folder-notes';

        const folderNotes = this.notes.filter(n => n.idCartella && n.idCartella.toString() === cartella.id.toString());

        if (folderNotes.length === 0) {
            const emptyNote = document.createElement('p');
            emptyNote.textContent = 'Nessuna nota in questa cartella';
            emptyNote.style.fontStyle = 'italic';
            emptyNote.style.color = '#666';
            folderNotesContainer.appendChild(emptyNote);
        } else {
            folderNotes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';

                const noteCard = document.createElement('div');
                noteCard.className = 'note-card';
                noteCard.dataset.noteId = note.id;
                noteCard.dataset.fullContent = note.contenuto;

                const truncatedContent = truncateContent(note.contenuto, 150);
                const tagHtml = note.tag ? `<div class="note-tag">${escapeHtml(note.tag)}</div>` : '';
                const isShared = this.currentUserEmail && note.proprietario !== this.currentUserEmail;
                const sharedIndicator = isShared ? `<div class="note-shared-indicator">Condivisa da ${escapeHtml(note.proprietario)}</div>` : '';

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
                        <div class="note-tags">${tagHtml}</div>
                        <div class="note-meta"><span>${formatDate(note.dataUltimaModifica)}</span></div>
                    </div>
                `;

                const menuBtn = noteCard.querySelector('.note-menu-btn');
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(menuBtn, note.id);
                });

                noteCard.addEventListener('click', () => this.toggleNoteExpansion(noteCard));

                noteItem.appendChild(noteCard);
                folderNotesContainer.appendChild(noteItem);
            });
        }

        folderSection.appendChild(folderNotesContainer);
        this.notesContainer.appendChild(folderSection);

        folderHeader.addEventListener('click', () => {
            folderNotesContainer.style.display = folderNotesContainer.style.display === 'none' ? 'block' : 'none';
        });
    });
}

        renderNotesList() {
    if (!this.notesContainer) return;

    this.notesContainer.innerHTML = '';

    this.notes.forEach(note => {
        const noteCard = this.createNoteCard(note);
        this.notesContainer.appendChild(noteCard);
    });
}

createNoteCard(note) {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    noteCard.dataset.noteId = note.id;
    noteCard.dataset.fullContent = note.contenuto;

    const formattedDate = formatDate(note.dataUltimaModifica); 
    const truncatedContent = truncateContent(note.contenuto, 150); 
    const tagHtml = note.tag ? `<div class="note-tag">${escapeHtml(note.tag)}</div>` : '';

    const isShared = this.currentUserEmail && note.proprietario !== this.currentUserEmail;
    const sharedIndicator = isShared ? `<div class="note-shared-indicator">
        Condivisa da ${escapeHtml(note.proprietario)}</div>` : '';

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
            <div class="note-tags">${tagHtml}</div>
            <div class="note-meta"><span>${formattedDate}</span></div>
        </div>
    `;

    return noteCard;
}


        showEmptyState() {
            if (this.emptyState) this.emptyState.style.display = 'block';
            if (this.notesContainer) this.notesContainer.style.display = 'none';
        }

        hideEmptyState() {
            if (this.emptyState) this.emptyState.style.display = 'none';
            if (this.notesContainer) this.notesContainer.style.display = 'grid';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new FolderNotesHandler());
    } else {
        new FolderNotesHandler();
    }

})();
