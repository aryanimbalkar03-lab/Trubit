FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy the rest of the app source code
COPY . .

# Build the Vite app for production
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

# Copy the build output to Nginx's default public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite default Nginx configuration with our SPA-friendly config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
