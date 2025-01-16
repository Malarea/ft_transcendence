class languageMenu extends HTMLElement {
    constructor() {
        super();
        this.handleLanguageChange = this.updateContent.bind(this);
    }

    async connectedCallback() {
        await window.translationManager.init();
        window.translationManager.addObserver(this.handleLanguageChange);
        await this.updateContent();
    }

    disconnectedCallback() {
        window.translationManager.removeObserver(this.handleLanguageChange);
    }

    async updateContent() {
        this.innerHTML = `
            <div id="dynamicContent">
                <h1 id="languageMenuTitle" class="menusTitle">
                    ${window.translationManager.translate('language')}
                </h1>
                <button id="englishButton" class="hoverLambda buttonLambda ${window.translationManager.currentLanguage === 'en' ? 'selected' : ''}">
                    ${window.translationManager.translate('english')}
                </button>
                <button id="frenchButton" class="hoverLambda buttonLambda ${window.translationManager.currentLanguage === 'fr' ? 'selected' : ''}">
                    ${window.translationManager.translate('french')}
                </button>
                <button id="spanishButton" class="hoverLambda buttonLambda ${window.translationManager.currentLanguage === 'es' ? 'selected' : ''}">
                    ${window.translationManager.translate('spanish')}
                </button>
                <button id="backButton" class="hoverLambda backButtons">
                    ${window.translationManager.translate('back')}
                </button>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Bouton anglais
        const englishButton = this.querySelector('#englishButton');
        if (englishButton) {
            englishButton.addEventListener('mouseover', () => hoverSound.play());
            englishButton.addEventListener('click', async () => {
                playAudio('clickIn');
                await window.translationManager.setLanguage('en');
            });
        }

        // Bouton français
        const frenchButton = this.querySelector('#frenchButton');
        if (frenchButton) {
            frenchButton.addEventListener('mouseover', () => hoverSound.play());
            frenchButton.addEventListener('click', async () => {
                playAudio('clickIn');
                await window.translationManager.setLanguage('fr');
            });
        }

        // Bouton espagnol (maintenant activé)
        const spanishButton = this.querySelector('#spanishButton');
        if (spanishButton) {
            spanishButton.addEventListener('mouseover', () => hoverSound.play());
            spanishButton.addEventListener('click', async () => {
                playAudio('clickIn');
                await window.translationManager.setLanguage('es');
            });
        }

        // Bouton retour
        const backButton = this.querySelector('#backButton');
        if (backButton) {
            backButton.addEventListener('mouseover', () => hoverSound.play());
            backButton.addEventListener('click', () => {
                playAudio('clickOut');
                settingsMenu.show();
            });
        }
    }

    static show() {
        const languageMenu = document.getElementById('dynamicContent');
        languageMenu.innerHTML = '';
        const languageMenuComponent = document.createElement('language-menu');
        languageMenu.appendChild(languageMenuComponent);
    }
}

customElements.define('language-menu', languageMenu);