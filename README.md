# ft_transcendence

![Project Status](https://img.shields.io/badge/status-completed-success)
![Grade](https://img.shields.io/badge/grade-100%2F100-success)
![School](https://img.shields.io/badge/school-42-lightgrey)

A full-stack web application featuring a real-time multiplayer Pong game. This project represents the culmination of the École 42 curriculum, combining modern web technologies to create an engaging gaming platform.

## 🎮 Features

### Core Game Features
- Real-time multiplayer Pong gameplay
- Tournament system with matchmaking
- Live game customization options
- Player rankings and statistics
- Game history tracking

### User Management
- OAuth 2.0 authentication with 42 API
- Custom user profiles with avatars
- Friend system with online status

## 🛠 Technology Stack

### Backend
- NestJS (Node.js framework)
- PostgreSQL database
- TypeORM for database management
- WebSocket for real-time communication
- JWT for authentication

### Infrastructure
- Docker & Docker Compose
- Nginx as reverse proxy
- Redis for caching
- REST API architecture

## 📋 Prerequisites

- Docker and Docker Compose
- A 42 API application (only for OAuth)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ft_transcendence.git
cd ft_transcendence
```

2. Create a `.env` file in the root directory with your configuration:
```env
# Database configuration
POSTGRES_DB=transcendence
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgres://[your_user]:[your_password]@db:5432/transcendence

# 42 API configuration
FT_UID=your_42_app_id
FT_SECRET=your_42_app_secret
FT_REDIRECT_URL=https://localhost:8000/auth/42/callback
```

3. Start the application using Docker Compose:
```bash
docker-compose up --build
docker-compose exec backend python manage.py migrate
```

The application will be available at `https://localhost:5500`

## 🔒 Security Features

- Password hashing
- SQL injection protection
- XSS prevention
- CSRF protection
- Rate limiting
- Secure WebSocket connections
- OAuth 2.0 implementation

## 🎯 Project Goals

This project was developed as part of the École 42 curriculum with the following objectives:
- Create a full-stack web application
- Implement real-time multiplayer functionality
- Ensure secure user authentication and data protection
- Practice modern web development technologies
- Create a scalable and maintainable codebase

## 🤝 Contributing

While this is primarily a school project, suggestions and feedback are welcome. Feel free to:
1. Fork the project
2. Create a feature branch
3. Submit a Pull Request

## ✍️ Authors

- [Emri Machreki](https://github.com/Malarea)
- [Yassin Houari](https://github.com/EliotAlderson42)
