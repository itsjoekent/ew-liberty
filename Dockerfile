FROM node:10

WORKDIR /usr/src/app

COPY . .

RUN npm install @cloudflare/wrangler \
  @dollarshaveclub/cloudworker \
  mocha \
  chai

CMD ["npm", "test"]
