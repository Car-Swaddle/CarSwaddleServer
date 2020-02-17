FROM node:13.8.0

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN chmod +x wait-for-it.sh

ENV PORT 3000
ENV DOCKER true

EXPOSE 3000/tcp

# wait for db to come up before running
CMD ["./wait-for-it.sh", "db:5432", "--", "node", "server.js"]
