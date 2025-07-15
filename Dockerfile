# Stage 1: Build Angular app
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Serve con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/virtus-taranto-frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]