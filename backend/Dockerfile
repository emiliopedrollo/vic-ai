FROM node:20-alpine

ENV NODE_ENV=production
ENV YARN_VERSION=4.1.1

EXPOSE 80

WORKDIR /home/node/app

COPY dist/ /home/node/app/
COPY package.json /home/node/app/package.json

RUN yarn set version $YARN_VERSION
RUN yarn install

CMD ["yarn","node","app.js"]
