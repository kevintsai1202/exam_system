# 階段一：構建前端靜態檔案
FROM node:22-alpine AS builder
LABEL "language"="nodejs"
LABEL "framework"="react"

WORKDIR /build

# Zeabur 多資料夾建置時，它會把 Context 送進整包程式碼
# 我們把所有程式碼拷貝進來
COPY . .

# 切換到 frontend 資料夾下開始安裝與編譯
WORKDIR /build/exam-system-frontend
RUN npm install --legacy-peer-deps && npm install --legacy-peer-deps --save prop-types
RUN npm run build

# 階段二：使用 Caddy 提供靜態網頁服務 (Zeabur 環境推薦)
FROM zeabur/caddy-static

# 從 builder 複製編譯完成的 dist 資料夾
COPY --from=builder /build/exam-system-frontend/dist /usr/share/caddy

EXPOSE 8080
