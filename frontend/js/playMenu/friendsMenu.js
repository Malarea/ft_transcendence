class friendsMenu extends HTMLElement {
    constructor() {
        super();
        this.statusUpdateCallback = this.updateFriendStatus.bind(this);
        this.handleLanguageChange = this.updateContent.bind(this);
    }

    async connectedCallback() {
        try {
            const user = window.userStatusManager?.getUser();
            if (!user) {
                mainMenu.show();
                return;
            }

            await window.translationManager.init();
            window.translationManager.addObserver(this.handleLanguageChange);
            await this.updateContent();

            if (window.userStatusManager) {
                window.userStatusManager.addStatusListener(this.statusUpdateCallback);
                window.userStatusManager.connect();
            }
            
            this.friendRequestInterval = setInterval(() => {
                this.loadFriendRequests();
            }, 5000);
        }
        catch (error) {
            console.error('Error in friendsMenu:', error);
            mainMenu.show();
        }
    }

    disconnectedCallback() {
        window.translationManager.removeObserver(this.handleLanguageChange);
        if (window.userStatusManager) {
            window.userStatusManager.removeStatusListener(this.statusUpdateCallback);
        }
        if (this.friendRequestInterval) {
            clearInterval(this.friendRequestInterval);
        }
    }

    async updateContent() {
        this.innerHTML = `
            <div id="dynamicContent">
                <h1 id="friendMenuTitle" class="menusTitle">
                    ${window.translationManager.translate('friendsMenu.title')}
                </h1>
                
                <div class="search-section">
                    <input type="text" id="searchInput" class="inputLambda" 
                        placeholder="${window.translationManager.translate('friendsMenu.searchPlaceholder')}">
                    <div id="searchResults" class="search-results"></div>
                </div>

                <div class="friends-section">
                    <h2>${window.translationManager.translate('friendsMenu.myFriends')}</h2>
                    <div id="friendsList" class="friends-list"></div>
                </div>

                <div class="friend-requests-section">
                    <h2>${window.translationManager.translate('friendsMenu.friendRequests')}</h2>
                    <div id="friendRequestsList" class="friend-requests-list"></div>
                </div>

                <button id="friendsBackButton" class="hoverLambda backButtons">
                    ${window.translationManager.translate('back')}
                </button>
            </div>
        `;

        await this.loadFriends();
        await this.loadFriendRequests();
        this.setupEventListeners();
    }

    updateFriendStatus(userId, isOnline) {
        const friendItem = this.querySelector(`[data-user-id="${userId}"]`);
        if (friendItem) {
            const statusElement = friendItem.querySelector('.friend-status');
            if (statusElement) {
                statusElement.className = `friend-status ${isOnline ? 'online' : 'offline'}`;
                statusElement.textContent = window.translationManager.translate(isOnline ? 'friendsMenu.online' : 'friendsMenu.offline');
            }
        }
    }

    async loadFriends() {
        try {
            if (!window.userStatusManager.isAuthenticated()) return;

            const response = await handleApiRequest('https://localhost:8000/auth/friends/');
            const friendsData = await response.json();
            
            const friendsList = this.querySelector('#friendsList');
            friendsList.innerHTML = friendsData.length ? friendsData.map(friend => `
                <div class="friend-item" data-user-id="${friend.id}">
                    <img src="${friend.avatar_url || 'image/image.jpg'}" 
                         alt="avatar" class="friend-avatar"
                         width="40" height="40">
                    <span class="friend-name">${friend.display_name || friend.username}</span>
                    <span class="friend-status ${friend.is_online ? 'online' : 'offline'}">
                        ${window.translationManager.translate(friend.is_online ? 'friendsMenu.online' : 'friendsMenu.offline')}
                    </span>
                    <button class="invite-button hoverLambda" onclick="inviteToPlay('${friend.id}')">
                        ${window.translationManager.translate('friendsMenu.inviteToPlay')}
                    </button>
                </div>
            `).join('') : `<p style="color: green;">${window.translationManager.translate('friendsMenu.noFriends')}</p>`;
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    async loadFriendRequests() {
        if (!window.userStatusManager?.isAuthenticated()) {
            return;
        }

        try {
            const response = await handleApiRequest('https://localhost:8000/auth/friend-requests/');
            const requests = await response.json();
            
            const requestsList = this.querySelector('#friendRequestsList');
            requestsList.innerHTML = requests.length ? requests.map(request => `
                <div class="friend-request-item" data-user-id="${request.sender_info.id}">
                    <img src="${request.sender_info.avatar_url || 'image/image.jpg'}" 
                        alt="avatar" class="friend-avatar"
                        width="40" height="40">
                    <span class="friend-name">
                        ${request.sender_info.display_name || request.sender_info.username}
                    </span>
                    <button class="accept-button hoverLambda" 
                            onclick="handleFriendRequest(${request.id}, 'accept')">
                        ${window.translationManager.translate('friendsMenu.accept')}
                    </button>
                    <button class="reject-button hoverLambda" 
                            onclick="handleFriendRequest(${request.id}, 'reject')">
                        ${window.translationManager.translate('friendsMenu.reject')}
                    </button>
                </div>
            `).join('') : `<p style="color: green;">${window.translationManager.translate('friendsMenu.noRequests')}</p>`;
        } catch (error) {
            console.error('Error loading friend requests:', error);
        }
    }

    async searchUsers(query) {
        if (!query || query.length < 2) {
            document.querySelector('#searchResults').innerHTML = '';
            return;
        }
    
        try {
            const sanitizedQuery = DOMPurify.sanitize(query).trim();
            
            const response = await protectedRequest(
                `https://localhost:8000/auth/search-users/?query=${encodeURIComponent(sanitizedQuery)}`
            );
    
            if (!response.ok) {
                throw new Error(window.translationManager.translate('friendsMenu.searchError'));
            }
    
            const results = await response.json();
            const searchResults = document.querySelector('#searchResults');
            
            if (results.length === 0) {
                searchResults.innerHTML = `<p class="no-results">${window.translationManager.translate('friendsMenu.noResults')}</p>`;
                return;
            }
    
            searchResults.innerHTML = results.map(user => `
                <div class="search-result-item" data-user-id="${DOMPurify.sanitize(String(user.id))}">
                    <img src="${DOMPurify.sanitize(user.avatar_url || 'image/image.jpg')}" 
                         alt="avatar" class="user-avatar"
                         width="30" height="30">
                    <span class="user-name">${DOMPurify.sanitize(user.display_name || user.username)}</span>
                    <button type="button" class="add-friend-button hoverLambda" 
                            data-user-id="${DOMPurify.sanitize(String(user.id))}">
                        ${window.translationManager.translate('friendsMenu.addFriend')}
                    </button>
                </div>
            `).join('');
    
        } catch (error) {
            console.error('Search failed:', error);
            document.querySelector('#searchResults').innerHTML = 
                `<p class="error">${window.translationManager.translate('friendsMenu.searchError')}</p>`;
        }
    }

    setupEventListeners() {
        // Recherche d'utilisateurs
        let searchTimeout;
        const searchInput = this.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    const query = e.target.value;
                    if (query.length < 3) {
                        this.querySelector('#searchResults').innerHTML = '';
                        return;
                    }
                    await this.searchUsers(query);
                }, 300);
            });
        }

        const searchResults = this.querySelector('#searchResults');
        if (searchResults) {
            searchResults.addEventListener('click', (e) => {
                const button = e.target.closest('.add-friend-button');
                if (button) {
                    e.preventDefault();
                    e.stopPropagation();
                    const userId = button.dataset.userId;
                    this.sendFriendRequest(userId);
                }
            });
        }

        // Bouton retour
        const backButton = this.querySelector('#friendsBackButton');
        if (backButton) {
            backButton.addEventListener('mouseover', () => hoverSound.play());
            backButton.addEventListener('click', () => {
                playAudio('clickOut');
                playMenu.show();
            });
        }
    }

    async sendFriendRequest(userId) {
        try {
            const response = await handleApiRequest(
                'https://localhost:8000/auth/send-friend-request/',
                {
                    method: 'POST',
                    body: JSON.stringify({ receiver_id: userId })
                }
            );
    
            if (response.ok) {
                alert(window.translationManager.translate('friendsMenu.requestSent'));
                this.querySelector('#searchResults').innerHTML = '';
                this.querySelector('#searchInput').value = '';
            } else {
                const data = await response.json();
                throw new Error(data.detail || window.translationManager.translate('friendsMenu.requestError'));
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert(window.translationManager.translate('friendsMenu.requestError') + ': ' + error.message);
        }
    }

    static show() {
        const friendsMenu = document.getElementById('dynamicContent');
        friendsMenu.innerHTML = '';
        const friendsMenuComponent = document.createElement('friends-menu');
        friendsMenu.appendChild(friendsMenuComponent);
    }
}

customElements.define('friends-menu', friendsMenu);