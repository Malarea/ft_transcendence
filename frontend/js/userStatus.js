class UserStatusManager {
    constructor() {
        this.user = null;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.statusListeners = new Set();
        this.isConnecting = false;
        this.authCheckPromise = null;
        this.lastCheck = 0;
        this.cacheTimeout = 1000; // 1 seconde
    }

    startListening() {
        window.addEventListener('focus', () => {
            if (this.isAuthenticated()) {
                this.reconnect();
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isAuthenticated()) {
                this.reconnect();
            }
        });
    }

    isAuthenticated() {
        return this.user !== null;
    }

    getUser() {
        return this.user;
    }

    async updateUser() {

        try {
            const response = await fetch('https://localhost:8000/auth/user/', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                this.user = await response.json();

            } else {

                this.user = null;
            }
            return this.user;
        } catch (error) {
            console.error('Error updating user:', error);
            this.user = null;
            return null;
        }
    }

    async connect() {
        if (this.isConnecting || this.connected || !this.user) return;

        try {
            this.isConnecting = true;
            this.socket = new WebSocket(`wss://${window.location.hostname}:8000/ws/user_status/`);

            this.socket.onopen = () => {
                this.updateStatus(true);
                
                this.connected = true;
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                this.updateStatus(true);
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'status_update') {
                    this.notifyStatusChange(data.user_id, data.is_online);
                }
            };

            this.socket.onclose = () => {
                this.connected = false;
                this.isConnecting = false;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.reconnect(), 5000);
                }
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.isConnecting = false;
        }
    }

    async reconnect() {
        if (!this.user || this.isConnecting || this.connected) return;
        await this.connect();
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.connected = false;
        this.isConnecting = false;
        this.user = null;
    }

    addStatusListener(callback) {
        this.statusListeners.add(callback);
    }

    removeStatusListener(callback) {
        this.statusListeners.delete(callback);
    }

    notifyStatusChange(userId, isOnline) {
        this.statusListeners.forEach(callback => callback(userId, isOnline));
    }

    async updateStatus(isOnline) {
        if (!this.user) return;
    
        try {
            // D'abord obtenir le CSRF token
            const csrfResponse = await fetch('https://localhost:8000/auth/csrf/', {
                credentials: 'include'
            });
            const { csrfToken } = await csrfResponse.json();
    
            const response = await fetch('https://localhost:8000/auth/update-status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken  // Ajout du CSRF token
                },
                credentials: 'include',
                body: JSON.stringify({ is_online: isOnline })
            });
    
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }
}

window.userStatusManager = new UserStatusManager();

document.addEventListener('DOMContentLoaded', () => {
    window.userStatusManager.startListening();
});

document.addEventListener('userLoggedIn', (event) => {
    window.userStatusManager.user = event.detail;
    window.userStatusManager.connect();
});

document.addEventListener('userLoggedOut', () => {
    window.userStatusManager.disconnect();
});