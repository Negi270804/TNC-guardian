# TNC Guardian - Frontend Development container
FROM node:24-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Download client packages
RUN npm install

# Copy codebase
COPY . .

# Expose local server port
EXPOSE 3000

# Start Vite server in host mode
CMD ["npm", "run", "dev"]
