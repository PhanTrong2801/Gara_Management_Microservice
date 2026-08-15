FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine
# Copy file build static vào Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copy file config Nginx hỗ trợ React Router (Single Page App)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]