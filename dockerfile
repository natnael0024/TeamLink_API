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

# Expose the port the app runs on
EXPOSE 3000
FROM node:20-bullseye as builder

RUN mkdir app

WORKDIR /app

COPY . .

RUN yarn install --frozen-lockfile

RUN yarn prisma generate

RUN yarn tsc

FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node --from=builder /app/package.json .

COPY --chown=node:node --from=builder /app/build .

RUN yarn install --production && yarn cache clean --all

COPY --chown=node:node --from=builder  /app/node_modules/.prisma/client ./node_modules/.prisma/client

EXPOSE 4500

CMD ["npm", "run", "server"]
