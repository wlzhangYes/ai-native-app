#!/bin/bash
# 在服务器上执行此脚本
# 使用方法: bash server-setup.sh

echo "🚀 开始部署 AI Workflow Frontend..."

# 1. 创建目录
echo "📁 创建部署目录..."
sudo mkdir -p /var/www/ai-workflow-frontend
sudo rm -rf /var/www/ai-workflow-frontend/*

# 2. 复制文件
echo "📦 复制文件..."
sudo cp -r ~/ai-workflow-dist/* /var/www/ai-workflow-frontend/

# 3. 设置权限
echo "🔒 设置权限..."
sudo chown -R www-data:www-data /var/www/ai-workflow-frontend
sudo chmod -R 755 /var/www/ai-workflow-frontend

# 4. 创建 Nginx 配置
echo "⚙️  配置 Nginx..."
sudo tee /etc/nginx/sites-available/ai-workflow > /dev/null << 'NGINX_EOF'
server {
    listen 8080;
    server_name 172.16.18.184;
    
    root /var/www/ai-workflow-frontend;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://172.16.18.184:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 5. 启用站点
echo "🔗 启用站点..."
sudo ln -sf /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/ai-workflow

# 6. 测试 Nginx 配置
echo "🧪 测试 Nginx 配置..."
if sudo nginx -t; then
    echo "✅ Nginx 配置测试通过"
    
    # 7. 重启 Nginx
    echo "🔄 重启 Nginx..."
    sudo systemctl restart nginx
    
    # 8. 检查状态
    echo "📊 检查 Nginx 状态..."
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    echo "✅ ========================================="
    echo "✅   部署完成！"
    echo "✅ ========================================="
    echo ""
    echo "🌐 访问地址: http://172.16.18.184:8080"
    echo ""
else
    echo "❌ Nginx 配置测试失败，请检查配置"
    exit 1
fi
