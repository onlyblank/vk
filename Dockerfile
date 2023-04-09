FROM node:lts-alpine
WORKDIR /usr/app

# Install all dependencies
COPY ["package.json", "package-lock.json*", "tsconfig*.json", "./"]
RUN npm install

# Copy source files
COPY ./src ./src

# Build app
RUN npm run build
RUN npm prune --omit=dev

# Run app
CMD npm start