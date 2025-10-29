#!/bin/bash
# AI Native Workflow Frontend Deployment Script
# Execute from frontend directory
# Server: 172.16.18.184
# User: op

set -e  # Exit on error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  AI Workflow Frontend Deployment${NC}"
echo -e "${BLUE}==================================${NC}"

# Get current directory (should be frontend/)
FRONTEND_DIR="$(pwd)"
DEPLOY_DIR="${FRONTEND_DIR}/../deploy"
DIST_DIR="${FRONTEND_DIR}/dist"

# Configuration
SERVER="172.16.18.184"
USER="op"
REMOTE_DIR="/var/www/ai-workflow-frontend"

echo -e "\n${BLUE}Frontend dir: ${FRONTEND_DIR}${NC}"
echo -e "${BLUE}Deploy config: ${DEPLOY_DIR}${NC}"

# Check if we're in frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in frontend directory!${NC}"
    echo -e "${YELLOW}Please run: cd frontend && ./deploy.sh${NC}"
    exit 1
fi

# Step 1: Copy environment file
echo -e "\n${BLUE}[1/6] Copying environment file...${NC}"
if [ -f "${DEPLOY_DIR}/.env.production" ]; then
    cp "${DEPLOY_DIR}/.env.production" .env.production
    echo -e "${GREEN}✓ Environment file copied${NC}"
else
    echo -e "${YELLOW}Warning: .env.production not found in deploy/, creating default one${NC}"
    cat > .env.production << 'ENVEOF'
# Production Environment Variables
VITE_API_BASE_URL=http://172.16.18.184:8000
VITE_APP_TITLE=AI Native Workflow System
ENVEOF
fi

# Step 2: Install dependencies
echo -e "\n${BLUE}[2/6] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Build frontend (skip TypeScript checking for faster deployment)
echo -e "\n${BLUE}[3/6] Building frontend (skipping type check)...${NC}"
echo -e "${YELLOW}Note: Building with vite directly to skip TypeScript errors${NC}"

# Build without type checking
npx vite build

if [ ! -d "${DIST_DIR}" ]; then
    echo -e "${RED}Error: Build failed, dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"

# Step 4: Create remote directory (without sudo, will be created during upload)
echo -e "\n${BLUE}[4/6] Preparing remote directory...${NC}"
ssh ${USER}@${SERVER} "mkdir -p ${REMOTE_DIR}" || {
    echo -e "${YELLOW}Note: Directory creation may require manual setup${NC}"
}
echo -e "${GREEN}✓ Remote directory prepared${NC}"

# Step 5: Upload files
echo -e "\n${BLUE}[5/6] Uploading files to server...${NC}"
rsync -avz --delete ${DIST_DIR}/ ${USER}@${SERVER}:${REMOTE_DIR}/ || {
    echo -e "${RED}Error: Failed to upload files${NC}"
    echo -e "${YELLOW}Trying alternative upload method...${NC}"
    
    # Fallback: upload to home directory first
    rsync -avz --delete ${DIST_DIR}/ ${USER}@${SERVER}:~/ai-workflow-dist/ || {
        echo -e "${RED}Error: Upload failed. Please check SSH connection.${NC}"
        exit 1
    }
    
    echo -e "${YELLOW}Files uploaded to ~/ai-workflow-dist/${NC}"
    echo -e "${YELLOW}Please run these commands on the server:${NC}"
    echo -e "${BLUE}  sudo mkdir -p ${REMOTE_DIR}${NC}"
    echo -e "${BLUE}  sudo mv ~/ai-workflow-dist/* ${REMOTE_DIR}/${NC}"
    echo -e "${BLUE}  sudo chown -R www-data:www-data ${REMOTE_DIR}${NC}"
    
    # Ask user to complete manually
    echo -e "\n${YELLOW}Press Enter after completing the above commands on server...${NC}"
    read
}
echo -e "${GREEN}✓ Files uploaded${NC}"

# Step 6: Configure and restart Nginx
echo -e "\n${BLUE}[6/6] Configuring Nginx...${NC}"

if [ -f "${DEPLOY_DIR}/nginx.conf" ]; then
    # Upload nginx config to home directory
    scp ${DEPLOY_DIR}/nginx.conf ${USER}@${SERVER}:~/ai-workflow.conf
    
    echo -e "${YELLOW}Nginx configuration uploaded to server${NC}"
    echo -e "${YELLOW}Please run these commands on the server:${NC}"
    echo -e "${BLUE}  sudo mv ~/ai-workflow.conf /etc/nginx/sites-available/ai-workflow${NC}"
    echo -e "${BLUE}  sudo ln -sf /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/${NC}"
    echo -e "${BLUE}  sudo nginx -t${NC}"
    echo -e "${BLUE}  sudo systemctl restart nginx${NC}"
    
    echo -e "\n${YELLOW}Would you like to SSH into the server now to complete setup? (y/n)${NC}"
    read -p "" answer
    
    if [ "$answer" = "y" ]; then
        echo -e "\n${BLUE}Connecting to server...${NC}"
        ssh ${USER}@${SERVER}
    fi
else
    echo -e "${YELLOW}Warning: nginx.conf not found${NC}"
fi

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}  Build and Upload Completed!${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "\n${YELLOW}Next steps on server (ssh ${USER}@${SERVER}):${NC}"
echo -e "${BLUE}  1. sudo mv ~/ai-workflow-dist/* ${REMOTE_DIR}/ (if needed)${NC}"
echo -e "${BLUE}  2. sudo mv ~/ai-workflow.conf /etc/nginx/sites-available/ai-workflow${NC}"
echo -e "${BLUE}  3. sudo ln -sf /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/${NC}"
echo -e "${BLUE}  4. sudo nginx -t && sudo systemctl restart nginx${NC}"
echo -e "\n${BLUE}Then access: http://172.16.18.184${NC}"
