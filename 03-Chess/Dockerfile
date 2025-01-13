FROM node:alpine:3.15

WORKDIR /app

COPY . .

EXPOSE 3000

RUN npm install -g http-server

CMD ["http-server"]