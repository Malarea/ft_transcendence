// Configuration de l'API
const API_URL = 'https://localhost:8000';
const WS_URL = 'wss://localhost:8000';

// Gestionnaire de login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;

    try {
        const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const user = window.userStatusManager?.getUser();
        if (user) {
            document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
            mainMenu.show();
        } else {
            throw new Error('Failed to get user data');
        }

    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Gestionnaire d'inscription
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const confirmPassword = document.getElementById('secondPasswordInput').value;

    if (username.length < 3) {
        alert("Le nom d'utilisateur doit faire au moins 3 caractères");
        return;
    }

    if (password.length < 3) {
        alert("Le mot de passe doit faire au moins 3 caractères");
        return;
    }

    if (password !== confirmPassword) {
        alert("Les mots de passe ne correspondent pas");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                username: username,
                password: password,
                display_name: username
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        const user = window.userStatusManager?.getUser();
        if (user) {
            document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
            alert("Compte créé avec succès !");
            mainMenu.show();
        }
    } catch (error) {
        console.error("Error:", error);
        alert('Registration failed: ' + error.message);
    }
}

// Gestionnaire de déconnexion
async function handleLogout() {
    try {
        const csrfToken = await getCsrfToken();
        if (window.userStatusManager) {
            window.userStatusManager.disconnect();
        }

        const response = await fetch('https://localhost:8000/auth/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Logout failed');
        
        document.dispatchEvent(new Event('userLoggedOut'));
        authenticationMenu.show();
    } catch (error) {
        console.error('Error during logout:', error);
        alert('Failed to logout');
    }
}

let userCache = null;
let lastFetch = 0;
const CACHE_DURATION = 1000;

function invalidateUserCache() {
    userCache = null;
    lastFetch = 0;
}

// Fonction pour vérifier si l'utilisateur est authentifié
async function isAuthenticated() {
    const user = window.userStatusManager?.getUser();
    return user !== null;
}

// Fonction pour charger les données utilisateur
async function loadUserData() {
    if (window.userStatusManager) {
        return window.userStatusManager.getUser();
    }
    return null;
}

// Fonction pour obtenir les données utilisateur
async function getUser() {
    if (window.userStatusManager) {
        return window.userStatusManager.getUser();
    }
    return null;
}

async function checkAuthStatus() {
    return window.userStatusManager?.isAuthenticated() || false;
}

function updateUIForLoggedInUser(userData) {
    const authButtons = document.querySelectorAll('.auth-buttons');
    authButtons.forEach(btn => btn.style.display = 'none');

    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.style.display = 'block';
        const userDisplayName = userMenu.querySelector('.user-display-name');
        if (userDisplayName && userData.display_name) {
            userDisplayName.textContent = userData.display_name;
        }
    }
}

// Fonction pour obtenir les headers d'authentification
async function getAuthHeaders() {
    const csrfToken = await getCsrfToken();
    return {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
        'Accept': 'application/json'
    };
}

function handlePageUnload(event) {
    // Vérifier directement l'état dans userStatusManager
    const isAuthenticated = window.userStatusManager?.user !== null;
    
    if (isAuthenticated) {
        // Utiliser sendBeacon qui est fait pour ce cas d'usage
        navigator.sendBeacon('https://localhost:8000/auth/logout/');
    }
}

// Fonction unique pour les requêtes protégées
async function protectedRequest(url, options = {}) {
    try {
        const csrfToken = await getCsrfToken();
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        };

        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.reload();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('Protected request failed:', error);
        throw error;
    }
}

// Fonction pour gérer les réponses API
window.handleApiRequest = async function(url, options = {}) {
    try {
        const csrfToken = await getCsrfToken();
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                ...(options.headers || {})
            },
            credentials: 'include'
        });
        
        if (response.status === 401 || response.status === 403) {
            window.location.href = '/';
            return null;
        }
        
        return response;
    } catch (error) {
        if (!window.navigator.onLine || document.visibilityState === 'hidden') {
            return null;
        }
        console.warn('API request failed:', error);
        throw error;
    }
}

// Fonction pour obtenir le CSRF token
async function getCsrfToken() {
    try {
        const response = await fetch('https://localhost:8000/auth/csrf/', { 
            credentials: 'include'
        });
        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return null;
    }
}

window.register = async function(username, password) {
    try {
        const csrfToken = await getCsrfToken();
        const response = await fetch('https://localhost:8000/auth/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                password,
                display_name: username
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
}

// Event listeners
document.addEventListener('userLoggedIn', invalidateUserCache);
document.addEventListener('userLoggedOut', invalidateUserCache);
document.addEventListener('DOMContentLoaded', checkAuthStatus);
window.addEventListener('beforeunload', handlePageUnload);
window.addEventListener('unload', handlePageUnload);