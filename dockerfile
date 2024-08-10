# Use a lightweight Node.js runtime as the base image
FROM node:18-slim

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# generate prisma client
# RUN npx prisma generate  --schema=./prisma/schema.prisma


# Copy the application code
COPY . .

# Expose the port the application will run on
EXPOSE 3000

# Set the command to start the application
# CMD ["npm", "run", "server"]
CMD ["prisma","generate"]
