class mainMenu extends HTMLElement {
    constructor() {
        super();
        this.checkAuthFragment();
        this.handleLanguageChange = this.updateContent.bind(this);
    }

    async connectedCallback() {
        // S'assurer que le TranslationManager est initialisé
        await window.translationManager.init();
        // Add observer for language changes
        window.translationManager.addObserver(this.handleLanguageChange);
        await this.updateContent();
    }

    disconnectedCallback() {
        // Remove observer when component is destroyed
        window.translationManager.removeObserver(this.handleLanguageChange);
    }

    async checkAuthFragment() {
        if (window.location.hash.startsWith('#auth=')) {
            try {
                const encoded = window.location.hash.substring(6);
                const decoded = atob(encoded);
                const user = await window.userStatusManager?.updateUser();
                
                const authData = JSON.parse(decoded);
                if (authData.isLoggedIn) {
                    window.location.hash = '';
                    document.dispatchEvent(new CustomEvent('userLoggedIn', { 
                        detail: authData 
                    }));
                    mainMenu.show();
                }
            } catch (error) {
                console.error('Error parsing auth data:', error);
            }
        }
    }

    async updateContent() {
        const user = window.userStatusManager?.getUser();
        this.innerHTML = `
            <div id="dynamicContent">
                <button id="pongButton" class="stealthButton FadeIn" 
                        style="font-size: 12em; color: white; margin-bottom: 0.1em;">
                        ${window.translationManager.translate('PONG')}
                </button>
                <button id="playButton" class="buttonLambda hoverLambda">
                    ${window.translationManager.translate('play')}
                </button>
                <button id="settingsButton" class="buttonLambda hoverLambda">
                    ${window.translationManager.translate('settings')}
                </button>
                ${user 
                    ? `<button id="logoutButton" class="buttonLambda hoverLambda">
                         ${window.translationManager.translate('logout')}
                       </button>`
                    : `<button id="authenticateButton" class="buttonLambda hoverLambda">
                         ${window.translationManager.translate('authenticate')}
                       </button>`
                }
            </div>
        `;
        this.setupEventListeners();
    }

    async setupEventListeners() {
        const playButton = this.querySelector('#playButton');
        if (playButton) {
            playButton.addEventListener('mouseover', () => hoverSound.play());
            playButton.addEventListener('click', () => {
                playAudio('clickIn');
                playMenu.show();
            });
        }   

        const settingsButton = this.querySelector('#settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('mouseover', () => hoverSound.play());
            settingsButton.addEventListener('click', () => {
                playAudio('clickIn');
                settingsMenu.show();
            });
        }

        const authenticateButton = this.querySelector('#authenticateButton');
        if (authenticateButton) {
            authenticateButton.addEventListener('mouseover', () => hoverSound.play());
            authenticateButton.addEventListener('click', () => {
                playAudio('clickIn');
                authenticationMenu.show();
            });
        }

        const logoutButton = this.querySelector('#logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('mouseover', () => hoverSound.play());
            logoutButton.addEventListener('click', handleLogout);
        }
    }

    static async show() {
        const mainMenuContainer = document.getElementById('dynamicContent');
        if (mainMenuContainer) {
            mainMenuContainer.innerHTML = '';
            const mainMenuComponent = document.createElement('main-menu');
            mainMenuContainer.appendChild(mainMenuComponent);
            const user = window.userStatusManager?.getUser();
            if (user) {
                window.userStatusManager.updateStatus(true);
            }
        } else {
            console.error('dynamicContent element not found');
        }
    }
}


class initialPage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {

        this.innerHTML = `
            <div id="dynamicContent">
                <button id="initialPongButton" class="hoverLambda" 
                        style="font-size: 18em; width: 100%; height: 100%;">
                    PONG
                </button>
            </div>
        `;

        const button = this.querySelector('#initialPongButton');
        button.addEventListener('click', () => {
            playAudio('pongAudio');
            playAudio('backgroundAudio');
            document.body.classList.add('animationActive');
            setTimeout(() => {
                button.classList.add('fadeOut');
            }, 1000);
            setTimeout(() => {
                mainMenu.show();
            }, 30);
        });
    }

    static async show() {
        const container = document.getElementById('dynamicContent');
        container.innerHTML = '';
        const initialPageComponent = document.createElement('initial-page');
        container.appendChild(initialPageComponent);
    }
}

window.updateFriendStatus = (userId, isOnline) => {
    const friendElement = document.querySelector(`[data-user-id="${userId}"]`);
    if (friendElement) {
        const statusElement = friendElement.querySelector('.friend-status');
        if (statusElement) {
            statusElement.textContent = isOnline ? 'Online' : 'Offline';
            statusElement.className = `friend-status ${isOnline ? 'online' : 'offline'}`;
        }
    }
};

customElements.define('main-menu', mainMenu);
customElements.define('initial-page', initialPage);

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.hash.startsWith('#auth=')) {
        const mainMenuComponent = document.createElement('main-menu');
        document.getElementById('dynamicContent').appendChild(mainMenuComponent);
    } else {
        const user = window.userStatusManager?.getUser();
        if (user) {
            mainMenu.show();
        } else {
            initialPage.show();
        }
    }
});