// cartelle.js
(function () {
    'use strict';

    // Verifica se siamo nella pagina del form nota
    const noteForm = document.getElementById('note-form');
    if (!noteForm) return;

    const folderSelect = document.getElementById('note-folder-select');
    const createFolderBtn = document.getElementById('create-folder-btn');
    let currentUserEmail = null;

    /**
     * Inizializzazione
     */
    async function initCartelleSection() {
        try {
            const authData = await checkAuthentication();
            if (!authData.authenticated) return;

            currentUserEmail = authData.user?.email;
            if (!currentUserEmail) {
                console.error("Email utente non trovata");
                return;
            }

            await loadCartelle(currentUserEmail);

            if (createFolderBtn) {
                createFolderBtn.addEventListener('click', handleCreateFolder);
            }
        } catch (error) {
            console.error("Errore inizializzazione cartelle:", error);
        }
    }

    /**
     * Carica le cartelle dal backend
     */
    async function loadCartelle(proprietario) {
        try {
            const response = await fetch(`/api/cartelle?proprietario=${encodeURIComponent(proprietario)}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                const cartelle = await response.json();
                populateFolderSelect(cartelle);
            } else {
                console.error("Errore nel recupero cartelle:", response.status);
            }
        } catch (err) {
            console.error("Errore di rete caricando cartelle:", err);
        }
    }

    /**
     * Popola il <select> con le cartelle disponibili
     */
    function populateFolderSelect(cartelle) {
        folderSelect.innerHTML = '';

        // Opzione iniziale
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = cartelle && cartelle.length > 0 ? 'Seleziona una cartella...' : 'Nessuna cartella disponibile';
        folderSelect.appendChild(defaultOption);

        if (!cartelle || cartelle.length === 0) return;

        cartelle.forEach((cartella, index) => {
            const option = document.createElement('option');
            option.value = cartella.id; // UUID
            option.textContent = cartella.nome;
            if (index === 0) option.selected = true; // Seleziona la prima cartella disponibile
            folderSelect.appendChild(option);
        });
    }

    /**
     * Gestisce la creazione di una nuova cartella
     */
    async function handleCreateFolder() {
        const modal = document.getElementById('new-folder-modal');
        const input = document.getElementById('new-folder-name');
        const cancelBtn = document.getElementById('cancel-new-folder');
        const confirmBtn = document.getElementById('confirm-new-folder');

        if (!modal || !input || !cancelBtn || !confirmBtn) return;

        // Mostra modale
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();

        // Cancella modale
        cancelBtn.onclick = () => modal.classList.add('hidden');

        // Conferma creazione
        confirmBtn.onclick = async () => {
            const nomeCartella = input.value.trim();
            if (!nomeCartella) return;

            try {
                const response = await fetch("/api/cartelle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        nome: nomeCartella,
                        creatore: currentUserEmail,
                        proprietario: currentUserEmail
                    })
                });

                if (response.ok) {
                    const nuovaCartella = await response.json();

                    // Svuota e aggiungi la nuova cartella come selezionata
                    folderSelect.innerHTML = '';
                    const option = document.createElement('option');
                    option.value = nuovaCartella.id;
                    option.textContent = nuovaCartella.nome;
                    option.selected = true;
                    folderSelect.appendChild(option);

                    showNotification("Cartella creata con successo!", "success");
                    modal.classList.add('hidden');
                } else {
                    showNotification("Errore durante la creazione della cartella", "error");
                }
            } catch (error) {
                showNotification("Errore di connessione", "error");
            }
        };
    }

    // Avvio
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCartelleSection);
    } else {
        initCartelleSection();
    }

})();
