#!/bin/bash

mkdir -p ssl
cd ssl

# Générer une clé privée et un certificat auto-signé
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout private.key \
    -out certificate.crt \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/CN=localhost"

# Paramètres plus stricts pour nginx
cat > ssl_params.conf << EOL
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
add_header Strict-Transport-Security "max-age=31536000" always;
EOL

chmod 600 private.key certificate.crt
