# 1. Base image (Lightweight Alpine Linux)
FROM node:20-alpine AS base
WORKDIR /app

# 2. Install dependencies first (Caches this step to make future builds faster)
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Copy the rest of your Next.js UI code
COPY . .

# 4. Build the Next.js application for production
RUN npm run build

# 5. Configure the runtime environment
# We MUST use port 80 to match our ALB and Fargate Terraform configuration
ENV PORT 80
EXPOSE 80

# 6. Start the application
CMD ["npm", "start"]