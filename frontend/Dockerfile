FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 5500


CMD sh -c "ls -la /etc/nginx/ssl/ && nginx -g 'daemon off;'"