# 階段一：構建前端靜態檔案
FROM node:22-alpine AS builder
LABEL "language"="nodejs"
LABEL "framework"="react"

WORKDIR /build

# 複製 package.json 和 package-lock.json (如果有)
COPY package*.json ./

# 安裝相依套件 (加入 legacy-peer-deps 以解決 react 19 與舊版套件的衝突)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps --save prop-types

# 複製原始碼
COPY . .

# 執行生產環境建置 (會產生 /dist 資料夾)
RUN npm run build

# 階段二：使用 Caddy 提供靜態網頁服務 (Zeabur 環境推薦)
FROM zeabur/caddy-static

# 從第一階段複製編譯後的檔案到 Caddy 的靜態目錄
COPY --from=builder /build/dist /usr/share/caddy

EXPOSE 8080
