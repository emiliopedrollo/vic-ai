FROM node:20-alpine

ENV NODE_ENV=production
ENV YARN_VERSION=4.1.1

EXPOSE 3001

WORKDIR /home/node/app

COPY dist/backend.js /home/node/app/backend.js
COPY package.json /home/node/app/package.json

RUN yarn set version $YARN_VERSION
RUN yarn install

CMD ["yarn","node","backend.js"]
