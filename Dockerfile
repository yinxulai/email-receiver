FROM node:22-alpine3.19 AS builder

LABEL maintainer="Alain <me@yinxulai.com>"

# 设置工作目录
WORKDIR /app

ENV STMP_PORT=25
ENV API_PORT=3000
ENV DATABASE_URL=

# 复制项目文件
COPY . .
RUN rm -rf node_modules
RUN npm install
RUN npm run build

ENTRYPOINT ["npm", "start"]

# DEBUG
# ENTRYPOINT ["sleep", "infinity"] 
