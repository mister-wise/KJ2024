FROM nginx:alpine

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/nginx.conf

# Copy static files to nginx html directory
COPY client/index.html /usr/share/nginx/html/
COPY client/static/ /usr/share/nginx/html/static/
COPY client/mem.jpg /usr/share/nginx/html/
COPY client/background.jpg /usr/share/nginx/html/
COPY client/Background.webp /usr/share/nginx/html/
COPY client/playericon.png /usr/share/nginx/html/
COPY client/smilewb.png /usr/share/nginx/html/

# Configure nginx to serve the files
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
