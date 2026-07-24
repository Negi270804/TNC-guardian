# Stage 1: Build Vite application
FROM node:20-alpine AS builder

WORKDIR /app

# Expose Vite build arguments (with default values for compilation checks)
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_APP_NAME="TNC Guardian"
ARG VITE_ENV=production
ARG VITE_ENABLE_DEMO_MODE=false

# Map arguments to environment variables so Vite can read them at build-time
ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_ENV=$VITE_ENV \
    VITE_ENABLE_DEMO_MODE=$VITE_ENABLE_DEMO_MODE

# Install node dependencies
COPY package*.json ./
RUN npm ci

# Copy client source code files
COPY . .

# Build Vite application (tsc && vite build)
RUN npm run build

# Stage 2: Serve using lightweight Nginx
FROM nginx:alpine

# Copy build files from builder stage to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server in the foreground
CMD ["nginx", "-g", "daemon off;"]
