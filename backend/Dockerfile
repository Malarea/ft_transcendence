FROM python:3.12-slim

# Installer les dépendances système
RUN apt-get update && \
    apt-get install -y gcc libpq-dev

WORKDIR /app

# Copier les requirements et installer les dépendances Python
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install argon2-cffi

# Copier le reste du code
COPY . /app/

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput

# Exposer le port
EXPOSE 8000

# Commande par défaut
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "Transcendance.asgi:application"]