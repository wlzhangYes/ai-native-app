# AI Native Workflow Frontend - 部署文档

## 服务器信息

- **服务器地址**: 172.16.18.184
- **SSH 用户**: op
- **SSH Passphrase**: 123456
- **Sudo 密码**: Anker@01
- **后端 API**: http://172.16.18.184:8000/api
- **前端访问地址**: http://172.16.18.184:8080
- **部署目录**: /var/www/ai-workflow-frontend

---

## 首次部署流程

### 1. 本地构建

```bash
cd /Users/admin/Desktop/anker/ai-native-app/frontend

# 确保环境变量正确
cat .env.production
# 内容应为:
# VITE_API_BASE_URL=http://172.16.18.184:8000/api
# VITE_APP_TITLE=AI Native Workflow System

# 构建 (跳过 TypeScript 检查)
npx vite build
```

### 2. 上传文件到服务器

```bash
# 上传构建产物
scp -r dist/* op@172.16.18.184:~/ai-workflow-dist/
```

输入 SSH passphrase: `123456`

### 3. SSH 登录服务器

```bash
ssh op@172.16.18.184
```

输入 SSH passphrase: `123456`

### 4. 在服务器上部署

```bash
# 4.1 创建目录并复制文件
cd ~
sudo mkdir -p /var/www/ai-workflow-frontend
sudo cp -r ai-workflow-dist/* /var/www/ai-workflow-frontend/
sudo chown -R www-data:www-data /var/www/ai-workflow-frontend
```

输入 sudo 密码: `Anker@01`

```bash
# 4.2 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/ai-workflow
```

粘贴以下配置:

```nginx
server {
    listen 8080;
    server_name 172.16.18.184;
    
    root /var/www/ai-workflow-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://172.16.18.184:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

保存: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# 4.3 启用站点
sudo ln -sf /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/

# 4.4 测试 Nginx 配置
sudo nginx -t

# 4.5 重启 Nginx
sudo systemctl restart nginx
```

### 5. 访问应用

浏览器打开: **http://172.16.18.184:8080**

---

## 日常更新部署 (代码修改后)

### 方式一: 快速更新 (推荐)

#### 步骤 1: 本地构建

```bash
cd /Users/admin/Desktop/anker/ai-native-app/frontend
npx vite build
```

#### 步骤 2: 上传文件

```bash
scp -r dist/* op@172.16.18.184:~/ai-workflow-dist/
```

#### 步骤 3: 服务器更新

```bash
ssh op@172.16.18.184

# 在服务器上执行
sudo cp -r ~/ai-workflow-dist/* /var/www/ai-workflow-frontend/
sudo systemctl restart nginx

# 退出服务器
exit
```

#### 步骤 4: 清除浏览器缓存并刷新

`Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows)

---

### 方式二: 使用部署脚本

#### 本地执行 (在 frontend 目录):

```bash
cd /Users/admin/Desktop/anker/ai-native-app/frontend
./deploy.sh
```

按提示操作:
1. 脚本会自动构建并上传文件
2. 按 Enter 继续
3. 手动 SSH 到服务器完成最后步骤

---

## 常见问题排查

### 1. 检查 Nginx 状态

```bash
ssh op@172.16.18.184
sudo systemctl status nginx
```

### 2. 查看 Nginx 错误日志

```bash
ssh op@172.16.18.184
sudo tail -f /var/log/nginx/error.log
```

### 3. 检查后端 API 是否运行

```bash
curl http://172.16.18.184:8000/api/health
```

### 4. 页面刷新 404

检查 Nginx 配置中是否有:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 5. API 请求 404

检查 `.env.production` 中的 API 地址是否包含 `/api` 后缀:
```
VITE_API_BASE_URL=http://172.16.18.184:8000/api
```

### 6. 静态资源加载失败

清除浏览器缓存: `Cmd+Shift+R`

---

## 重要提醒

### 环境变量检查

每次构建前务必检查 `.env.production`:

```bash
cat frontend/.env.production
```

应该包含:
```
VITE_API_BASE_URL=http://172.16.18.184:8000/api
VITE_APP_TITLE=AI Native Workflow System
```

### TypeScript 错误处理

如果遇到 TypeScript 编译错误,使用跳过类型检查的构建:

```bash
# 不要用 npm run build (会运行 tsc)
# 直接用 vite build
npx vite build
```

### 端口说明

- **8080**: 前端访问端口
- **8000**: 后端 API 端口
- **80**: 已被其他项目占用

---

## 文件结构

```
frontend/
├── .env.production          # 生产环境变量 (本地)
├── dist/                    # 构建产物 (本地)
├── deploy.sh               # 部署脚本 (本地)
└── server-setup.sh         # 服务器配置脚本 (本地)

服务器:
/var/www/ai-workflow-frontend/    # 部署目录
/etc/nginx/sites-available/ai-workflow  # Nginx 配置
/etc/nginx/sites-enabled/ai-workflow    # Nginx 软链接
~/ai-workflow-dist/               # 临时上传目录
```

---

## 回滚操作

如果新版本有问题,需要回滚:

```bash
# 1. 切换到上一个 git commit
cd /Users/admin/Desktop/anker/ai-native-app
git log --oneline -5
git checkout <previous-commit-hash>

# 2. 重新构建并部署
cd frontend
npx vite build
scp -r dist/* op@172.16.18.184:~/ai-workflow-dist/

# 3. 服务器更新
ssh op@172.16.18.184
sudo cp -r ~/ai-workflow-dist/* /var/www/ai-workflow-frontend/
sudo systemctl restart nginx
exit

# 4. 切换回最新代码
git checkout main
```

---

## 自动化改进 (可选)

### 配置 SSH 免密登录

```bash
# 如果未配置,执行:
ssh-copy-id op@172.16.18.184
```

输入密码后,后续可免密登录。

### 配置 Git Hooks (自动部署)

在项目根目录创建 `.git/hooks/post-commit`:

```bash
#!/bin/bash
echo "Triggering deployment..."
cd frontend && ./deploy.sh
```

```bash
chmod +x .git/hooks/post-commit
```

每次 commit 后自动触发部署。

---

## 联系方式

如有问题,请检查:
1. Nginx 日志: `/var/log/nginx/error.log`
2. 后端服务状态
3. 网络连接

---

**最后更新**: 2025-10-29
**文档版本**: 1.0
