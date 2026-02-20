FROM nginx:alpine

# 將我們寫的 nginx.conf 範本複製進去
# 注意：在包含環境變數替換設計的官方 nginx image，
# 放到 /etc/nginx/templates/ 目錄下的 .template 檔案
# 會在容器啟動時自動套用 envsubst 產生真正的 default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
