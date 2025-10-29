#!/bin/bash
# AI Native Workflow Frontend Deployment Script
# Server: 172.16.18.184
# User: op

set -e  # Exit on error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  AI Workflow Frontend Deployment${NC}"
echo -e "${BLUE}==================================${NC}"

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration
SERVER="172.16.18.184"
USER="op"
REMOTE_DIR="/var/www/ai-workflow-frontend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
LOCAL_DIST="${FRONTEND_DIR}/dist"

echo -e "\n${BLUE}Project root: ${PROJECT_ROOT}${NC}"
echo -e "${BLUE}Frontend dir: ${FRONTEND_DIR}${NC}"

# Step 1: Build frontend locally
echo -e "\n${BLUE}[1/5] Building frontend...${NC}"
cd "${FRONTEND_DIR}"
cp "${SCRIPT_DIR}/.env.production" .env.production
npm install
npm run build

if [ ! -d "${LOCAL_DIST}" ]; then
    echo -e "${RED}Error: Build failed, dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"

# Step 2: Create remote directory
echo -e "\n${BLUE}[2/5] Creating remote directory...${NC}"
ssh ${USER}@${SERVER} "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R ${USER}:${USER} ${REMOTE_DIR}"
echo -e "${GREEN}✓ Remote directory ready${NC}"

# Step 3: Upload files
echo -e "\n${BLUE}[3/5] Uploading files to server...${NC}"
rsync -avz --delete ${LOCAL_DIST}/ ${USER}@${SERVER}:${REMOTE_DIR}/
echo -e "${GREEN}✓ Files uploaded${NC}"

# Step 4: Configure Nginx
echo -e "\n${BLUE}[4/5] Configuring Nginx...${NC}"
scp ${SCRIPT_DIR}/nginx.conf ${USER}@${SERVER}:/tmp/ai-workflow.conf
ssh ${USER}@${SERVER} << 'ENDSSH'
    sudo mv /tmp/ai-workflow.conf /etc/nginx/sites-available/ai-workflow
    sudo ln -sf /etc/nginx/sites-available/ai-workflow /etc/nginx/sites-enabled/
    sudo nginx -t
ENDSSH
echo -e "${GREEN}✓ Nginx configured${NC}"

# Step 5: Restart Nginx
echo -e "\n${BLUE}[5/5] Restarting Nginx...${NC}"
ssh ${USER}@${SERVER} "sudo systemctl restart nginx"
echo -e "${GREEN}✓ Nginx restarted${NC}"

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}  Deployment Completed!${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "\nAccess your application at: ${BLUE}http://172.16.18.184${NC}"
