# Use a lightweight Node.js runtime as the base image
FROM node:18-slim

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

RUN prisma generate

# Copy the application code
COPY . .

# Expose the port the application will run on
EXPOSE 3000

# Set the command to start the application
CMD ["npm", "run", "server"]
