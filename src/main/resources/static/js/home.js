class NotePageHandler {
    constructor() {
        this.notesContainer = document.getElementById('notes-container');
        this.newNoteBtn = document.getElementById('new-note-btn');
        this.modal = document.getElementById('note-modal');
        this.closeBtn = this.modal.querySelector('.close-btn');
        this.form = document.getElementById('note-form');
        this.titleInput = document.getElementById('note-title-input');
        this.contentInput = document.getElementById('note-content-input');
        this.tagSelect = document.getElementById('note-tag-select');
        this.currentNote = null;

        this.init();
        this.loadTags();
    }

    init() {
        if (this.newNoteBtn) {
            this.newNoteBtn.addEventListener('click', () => this.openModal());
        }

        this.closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.currentNote) {
                this.updateNote();
            } else {
                this.createNote();
            }
            this.closeModal();
        });

        this.notesContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('note-menu-btn')) {
                const noteCard = e.target.closest('.note-card');
                this.editNote(noteCard);
            }
        });
    }

    async loadTags() {
        try {
            const response = await fetch('/api/tags'); // endpoint reale per i tag
            const tags = await response.json();

            // Aggiungiamo prima l'opzione facoltativa
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Nessun tag';
            this.tagSelect.appendChild(defaultOption);

            tags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = tag.name;
                this.tagSelect.appendChild(option);
            });
        } catch (err) {
            console.error('Errore caricamento tag:', err);
        }
    }

    openModal(note = null) {
        this.currentNote = note;
        this.modal.style.display = 'flex';
        if (note) {
            this.titleInput.value = note.querySelector('.note-title').textContent;
            this.contentInput.value = note.querySelector('.note-content').textContent;

            const noteTag = note.querySelector('.note-tags').dataset.tagId;
            this.tagSelect.value = noteTag || '';

            document.getElementById('modal-title').textContent = 'Modifica Nota';
        } else {
            this.titleInput.value = '';
            this.contentInput.value = '';
            this.tagSelect.value = '';
            document.getElementById('modal-title').textContent = 'Nuova Nota';
        }
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    createNote() {
        const selectedTag = this.tagSelect.value;
        const tagName = selectedTag ? this.tagSelect.selectedOptions[0].textContent : '';

        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.tabIndex = 0;

        noteCard.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${this.titleInput.value}</h3>
                <div class="note-menu">
                    <button class="note-menu-btn">⋯</button>
                </div>
            </div>
            <div class="note-content">${this.contentInput.value}</div>
            <div class="note-footer">
                <div class="note-tags" data-tag-id="${selectedTag}">${tagName}</div>
                <div class="note-meta">
                    <span>Adesso</span>
                </div>
            </div>
        `;

        this.notesContainer.prepend(noteCard);

        // TODO: inviare la nota al backend per salvarla
    }

    editNote(noteCard) {
        this.openModal(noteCard);
    }

    updateNote() {
        const selectedTag = this.tagSelect.value;
        const tagName = selectedTag ? this.tagSelect.selectedOptions[0].textContent : '';

        this.currentNote.querySelector('.note-title').textContent = this.titleInput.value;
        this.currentNote.querySelector('.note-content').textContent = this.contentInput.value;

        const tagEl = this.currentNote.querySelector('.note-tags');
        tagEl.textContent = tagName;
        tagEl.dataset.tagId = selectedTag;

        const meta = this.currentNote.querySelector('.note-meta span:last-child');
        if (meta) meta.textContent = 'Modificata ora';

        // TODO: aggiornare la nota nel DB
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NotePageHandler();
});
