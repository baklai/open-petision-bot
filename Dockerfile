# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

ARG NODE_VERSION=18.17.1

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /app

COPY package.json ./

RUN npm i -g @nestjs/cli

RUN npm i -g @types/node

# Install dependencies
RUN npm install

# Copy the rest of the source files into the image.
COPY . .

# Build application
RUN npm run build

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application with sourcing the env file
CMD [ "npm", "run", "start"]


