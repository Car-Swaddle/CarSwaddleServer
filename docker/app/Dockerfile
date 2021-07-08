FROM node:13.8.0

RUN apt-get update && apt-get install -y wget

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

WORKDIR /server/app
COPY ./package*.json ./
RUN yarn install

COPY . .
RUN yarn run build

ENV PORT 3000
ENV DOCKER true
ENV STRIPE_LIVE NO
ENV NO_EMAIL true
ENV LOCAL_DATABASE_URL db

EXPOSE 9229/tcp
EXPOSE 3000/tcp

# wait for db to come up before running
CMD ["dockerize", "-wait", "tcp://db:5432", "-wait", "tcp://s3:9000", "-timeout", "10s", "yarn", "start"]
