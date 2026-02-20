# 階段一：構建前端靜態檔案
FROM node:22-alpine AS builder
LABEL "language"="nodejs"
LABEL "framework"="react"

WORKDIR /build

# 當 Zeabur 以外層主目錄為 Context 掃描時，先把整個大專案目錄複製進 /build
COPY . .

# 切換到 frontend 實際目錄來找到 package.json
WORKDIR /build/exam-system-frontend

# 現在可以執行安裝與編譯了
RUN npm install --legacy-peer-deps && npm install --legacy-peer-deps --save prop-types
RUN npm run build

# 階段二：使用 Caddy 提供靜態網頁服務 (Zeabur 環境推薦)
FROM zeabur/caddy-static

# 從 builder 複製編譯完成的 frontend dist 資料夾
COPY --from=builder /build/exam-system-frontend/dist /usr/share/caddy

EXPOSE 8080
