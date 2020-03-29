FROM node:13.8.0

RUN apt-get update && apt-get install -y wget

ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

WORKDIR /server/app
COPY ./package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV HOST_URL http://carswaddle:3000
ENV TEST_USER test@carswaddle.com
ENV TEST_PASS Test123!

EXPOSE 9228/tcp
RUN npm install -g mocha

# wait for db to come up before running
CMD ["dockerize", "-wait", "tcp://db:5432", "-wait", "tcp://s3:9000", "-wait", "tcp://carswaddle:3000", "-timeout", "30s", "node", "--inspect=0.0.0.0:9228", "./docker/test/test-run.js"]
