FROM node:22.9.0

ARG EXPOSE_PORT

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ADD ./   /usr/src/app

ENV NODE_ENV=local

EXPOSE ${EXPOSE_PORT}

CMD npm run start