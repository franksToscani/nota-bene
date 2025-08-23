// home.js – header dinamico + logout + guard

(function () {
    // --- Guard: se non autenticato torna alla pagina di login
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    if (!isAuth) {
        window.location.href = '/';
        return;
    }

    // --- Leggi nickname salvato dal login
    const nickname = sessionStorage.getItem('userNickname') || 'Utente';

    // --- Popola nome e iniziali
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');

    nameEl && (nameEl.textContent = nickname);
    avatarEl && (avatarEl.textContent = getInitials(nickname));

    function getInitials(name) {
        // "Mario Rossi" -> "MR", "mario" -> "M"
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // --- Logout: chiama API (best effort), pulisce sessione, redirect
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn && logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                credentials: 'include'
            });
        } catch (_) {
            // ignoriamo eventuali errori rete: la sessione è client-side
        } finally {
            sessionStorage.removeItem('isAuthenticated');
            sessionStorage.removeItem('userNickname');
            window.location.href = '/';
        }
    });
})();
