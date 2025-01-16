class onlineMenu extends HTMLElement {
    constructor() {
        super();
        this.isSearching = false;
        this.searchTimeout = null;
        this.handleLanguageChange = this.updateContent.bind(this);
    }

    async connectedCallback() {
        const user = await window.userStatusManager?.getUser();
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
        this.stopSearching();
    }

    async updateContent() {
        this.innerHTML = `
            <div id="dynamicContent">
                <h1 id="onlineMenuTitle" class="menusTitle">
                    ${window.translationManager.translate('onlineMenu.title')}
                </h1>
                <div id="queueStatus" style="display: none;" class="text-center my-4">
                    <p>${window.translationManager.translate('onlineMenu.searching')}</p>
                    <p>${window.translationManager.translate('onlineMenu.queueTime')} <span id="queueTimer">0:00</span></p>
                </div>
                <button id="findGameButton" class="hoverLambda buttonLambda">
                    ${window.translationManager.translate(this.isSearching ? 'onlineMenu.cancelSearch' : 'onlineMenu.findGame')}
                </button>
                <button id="backButton" class="hoverLambda backButtons">
                    ${window.translationManager.translate('back')}
                </button>
            </div>
        `;

        this.setupEventListeners();
        
        // Si on était en recherche avant la mise à jour du contenu, remettre l'affichage
        if (this.isSearching) {
            const queueStatus = this.querySelector('#queueStatus');
            if (queueStatus) {
                queueStatus.style.display = 'block';
            }
        }
    }

    setupEventListeners() {
        const findGameButton = this.querySelector('#findGameButton');
        if (findGameButton) {
            findGameButton.addEventListener('mouseover', () => hoverSound.play());
            findGameButton.addEventListener('click', () => {
                playAudio('clickIn');
                if (!this.isSearching) {
                    this.startSearching();
                } else {
                    this.stopSearching();
                }
            });
        }

        const backButton = this.querySelector('#backButton');
        if (backButton) {
            backButton.addEventListener('mouseover', () => hoverSound.play());
            backButton.addEventListener('click', () => {
                playAudio('clickOut');
                this.stopSearching();
                playMenu.show();
            });
        }
    }

    startSearching() {
        this.isSearching = true;
        const findGameButton = this.querySelector('#findGameButton');
        const queueStatus = this.querySelector('#queueStatus');
        
        if (findGameButton) {
            findGameButton.textContent = window.translationManager.translate('onlineMenu.cancelSearch');
        }
        if (queueStatus) {
            queueStatus.style.display = 'block';
        }

        this.startTime = Date.now();
        this.updateQueueTimer();
        this.initializeGameSocket();
    }

    stopSearching() {
        this.isSearching = false;
        const findGameButton = this.querySelector('#findGameButton');
        const queueStatus = this.querySelector('#queueStatus');
        
        if (findGameButton) {
            findGameButton.textContent = window.translationManager.translate('onlineMenu.findGame');
        }
        if (queueStatus) {
            queueStatus.style.display = 'none';
        }

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
            this.gameSocket.send(JSON.stringify({
                type: 'leave_queue'
            }));
        }
    }

    updateQueueTimer() {
        if (!this.isSearching) return;

        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        
        const timerElement = this.querySelector('#queueTimer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        this.searchTimeout = setTimeout(() => this.updateQueueTimer(), 1000);
    }

    initializeGameSocket() {
        if (this.gameSocket) {
            this.gameSocket.close();
        }

        this.gameSocket = new WebSocket('wss://localhost:8000/ws/pong/');
        
        this.gameSocket.onopen = () => {
            this.gameSocket.send(JSON.stringify({
                type: 'join_queue'
            }));
        };

        this.gameSocket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'game_found' && data.game_id) {
                    this.stopSearching();
                    const gameId = data.game_id;
                    const playerSide = data.player_side;
                    
                    const container = document.getElementById('dynamicContent');
                    if (container) {
                        container.innerHTML = '';
                        const gameComponent = document.createElement('online-game');
                        await gameComponent.initGame(gameId, playerSide);
                        container.appendChild(gameComponent);
                    }
                }
            } catch (error) {
                console.error('Error in online menu websocket message:', error);
            }
        };

        this.gameSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.stopSearching();
        };

        this.gameSocket.onclose = () => {
            if (this.isSearching) {
                this.stopSearching();
            }
        };
    }

    static show() {
        const container = document.getElementById('dynamicContent');
        container.innerHTML = '';
        const onlineMenuComponent = document.createElement('online-menu');
        container.appendChild(onlineMenuComponent);
    }
}

customElements.define('online-menu', onlineMenu);