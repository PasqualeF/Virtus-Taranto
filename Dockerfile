# Stage 1: Build Angular app
FROM node:20-alpine as build
WORKDIR /app

# Copia tutto il codice sorgente
COPY . .

# Build dell'app Angular
RUN npm install
RUN npm run build

# Debug: mostra la struttura della directory dist
RUN ls -la /app/dist

# Stage 2: Serve con Nginx
FROM nginx:alpine

# Rimuovi la configurazione default di nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia i file buildati - prova prima questo path
COPY --from=build /app/dist /usr/share/nginx/html

# Se non funziona, prova questo:
# COPY --from=build /app/dist/virtus-taranto-frontend /usr/share/nginx/html

# Debug: mostra cosa è stato copiato
RUN ls -la /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]