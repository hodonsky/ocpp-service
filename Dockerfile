FROM node:22.9.0

ARG OCPP_PORT
ARG HTTP_PORT

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ADD ./   /usr/src/app

ENV NODE_ENV=local

EXPOSE ${OCPP_PORT}
EXPOSE ${HTTP_PORT}

CMD npm run start