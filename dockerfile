# Use the official Node.js image as the base image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

#RUN yarn install --frozen-lockfile

RUN yarn prisma generate
RUN yarn prisma migrate deploy --schema=./prisma/schema.prisma

EXPOSE 3000

CMD ["npm", "run", "server"]

