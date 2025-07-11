# Stage 1: Build Angular app
FROM node:20-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Stage 2: Serve con Nginx
FROM nginx:alpine
COPY --from=build /app/dist/virtus-taranto-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
