document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notes-container');

    if (!notesContainer) return;

    const modal = document.createElement('div');
    modal.id = 'note-viewer-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        display: none; justify-content: center; align-items: center;
        background: rgba(0,0,0,0.5); z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white; padding: 20px; border-radius: 8px;
        max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;
        box-shadow: 0px 8px 20px rgba(0,0,0,0.3); position: relative;
    `;

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute; top: 10px; right: 15px; cursor: pointer;
        font-size: 24px; font-weight: bold;
    `;

    const titleEl = document.createElement('h2');
    titleEl.style.marginBottom = '12px';

    const contentEl = document.createElement('div');
    contentEl.style.whiteSpace = 'pre-wrap';

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(titleEl);
    modalContent.appendChild(contentEl);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    function openModal(noteCard) {
        const title = noteCard.querySelector('.note-title')?.textContent || '';
        const content = noteCard.dataset.fullContent || noteCard.querySelector('.note-content')?.textContent || '';

        titleEl.textContent = title;
        contentEl.textContent = content;

        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Event delegation per tutte le note
    notesContainer.addEventListener('click', (e) => {
        const noteCard = e.target.closest('.note-card');
        if (!noteCard) return;

        // Ignora il pulsante del menu
        if (e.target.classList.contains('note-menu-btn') || e.target.classList.contains('note-menu-item')) return;

        openModal(noteCard);
    });
});

