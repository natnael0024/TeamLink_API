# Use a lightweight Node.js runtime as the base image
FROM node:18-slim AS base

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the application code
COPY . .

# Build the application
RUN npm run build

# Use a multi-stage build to create a smaller production image
FROM node:18-slim AS production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the previous stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

# Expose the port the application will run on
EXPOSE 3000

# Set the command to start the application
CMD ["node", "dist/app.js"]