class authenticationMenu extends HTMLElement {
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
            <h1 id="authenticationMenuTitle" class="menusTitle">
                ${window.translationManager.translate('authMenu.title')}
            </h1>
            <button id="signInButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('authMenu.signIn')}
            </button>
            <button id="signUpButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('authMenu.signUp')}
            </button>
            <button id="backButton" class="hoverLambda backButtons">
                ${window.translationManager.translate('back')}
            </button>
        </div>
        `;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.querySelector('#signInButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#signInButton').addEventListener('click', () => {
            playAudio('clickIn');
            logInMenu.show();
        });

        this.querySelector('#signUpButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#signUpButton').addEventListener('click', () => {
            playAudio('clickIn');
            signUpMenu.show();
        });

        this.querySelector('#backButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#backButton').addEventListener('click', () => {
            playAudio('clickOut');
            mainMenu.show();
        });
    }

    static show() {
        const authenticationMenu = document.getElementById('dynamicContent');
        authenticationMenu.innerHTML = '';
        const authenticationMenuComponent = document.createElement('authentication-menu');
        authenticationMenu.appendChild(authenticationMenuComponent);
    }
}

customElements.define('authentication-menu', authenticationMenu);