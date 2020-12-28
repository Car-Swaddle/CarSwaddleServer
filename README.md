# Setup

## Prereqs

Install node
```bash
brew install node
```

Install yarn
```bash
brew install yarn
```

Install typescript
```bash
npm install -g typescript
```

Install service dependencies
```bash
yarn install
```

Install [docker](https://www.docker.com/products/docker-desktop)

---

## Running

Start docker containers (postgres+postgis/s3)
```bash
yarn run deps
```

Start service (monitors for file changes and sets debug configs)
```
yarn start
```

To debug, run the Visual Studio Code "Attach to local" launch config (port 9229)

## Running tests

```bash
yarn run test
```

Or to debug tests (connect to port 9228):
```bash
yarn run test:local
```

---

### Old way:

#### Setup Postgres locally

Install postgresql

`brew install postgresql`

Create `carswaddle` database

`psql`
`create database carswaddle;`
`CREATE EXTENSION carswaddle postgis;`

#### Run locally

`yarn start`
