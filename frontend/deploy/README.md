# AI Native Workflow Frontend - 部署文档

## 服务器信息

- **服务器地址**: 172.16.18.184
- **SSH 用户**: op
- **后端 API**: http://172.16.18.184:8000
- **前端访问地址**: http://172.16.18.184

---

## 部署方式

### 方式一: 自动化部署 (推荐)

使用提供的部署脚本一键部署:

```bash
cd /Users/admin/Desktop/anker/ai-native-app
./deploy/deploy.sh
```

脚本会自动完成:
1. ✅ 构建前端项目
2. ✅ 上传到服务器
3. ✅ 配置 Nginx
4. ✅ 重启服务

### 方式二: 手动部署

如果自动脚本失败,可以按以下步骤手动部署:

#### 步骤 1: 本地构建

```bash
cd frontend
cp ../deploy/.env.production .env.production
npm install
npm run build
```

构建完成后会生成 `dist/` 目录。

#### 步骤 2: 上传到服务器

```bash
# 使用 scp 上传
scp -r dist/* op@172.16.18.184:/tmp/frontend-dist/

# 或使用 rsync (更快)
rsync -avz dist/ op@172.16.18.184:/tmp/frontend-dist/
```

#### 步骤 3: 在服务器上部署

SSH 登录服务器:

```bash
ssh op@172.16.18.184
```

在服务器上执行:

```bash
# 创建部署目录
sudo mkdir -p /var/www/ai-workflow-frontend
sudo chown -R op:op /var/www/ai-workflow-frontend

# 移动文件
mv /tmp/frontend-dist/* /var/www/ai-workflow-frontend/

# 配置 Nginx
sudo nano /etc/nginx/sites-available/ai-workflow
```

将以下配置粘贴到文件中:

```nginx
server {
    listen 80;
    server_name 172.16.18.184;
    
    root /var/www/ai-workflow-frontend;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://172.16.18.184:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点并重启 Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 服务器环境要求

### 必需软件

1. **Node.js** (v18+)
   ```bash
   # 安装 Node.js (如未安装)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Nginx**
   ```bash
   # 安装 Nginx (如未安装)
   sudo apt-get update
   sudo apt-get install -y nginx
   ```

3. **rsync** (可选,用于更快的文件传输)
   ```bash
   sudo apt-get install -y rsync
   ```

---

## 验证部署

部署完成后:

1. **检查 Nginx 状态**
   ```bash
   ssh op@172.16.18.184 "sudo systemctl status nginx"
   ```

2. **访问应用**
   - 浏览器打开: http://172.16.18.184
   - 检查是否能正常加载页面
   - 测试与后端 API 的连接

3. **查看 Nginx 日志** (如有问题)
   ```bash
   ssh op@172.16.18.184 "sudo tail -f /var/log/nginx/error.log"
   ```

---

## 常见问题

### 1. SSH 连接失败

如果密码认证失败,可能需要:

```bash
# 在服务器上启用密码认证
sudo nano /etc/ssh/sshd_config

# 确保以下配置
PasswordAuthentication yes

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 2. Nginx 403 Forbidden

检查文件权限:

```bash
sudo chown -R www-data:www-data /var/www/ai-workflow-frontend
sudo chmod -R 755 /var/www/ai-workflow-frontend
```

### 3. API 请求失败

检查后端服务是否运行:

```bash
curl http://172.16.18.184:8000/api/health
```

如果后端未运行,启动后端服务。

### 4. 页面刷新 404

确保 Nginx 配置中有 `try_files $uri $uri/ /index.html;` 这一行。

---

## 更新部署

当代码有更新时,重新运行:

```bash
cd /Users/admin/Desktop/anker/ai-native-app
./deploy/deploy.sh
```

或手动执行:

```bash
cd frontend
npm run build
rsync -avz dist/ op@172.16.18.184:/var/www/ai-workflow-frontend/
```

---

## 文件说明

```
deploy/
├── .env.production    # 生产环境变量
├── nginx.conf         # Nginx 配置文件
├── deploy.sh          # 自动化部署脚本
└── README.md          # 本文档
```

---

## 支持

如有问题,请检查:
1. Nginx 错误日志: `/var/log/nginx/error.log`
2. Nginx 访问日志: `/var/log/nginx/access.log`
3. 后端服务日志

---

**部署完成!** 🎉

访问地址: http://172.16.18.184
