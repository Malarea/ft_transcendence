class signUpMenu extends HTMLElement {
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

    async getCsrfToken() {
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

    async updateContent() {
        this.innerHTML = `
        <div id="dynamicContent">
            <h1 id="signUpMenuTitle" class="menusTitle">
                ${window.translationManager.translate('signUpMenu.title')}
            </h1>
            <form id="signUpForm">
                <input id="usernameInput" class="inputLambda" type="text" 
                    placeholder="${window.translationManager.translate('signUpMenu.username')}" required>
                <input id="passwordInput" class="inputLambda" type="password" 
                    placeholder="${window.translationManager.translate('signUpMenu.password')}" required>
                <input id="secondPasswordInput" class="inputLambda" type="password" 
                    placeholder="${window.translationManager.translate('signUpMenu.confirmPassword')}" required>
                <button type="submit" id="signUpButton" style="margin-top: 1vh;" class="hoverLambda">
                    ${window.translationManager.translate('signUpMenu.submit')}
                </button>
            </form>
            <button id="backButton" class="hoverLambda backButtons">
                ${window.translationManager.translate('back')}
            </button>
        </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = this.querySelector('#signUpForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = this.querySelector('#usernameInput').value;
            const password = this.querySelector('#passwordInput').value;
            const confirmPassword = this.querySelector('#secondPasswordInput').value;
        
            if (password !== confirmPassword) {
                alert(window.translationManager.translate('signUpMenu.passwordMismatch'));
                return;
            }
        
            try {
                const response = await window.register(username, password);
                const user = await window.userStatusManager.updateUser();
                if (user) {
                    document.dispatchEvent(new CustomEvent('userLoggedIn', { 
                        detail: user 
                    }));
                    window.userStatusManager.connect();
                    mainMenu.show();
                } else {
                    throw new Error(window.translationManager.translate('signUpMenu.userDataError'));
                }
            } catch (error) {
                console.error("Registration error:", error);
                alert(window.translationManager.translate('signUpMenu.registrationError') + ': ' + error.message);
            }
        });    
    
        const signUpButton = this.querySelector('#signUpButton');
        const backButton = this.querySelector('#backButton');

        if (signUpButton) {
            signUpButton.addEventListener('mouseover', () => hoverSound.play());
        }

        if (backButton) {
            backButton.addEventListener('mouseover', () => hoverSound.play());
            backButton.addEventListener('click', () => {
                playAudio('clickOut');
                authenticationMenu.show();
            });
        }
    }

    static show() {
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = '';
            const signUpMenuComponent = document.createElement('sign-up-menu');
            dynamicContent.appendChild(signUpMenuComponent);
        }
    }
}

customElements.define('sign-up-menu', signUpMenu);