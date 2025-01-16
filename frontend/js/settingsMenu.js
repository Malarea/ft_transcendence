class settingsMenu extends HTMLElement {
    constructor() {
        super();
        this.handleLanguageChange = this.updateContent.bind(this);
    }

    async connectedCallback() {
        const user = window.userStatusManager?.getUser();
        if (!user) {
            mainMenu.show();
            return;
        }
        await window.translationManager.init();
        window.translationManager.addObserver(this.handleLanguageChange);
        await this.updateContent();
    }

    disconnectedCallback() {
        window.translationManager.removeObserver(this.handleLanguageChange);
    }

    async updateContent() {
        const user = window.userStatusManager?.getUser();
        
        this.innerHTML = `
        <div id="dynamicContent">
            <h1 id="settingsMenuTitle" class="menusTitle">
                ${window.translationManager.translate('settingsMenu.title')}
            </h1>
            ${user ? `<button id="accountButton" class="hoverLambda buttonLambda">
                        ${window.translationManager.translate('settingsMenu.account')}
                      </button>` : ''}
            <button id="languageButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('settingsMenu.language')}
            </button>
            <button id="audioButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('settingsMenu.audio')}
            </button>
            <button id="backButton" class="hoverLambda backButtons">
                ${window.translationManager.translate('back')}
            </button>
        </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Setup des event listeners seulement si le bouton existe (utilisateur connecté)
        const accountButton = this.querySelector('#accountButton');
        if (accountButton) {
            accountButton.addEventListener('mouseover', () => hoverSound.play());
            accountButton.addEventListener('click', () => {
                playAudio('clickIn');
                accountMenu.show();
            });
        }
        
        this.querySelector('#languageButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#languageButton').addEventListener('click', () => {
            playAudio('clickIn');
            languageMenu.show();
        });

        this.querySelector('#audioButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#audioButton').addEventListener('click', () => {
            playAudio('clickIn');
            audioMenu.show();
        });

        this.querySelector('#backButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#backButton').addEventListener('click', () => {
            playAudio('clickOut');
            mainMenu.show();
        });
    }

    static async show() {
        const settingsMenu = document.getElementById('dynamicContent');
        settingsMenu.innerHTML = '';
        const settingsMenuComponent = document.createElement('settings-menu');
        settingsMenu.appendChild(settingsMenuComponent);
    }
}

customElements.define('settings-menu', settingsMenu);