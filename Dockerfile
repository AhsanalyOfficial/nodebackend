# Node.js official image
FROM node:20-alpine

# Working directory
WORKDIR /app

# Package files copy karo
COPY package*.json ./

# Dependencies install karo
RUN npm ci --only=production

# Source code copy karo
COPY . .

# Environment variable for port
ENV PORT=8080

# Port expose karo
EXPOSE 8080

# App start karo
CMD ["node", "src/index.js"]