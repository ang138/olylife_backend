# Docker File
FROM node:20-alpine

WORKDIR /user/src/app

COPY ./package.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "run", "start"]