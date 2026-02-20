# 階段一：構建前端靜態檔案
FROM node:22-alpine AS builder
LABEL "language"="nodejs"
LABEL "framework"="react"

WORKDIR /build

# 由於在 Zeabur 內已指定 Source Directory 為 /exam-system-frontend
# COPY . . 會把 frontend 目錄下的所有檔案放到 /build
COPY . .

# 直接在 /build 目錄執行安裝與編譯
RUN npm install --legacy-peer-deps && npm install --legacy-peer-deps --save prop-types
RUN npm run build

# 階段二：使用 Caddy 提供靜態網頁服務 (Zeabur 環境推薦)
FROM zeabur/caddy-static

# 從 builder 複製編譯完成的 dist 資料夾
COPY --from=builder /build/dist /usr/share/caddy

EXPOSE 8080
