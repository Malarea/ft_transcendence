class playMenu extends HTMLElement {
    constructor() {
        super();
        this.handleLanguageChange = this.updateContent.bind(this);
    }

    async connectedCallback() {
        const user = await window.userStatusManager?.getUser();
        if(!user) {
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
        this.innerHTML = `
        <div id="dynamicContent">
            <h1 id="playMenuTitle" class="menusTitle">
                ${window.translationManager.translate('playMenu.title')}
            </h1>
            <button id="localButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('playMenu.local')}
            </button>
            <button id="onlineButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('playMenu.online')}
            </button>
            <button id="friendsButton" class="hoverLambda buttonLambda">
                ${window.translationManager.translate('playMenu.friends')}
            </button>
            <button id="backButton" class="hoverLambda backButtons">
                ${window.translationManager.translate('back')}
            </button>
        </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.querySelector('#localButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#localButton').addEventListener('click', () => {
            playAudio('clickIn');
            localMenu.show();
        });

        this.querySelector('#onlineButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#onlineButton').addEventListener('click', () => {
            playAudio('clickIn');
            onlineMenu.show();
        });

        this.querySelector('#friendsButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#friendsButton').addEventListener('click', () => {
            playAudio('clickIn');
            friendsMenu.show();
        });

        this.querySelector('#backButton').addEventListener('mouseover', () => hoverSound.play());
        this.querySelector('#backButton').addEventListener('click', () => {
            playAudio('clickOut');
            mainMenu.show();
        });
    }

    static show() {
        const playMenu = document.getElementById('dynamicContent');
        playMenu.innerHTML = '';
        const playMenuComponent = document.createElement('play-menu');
        playMenu.appendChild(playMenuComponent);
    }
}

customElements.define('play-menu', playMenu);