FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY static/ /usr/share/nginx/html/static/
COPY mem.jpg /usr/share/nginx/html/
COPY background.jpg /usr/share/nginx/html/
COPY Background.webp /usr/share/nginx/html/
COPY playericon.png /usr/share/nginx/html/
COPY smilewb.png /usr/share/nginx/html/

# Configure nginx to serve the files
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
