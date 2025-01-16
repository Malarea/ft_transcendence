class TranslationManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'en';
        this.translations = {};
        this.observers = new Set();
        this.initialized = false;
        
        // Version initiale des traductions en mémoire
        this.translations = {
            'en': {
                "PONG": "PONG",
                "play": "Play",
                "settings": "Settings",
                "authenticate": "Authenticate",
                "logout": "Logout",
                "language": "Language",
                "back": "Back",
                "english": "English",
                "french": "French",
                "spanish": "Spanish",
                
                "playMenu": {
                    "title": "Play",
                    "local": "Local",
                    "online": "Online",
                    "friends": "Friends"
                },
                
                "settingsMenu": {
                    "title": "Settings",
                    "account": "Account",
                    "language": "Language",
                    "audio": "Audio"
                },

                "audioMenu": {
                    "title": "Audio",
                    "ambientVolume": "Ambient volume",
                    "soundVolume": "Sound volume"
                },

                "accountMenu": {
                    "title": "Account",
                    "id": "ID",
                    "password": "Password",
                    "nickname": "Nickname",
                    "enterNickname": "Enter your nickname",
                    "uploadButton": "Upload",
                    "saveButton": "Save changes",
                    "statistics": "Statistics",
                    "wins": "Wins:",
                    "losses": "Losses:",
                    "idNotEditable": "42 IDs are not editable",
                    "passwordNotEditable": "42 Passwords are not editable",
                    "profileUpdated": "Profile updated successfully",
                    "uploadError": "Failed to update avatar",
                    "updateError": "Failed to update profile"
                },
                "authMenu": {
                    "title": "Authentication",
                    "signIn": "Log In",
                    "signUp": "Sign Up"
                },

                "logInMenu": {
                    "title": "Log In",
                    "username": "Username",
                    "password": "Password",
                    "or42": "42 intra",
                    "loginError": "Login failed",
                    "userDataError": "Failed to get user data after login",
                    "submit": "Log In"
                },

                "signUpMenu": {
                    "title": "Sign Up",
                    "username": "Username",
                    "password": "Password",
                    "confirmPassword": "Confirm password",
                    "passwordMismatch": "Passwords do not match",
                    "registrationError": "Registration failed",
                    "submit": "Sign Up",
                    "userDataError": "Failed to get user data after registration"
                },

                "localMenu": {
                    "quitGame": "Quit Game"
                },

                "onlineMenu": {
                    "title": "Online Mode",
                    "findGame": "Find Game",
                    "cancelSearch": "Cancel Search",
                    "searching": "Searching for opponent...",
                    "queueTime": "Time in queue:",
                    "quitGame": "Quit Game"
                },

                "friendsMenu": {
                    "title": "Friends",
                    "searchPlaceholder": "Search users...",
                    "myFriends": "My Friends",
                    "noFriends": "No friends yet ;(",
                    "friendRequests": "Friend Requests",
                    "noRequests": "No pending friend requests",
                    "online": "Online",
                    "offline": "Offline",
                    "inviteToPlay": "Invite to play",
                    "accept": "Accept",
                    "reject": "Reject",
                    "addFriend": "Add Friend",
                    "requestSent": "Friend request sent!",
                    "requestError": "Failed to send friend request",
                    "searchError": "Error searching users",
                    "noResults": "No users found"
                }
            },

            'fr': {
                "PONG": "PONGUE",
                "play": "Jouer",
                "settings": "Paramètres",
                "authenticate": "S'authentifier",
                "logout": "Déconnexion",
                "language": "Langue",
                "back": "Retour",
                "english": "Anglais",
                "french": "Français",
                "spanish": "Espagnol",
                
                "playMenu": {
                    "title": "Jouer",
                    "local": "Local",
                    "online": "En ligne",
                    "friends": "Amis"
                },
                
                "settingsMenu": {
                    "title": "Paramètres",
                    "account": "Compte",
                    "language": "Langue",
                    "audio": "Audio"
                },

                "audioMenu": {
                    "title": "Audio",
                    "ambientVolume": "Volume ambiant",
                    "soundVolume": "Volume des effets"
                },

                "accountMenu": {
                    "title": "Compte",
                    "id": "Identifiant",
                    "password": "Mot de passe",
                    "nickname": "Pseudo",
                    "enterNickname": "Entrez votre pseudo",
                    "uploadButton": "Téléverser",
                    "saveButton": "Enregistrer",
                    "statistics": "Statistiques",
                    "wins": "Victoires :",
                    "losses": "Défaites :",
                    "idNotEditable": "Les identifiants 42 ne sont pas modifiables",
                    "passwordNotEditable": "Les mots de passe 42 ne sont pas modifiables",
                    "profileUpdated": "Profil mis à jour avec succès",
                    "uploadError": "Échec de la mise à jour de l'avatar",
                    "updateError": "Échec de la mise à jour du profil"
                },

                "authMenu": {
                    "title": "Authentification",
                    "signIn": "Connexion",
                    "signUp": "Inscription"
                },

                "logInMenu": {
                    "title": "Connexion",
                    "username": "Nom d'utilisateur",
                    "password": "Mot de passe",
                    "or42": "42 intra",
                    "loginError": "Échec de la connexion",
                    "userDataError": "Impossible de récupérer les données utilisateur après la connexion",
                    "submit": "Se connecter"
                },

                "signUpMenu": {
                    "title": "Inscription",
                    "username": "Nom d'utilisateur",
                    "password": "Mot de passe",
                    "confirmPassword": "Confirmer le mot de passe",
                    "passwordMismatch": "Les mots de passe ne correspondent pas",
                    "registrationError": "Échec de l'inscription",
                    "submit": "S'inscrire",
                    "userDataError": "Impossible de récupérer les données utilisateur après l'inscription"
                },
                "localMenu": {
                    "quitGame": "Quitter la partie"
                },

                "onlineMenu": {
                    "title": "Mode en ligne",
                    "findGame": "Rechercher une partie",
                    "cancelSearch": "Annuler la recherche",
                    "searching": "Recherche d'un adversaire...",
                    "queueTime": "Temps d'attente :",
                    "quitGame": "Quitter la partie"
                },

                "friendsMenu": {
                    "title": "Amis",
                    "searchPlaceholder": "Rechercher des utilisateurs...",
                    "myFriends": "Mes amis",
                    "noFriends": "Pas encore d'amis ;(",
                    "friendRequests": "Demandes d'amis",
                    "noRequests": "Aucune demande d'ami en attente",
                    "online": "En ligne",
                    "offline": "Hors ligne",
                    "inviteToPlay": "Inviter à jouer",
                    "accept": "Accepter",
                    "reject": "Refuser",
                    "addFriend": "Ajouter",
                    "requestSent": "Demande d'ami envoyée !",
                    "requestError": "Échec de l'envoi de la demande d'ami",
                    "searchError": "Erreur lors de la recherche",
                    "noResults": "Aucun utilisateur trouvé"
                }
            },

            'es': {
                "PONG": "<span class='spanish'>PONG</span>",
                "play": "Jugar",
                "settings": "Ajustes",
                "authenticate": "Autenticarse",
                "logout": "Cerrar sesión",
                "language": "Idioma",
                "back": "Volver",
                "english": "Inglés",
                "french": "Francés",
                "spanish": "Español",
                
                "playMenu": {
                    "title": "Jugar",
                    "local": "Local",
                    "online": "En línea",
                    "friends": "Amigos"
                },
                
                "settingsMenu": {
                    "title": "Ajustes",
                    "account": "Cuenta",
                    "language": "Idioma",
                    "audio": "Audio"
                },

                "audioMenu": {
                    "title": "Audio",
                    "ambientVolume": "Volumen ambiental",
                    "soundVolume": "Volumen de efectos"
                },

                "accountMenu": {
                    "title": "Ajustes de cuenta",
                    "id": "ID",
                    "password": "Contraseña",
                    "nickname": "Apodo",
                    "enterNickname": "Introduce tu apodo",
                    "uploadButton": "Subir",
                    "saveButton": "Guardar cambios",
                    "statistics": "Estadísticas",
                    "wins": "Victorias:",
                    "losses": "Derrotas:",
                    "idNotEditable": "Los IDs de 42 no son editables",
                    "passwordNotEditable": "Las contraseñas de 42 no son editables",
                    "profileUpdated": "Perfil actualizado con éxito",
                    "uploadError": "Error al actualizar el avatar",
                    "updateError": "Error al actualizar el perfil"
                },

                "localMenu": {
                    "quitGame": "Salir del juego"
                },

                "onlineMenu": {
                    "title": "Modo en línea",
                    "findGame": "Buscar partida",
                    "cancelSearch": "Cancelar búsqueda",
                    "searching": "Buscando oponente...",
                    "queueTime": "Tiempo en cola:",
                    "quitGame": "Salir del juego"
                },

                "friendsMenu": {
                    "title": "Amigos",
                    "searchPlaceholder": "Buscar usuarios...",
                    "myFriends": "Mis amigos",
                    "noFriends": "Aún no hay amigos ;(",
                    "friendRequests": "Solicitudes de amistad",
                    "noRequests": "No hay solicitudes pendientes",
                    "online": "En línea",
                    "offline": "Desconectado",
                    "inviteToPlay": "Invitar a jugar",
                    "accept": "Aceptar",
                    "reject": "Rechazar",
                    "addFriend": "Añadir",
                    "requestSent": "¡Solicitud de amistad enviada!",
                    "requestError": "Error al enviar la solicitud",
                    "searchError": "Error al buscar usuarios",
                    "noResults": "No se encontraron usuarios"
                },

                "authMenu": {
                    "title": "Autenticación",
                    "signIn": "Iniciar sesión",
                    "signUp": "Registrarse"
                },

                "logInMenu": {
                    "title": "Iniciar sesión",
                    "username": "Usuario",
                    "password": "Contraseña",
                    "or42": "42 intra",
                    "loginError": "Error al iniciar sesión",
                    "userDataError": "Error al obtener datos del usuario",
                    "submit": "Iniciar sesión"
                },

                "signUpMenu": {
                    "title": "Registrarse",
                    "username": "Usuario",
                    "password": "Contraseña",
                    "confirmPassword": "Confirmar contraseña",
                    "passwordMismatch": "Las contraseñas no coinciden",
                    "registrationError": "Error en el registro",
                    "submit": "Registrarse",
                    "userDataError": "Error al obtener datos del usuario"
                },
            },
        };
    }

    // Le reste du code reste inchangé
    async init() {
        if (this.initialized) return;
        this.initialized = true;
    }

    async setLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('preferredLanguage', language);
        this.notifyObservers();
    }

    translate(key) {
        const translation = this.translations[this.currentLanguage];
        if (!translation) {
            return key;
        }

        const keys = key.split('.');
        let result = translation;
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return key;
            }
        }
        return result || key;
    }

    addObserver(callback) {
        this.observers.add(callback);
    }

    removeObserver(callback) {
        this.observers.delete(callback);
    }

    notifyObservers() {
        this.observers.forEach(callback => callback());
    }
}

// Create a singleton instance
window.translationManager = window.translationManager || new TranslationManager();
window.translationManager.init();