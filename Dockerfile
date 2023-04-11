FROM node:12-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
RUN npm cache clean --force
ENV NODE_ENV="production"
COPY . .
CMD [ "npm", "start" ]
