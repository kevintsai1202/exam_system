# 階段一：構建前端靜態檔案
FROM node:22-alpine AS builder
LABEL "language"="nodejs"
LABEL "framework"="react"

WORKDIR /app

# 先複製 package.json 以利用 Docker layer 快取
COPY package*.json ./
RUN npm install --legacy-peer-deps && npm install --legacy-peer-deps --save prop-types

# 複製其餘原始碼並建置
COPY . .
RUN npm run build

# 階段二：使用 Caddy 提供靜態網頁服務 (Zeabur 環境推薦)
FROM zeabur/caddy-static

# 從 builder 複製編譯完成的 dist 資料夾
COPY --from=builder /app/dist /usr/share/caddy

EXPOSE 8080
