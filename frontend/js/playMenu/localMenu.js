class localMenu extends HTMLElement {
    constructor() {
        super();
        this.gameId = null;
        this.canvas = null;
        this.ctx = null;
        this.gameSocket = null;
        this.gameLoop = null;
        this.handleLanguageChange = this.updateContent.bind(this);
        this.keys = {
            'KeyW': false,
            'KeyS': false,
            'ArrowUp': false,
            'ArrowDown': false
        };
        this.gameState = {
            ball: { x: 400, y: 300 },
            leftPaddle: { y: 250 },
            rightPaddle: { y: 250 },
            score: { left: 0, right: 0 }
        };
        this.lastPaddleUpdate = 0;
        this.paddleUpdateInterval = 16;
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    }


    async connectedCallback() {
        await window.translationManager.init();
        window.translationManager.addObserver(this.handleLanguageChange);
        await this.updateContent();
    }

    disconnectedCallback() {
        window.translationManager.removeObserver(this.handleLanguageChange);
        this.cleanupAndQuit();
    }

    async updateContent() {
        this.innerHTML = `
            <div class="game-container">
                <div class="game-view">
                    <div class="score-board">
                        <span id="leftScore">0</span>
                        <span>-</span>
                        <span id="rightScore">0</span>
                    </div>
                    <canvas id="pongCanvas" width="800" height="600" class="pong-canvas"></canvas>
                    <div class="game-controls">
                        <button id="quitGame" class="buttonLambda hoverLambda">
                            ${window.translationManager.translate('localMenu.quitGame')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.canvas = this.querySelector('#pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        await this.startGame();
    }


    setupEventListeners() {
        document.addEventListener('keydown', this.boundHandleKeyDown);
        document.addEventListener('keyup', this.boundHandleKeyUp);

        const quitButton = this.querySelector('#quitGame');
        if (quitButton) {
            quitButton.addEventListener('mouseover', () => hoverSound.play());
            quitButton.addEventListener('click', () => {
                playAudio('clickIn');
                this.cleanupAndQuit();
            });
        }

        document.addEventListener('keydown', this.boundHandleKeyPress);
    }

    handleKeyDown(event) {
        // Utiliser event.code au lieu de event.key
        if (this.keys.hasOwnProperty(event.code)) {
            event.preventDefault();
            this.keys[event.code] = true;
        }
    }

    handleKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            event.preventDefault();
            this.keys[event.code] = false;
        }
    }

    async startGame() {
        try {
            const csrfResponse = await fetch('https://localhost:8000/auth/csrf/', { 
                credentials: 'include' 
            });
            const csrfData = await csrfResponse.json();
            
            const response = await fetch('https://localhost:8000/api/start-game/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfData.csrfToken
                }
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to start game');
            }
    
            const data = await response.json();
            this.gameId = data.game_id;
            
            this.setupWebSocket();
            this.startGameLoop();
    
        } catch (error) {
            console.error('Error starting game:', error);
            this.cleanupAndQuit();
        }
    }

    setupWebSocket() {
        if (this.gameSocket) {
            this.gameSocket.close();
        }

        this.gameSocket = new WebSocket('wss://localhost:8000/ws/pong/');
        
        this.gameSocket.onopen = () => {
            if (this.gameId) {
                this.gameSocket.send(JSON.stringify({
                    type: 'join_game',
                    game_id: this.gameId
                }));
            }
        };

        this.gameSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'game_update' && data.data) {
                    this.updateGameState(data.data);
                }
            } catch (error) {
                console.error('Error processing game update:', error);
            }
        };

        this.gameSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    updateGameState(newState) {
        // Vérifier que le nouvel état est valide
        if (newState && typeof newState === 'object') {
            // Fusionner avec l'état existant pour éviter les propriétés undefined
            this.gameState = {
                ball: {
                    x: newState.ball?.x ?? this.gameState.ball.x,
                    y: newState.ball?.y ?? this.gameState.ball.y
                },
                leftPaddle: {
                    y: newState.leftPaddle?.y ?? this.gameState.leftPaddle.y
                },
                rightPaddle: {
                    y: newState.rightPaddle?.y ?? this.gameState.rightPaddle.y
                },
                score: {
                    left: newState.score?.left ?? this.gameState.score.left,
                    right: newState.score?.right ?? this.gameState.score.right
                }
            };

            // Mettre à jour le score affiché
            const leftScore = this.querySelector('#leftScore');
            const rightScore = this.querySelector('#rightScore');
            if (leftScore) leftScore.textContent = this.gameState.score.left;
            if (rightScore) rightScore.textContent = this.gameState.score.right;
        }
    }

    lerp(start, end, alpha) {
        return start * (1 - alpha) + end * alpha;
    }

    startGameLoop() {
        let lastTime = performance.now();

        const gameLoop = (currentTime) => {
            if (!this.gameId) return;

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Vérifier et envoyer les mouvements des raquettes
            this.checkPaddleMovements(currentTime);

            // Dessiner l'état actuel
            if (this.gameState) {
                this.draw(this.gameState);
            }

            this.gameLoop = requestAnimationFrame(gameLoop);
        };

        this.gameLoop = requestAnimationFrame(gameLoop);
    }

    checkPaddleMovements(currentTime) {
        // Augmenter l'intervalle à 50ms (20 updates par seconde) au lieu de 35ms
        if (currentTime - this.lastPaddleUpdate < 20) {
            return;
        }
    
        let movementOccurred = false;
    
        if (this.keys['KeyW']) {
            this.sendPlayerAction('left', 'moove_up');
            movementOccurred = true;
        } else if (this.keys['KeyS']) {
            this.sendPlayerAction('left', 'moove_down');
            movementOccurred = true;
        }
    
        if (this.keys['ArrowUp']) {
            this.sendPlayerAction('right', 'moove_up');
            movementOccurred = true;
        } else if (this.keys['ArrowDown']) {
            this.sendPlayerAction('right', 'moove_down');
            movementOccurred = true;
        }
    
        // Ne mettre à jour lastPaddleUpdate que si un mouvement a eu lieu
        if (movementOccurred) {
            this.lastPaddleUpdate = currentTime;
        }
    }

    async sendPlayerAction(player, action) {
        if (!this.gameSocket || !this.gameId) return;

        this.gameSocket.send(JSON.stringify({
            type: 'player_action',
            player: player,
            action: action,
            game_id: this.gameId
        }));
    }

    handleKeyPress(event) {
        if (!this.gameId || !this.gameSocket) return;

        let action = null;
        let player = null;

        switch (event.code) {
            case 'KeyW':
                action = 'moove_up';
                player = 'left';
                break;
            case 'KeyS':
                action = 'moove_down';
                player = 'left';
                break;
            case 'ArrowUp':
                action = 'moove_up';
                player = 'right';
                break;
            case 'ArrowDown':
                action = 'moove_down';
                player = 'right';
                break;
        }

        if (action && player) {
            const message = {
                type: 'player_action',
                action: action,
                player: player,
                game_id: this.gameId
            };

            this.gameSocket.send(JSON.stringify(message));
        }
    }

    draw(state) {
        if (!this.ctx || !this.canvas || !state) return;

        const ctx = this.ctx;
        
        // Effacer le canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Ligne centrale
        ctx.strokeStyle = 'white';
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 0);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vérifier l'existence des propriétés avant de dessiner
        if (state.leftPaddle && state.rightPaddle) {
            // Raquettes
            ctx.fillStyle = 'white';
            ctx.fillRect(20, state.leftPaddle.y, 10, 100);
            ctx.fillRect(770, state.rightPaddle.y, 10, 100);
        }

        // Balle
        if (state.ball) {
            ctx.beginPath();
            ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    async cleanupAndQuit() {
        document.removeEventListener('keydown', this.boundHandleKeyDown);
        document.removeEventListener('keyup', this.boundHandleKeyUp);

        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }

        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.gameId) {
            try {
                const csrfResponse = await fetch('https://localhost:8000/auth/csrf/', {
                    credentials: 'include'
                });
                const csrfData = await csrfResponse.json();

                await fetch(`https://localhost:8000/api/quit-game/${this.gameId}/`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfData.csrfToken
                    }
                });
            } catch (error) {
                console.error('Error quitting game:', error);
            }
        }

        // Nettoyer les ressources et retourner au menu principal
        const container = document.getElementById('dynamicContent');
        if (container) {
            container.innerHTML = '';
            playMenu.show();
        }
    }


    disconnectedCallback() {
        this.cleanupAndQuit();
    }
    
    static show() {
        const localMenu = document.getElementById('dynamicContent');
        localMenu.innerHTML = '';
        const gameComponent = document.createElement('pong-game');
        localMenu.appendChild(gameComponent);
    }
}

customElements.define('pong-game', localMenu);