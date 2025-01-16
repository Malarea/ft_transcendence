class onlineGame extends HTMLElement {
    constructor() {
        super();
        this.gameId = null;
        this.canvas = null;
        this.ctx = null;
        this.gameSocket = null;
        this.gameLoop = null;
        this.playerSide = null;
        this.keys = {};
        this.gameEnded = false;

        // État initial du jeu
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
        this.innerHTML = `
            <div class="game-container">
                <div class="game-view">
                    <div class="score-board">
                        <div class="score">
                            <span id="leftScore">0</span>
                            <span class="score-separator">-</span>
                            <span id="rightScore">0</span>
                        </div>
                    </div>
                    <div style="position: relative;">
                        <canvas id="pongCanvas" width="800" height="600" class="pong-canvas"></canvas>
                        <div id="gameMessage" style="
                            display: none;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background-color: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 20px 40px;
                            border-radius: 5px;
                            font-size: 24px;
                            text-align: center;
                            z-index: 1000;
                        "></div>
                    </div>
                    <div class="game-controls">
                        <button id="quitGame" class="buttonLambda hoverLambda">Quit Game</button>
                    </div>
                </div>
            </div>
        `;

        this.canvas = this.querySelector('#pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.boundHandleKeyDown);
        document.addEventListener('keyup', this.boundHandleKeyUp);

        const quitButton = this.querySelector('#quitGame');
        if (quitButton) {
            quitButton.addEventListener('click', () => {
                playAudio('clickIn');
                this.cleanupAndQuit();
            });
            quitButton.addEventListener('mouseover', () => hoverSound.play());
        }
    }
    
    handleKeyDown(event) {
        const isLeftPlayer = this.playerSide === 'left';
        const isRightPlayer = this.playerSide === 'right';
    
        if (isLeftPlayer && (event.code === 'KeyW' || event.code === 'KeyS')) {
            event.preventDefault();
            this.keys[event.code] = true;
        } else if (isRightPlayer && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) {
            event.preventDefault();
            this.keys[event.code] = true;
        }
    }

    handleKeyUp(event) {
        const isLeftPlayer = this.playerSide === 'left';
        const isRightPlayer = this.playerSide === 'right';
    
        if (isLeftPlayer && (event.code === 'KeyW' || event.code === 'KeyS')) {
            event.preventDefault();
            this.keys[event.code] = false;
        } else if (isRightPlayer && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) {
            event.preventDefault();
            this.keys[event.code] = false;
        }
    }

    async initGame(gameId, playerSide) {
        this.gameId = gameId;
        this.playerSide = playerSide;
        
        // Configurer les contrôles selon le côté
        if (playerSide === 'left') {
            this.keys = {
                'KeyW': false,
                'KeyS': false
            };
        } else if (playerSide === 'right') {
            this.keys = {
                'ArrowUp': false,
                'ArrowDown': false
            };
        } else {
            console.error('Invalid player side:', playerSide);
        }
    
        await this.setupWebSocket();
        this.startGameLoop();
    }

    setupWebSocket() {
        if (this.gameSocket) {
            this.gameSocket.close();
        }
    
        return new Promise((resolve, reject) => {
            this.gameSocket = new WebSocket('wss://localhost:8000/ws/pong/');
            
            this.gameSocket.onopen = () => {
                const joinMessage = {
                    type: 'join_game',
                    game_id: this.gameId,
                    player_side: this.playerSide
                };
                this.gameSocket.send(JSON.stringify(joinMessage));
                resolve();
            };
    
            // Limiter la fréquence des mises à jour pour éviter les lags
            this.gameSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'game_update' && data.data) {
                        window.requestAnimationFrame(() => {
                            this.updateGameState(data.data);
                        });
                    }
                } catch (error) {
                    console.error('Error processing game update:', error);
                }
            };
    
            this.gameSocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
        });
    }


     updateGameState(newState) {
        if (newState && typeof newState === 'object') {
            // Mise à jour du score
            if (newState.score) {
                const leftScore = this.querySelector('#leftScore');
                const rightScore = this.querySelector('#rightScore');
                if (leftScore) leftScore.textContent = newState.score.left;
                if (rightScore) rightScore.textContent = newState.score.right;
                
                // Vérifier la condition de victoire
                if (!this.gameEnded && (newState.score.left >= 1 || newState.score.right >= 1)) {
                    this.handleGameEnd(newState.score);
                }
            }
            
            // Mise à jour de l'état
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
            
            // Dessiner l'état mis à jour
            this.draw(this.gameState);
        }
    }

    async handleGameEnd(score) {
        this.gameEnded = true;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    
        const messageElement = document.getElementById('gameMessage');
        if (messageElement) {
            const isLeftWinner = score.left >= 1;
            const winner = isLeftWinner ? 'Left' : 'Right';
            messageElement.textContent = `${winner} player wins!`;
            messageElement.style.display = 'block';
            
            // Ajouter une animation de fade in
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.5s ease-in-out';
            setTimeout(() => {
                messageElement.style.opacity = '1';
            }, 50);
    
            // Envoyer le résultat au serveur
            try {
                const csrfResponse = await fetch('https://localhost:8000/auth/csrf/', {
                    credentials: 'include'
                });
                const csrfData = await csrfResponse.json();
                
                await fetch('https://localhost:8000/api/game-result/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfData.csrfToken
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        game_id: this.gameId,
                        won: (isLeftWinner && this.playerSide === 'left') || 
                             (!isLeftWinner && this.playerSide === 'right')
                    })
                });
            } catch (error) {
                console.error('Error updating game result:', error);
            }
        }
    
        // Retourner au menu après un délai
        setTimeout(() => {
            this.returnToMenu();
        }, 3000);
    }
        
    async returnToMenu() {
        await window.userStatusManager?.updateUser();

        const container = document.getElementById('dynamicContent');
        if (container) {
            container.innerHTML = '';
            onlineMenu.show();
        }
    }

    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    
        const loop = (currentTime) => {
            try {
                if (!this.gameId) return;
                
                // Vérifier et envoyer les mouvements des raquettes
                this.checkPaddleMovements(currentTime);
                
                // Continuer la boucle
                this.gameLoop = requestAnimationFrame(loop);
            } catch (error) {
                console.error('Error in game loop:', error);
            }
        };
    
        this.gameLoop = requestAnimationFrame(loop);
    }

    checkPaddleMovements(currentTime) {
        if (currentTime - this.lastPaddleUpdate < 25) {
            return;
        }
    
        let movementOccurred = false;
    
        // N'envoyer que les mouvements du côté du joueur
        if (this.playerSide === 'left') {
            if (this.keys['KeyW']) {
                this.sendPlayerAction('moove_up');
                movementOccurred = true;
            } else if (this.keys['KeyS']) {
                this.sendPlayerAction('moove_down');
                movementOccurred = true;
            }
        } else if (this.playerSide === 'right') {
            if (this.keys['ArrowUp']) {
                this.sendPlayerAction('moove_up');
                movementOccurred = true;
            } else if (this.keys['ArrowDown']) {
                this.sendPlayerAction('moove_down');
                movementOccurred = true;
            }
        }
    
        if (movementOccurred) {
            this.lastPaddleUpdate = currentTime;
        }
    }

    async handleOpponentDisconnect() {
        // Arrêter la boucle de jeu immédiatement
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    
        // Message
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = "Opponent disconnected";
        const container = this.querySelector('.game-view');
        if (container) {
            container.appendChild(messageElement);
        }
    
        // Retourner au menu après 2 secondes
        setTimeout(() => {
            this.cleanupAndQuit();
        }, 2000);
    }

    sendPlayerAction(action) {
        if (!this.gameSocket || !this.gameId || !this.playerSide) {
            console.error('Cannot send action: missing data', {
                gameSocket: !!this.gameSocket,
                gameId: this.gameId,
                playerSide: this.playerSide
            });
            return;
        }
    
        const message = {
            type: 'player_action',
            action: action,
            player: this.playerSide,
            game_id: this.gameId
        };
        this.gameSocket.send(JSON.stringify(message));
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

        // Raquettes
        ctx.fillStyle = 'white';
        ctx.fillRect(20, state.leftPaddle.y, 10, 100);
        ctx.fillRect(770, state.rightPaddle.y, 10, 100);

        // Balle
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
        ctx.fill();
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

        if (this.gameSocket) {
            this.gameSocket.close();
            this.gameSocket = null;
        }

        this.gameId = null;
        this.canvas = null;
        this.ctx = null;

        const container = document.getElementById('dynamicContent');
        if (container) {
            container.innerHTML = '';
            playMenu.show();
        }
    }

    disconnectedCallback() {
        this.cleanupAndQuit();
    }
}

customElements.define('online-game', onlineGame);