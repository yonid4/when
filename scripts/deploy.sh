#!/bin/bash
set -e

echo "Starting deployment process..."

# Configuration
EC2_HOST="ubuntu@54.189.130.216"
SSH_KEY="/Users/yoni/Downloads/when-keypair-2.pem"
PROJECT_DIR="/Users/yoni/Desktop/Projects/when"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build images locally
echo -e "${YELLOW}📦 Step 1: Building Docker images locally...${NC}"
cd "$PROJECT_DIR"

# Load environment variables for frontend build (filter out comments and empty lines)
export $(cat .env | grep -E '^REACT_APP' | grep -v '^#' | xargs)

# Build backend
docker build -t when-backend:latest -f Dockerfile.backend .

# Build frontend with environment variables
docker build --no-cache \
  --build-arg REACT_APP_SUPABASE_URL="$REACT_APP_SUPABASE_URL" \
  --build-arg REACT_APP_SUPABASE_ANON_KEY="$REACT_APP_SUPABASE_ANON_KEY" \
  -t when-frontend:latest \
  -f Dockerfile.frontend \
  .

echo -e "${GREEN}✅ Images built successfully${NC}"

# Step 2: Save images to TAR files
echo -e "${YELLOW}💾 Step 2: Saving images to TAR files...${NC}"
docker save when-backend:latest -o when-backend.tar
docker save when-frontend:latest -o when-frontend.tar

echo -e "${GREEN}✅ Images saved${NC}"

# Step 3: Transfer to EC2
echo -e "${YELLOW}📤 Step 3: Transferring images to EC2...${NC}"
scp -i "$SSH_KEY" when-backend.tar "$EC2_HOST:/home/ubuntu/"
scp -i "$SSH_KEY" when-frontend.tar "$EC2_HOST:/home/ubuntu/"

echo -e "${GREEN}✅ Images transferred${NC}"

# Step 4: Deploy on EC2
echo -e "${YELLOW}🚢 Step 4: Deploying on EC2...${NC}"
ssh -i "$SSH_KEY" "$EC2_HOST" << 'ENDSSH'
    set -e
    
    echo "Loading Docker images..."
    docker load -i /home/ubuntu/when-backend.tar
    docker load -i /home/ubuntu/when-frontend.tar
    
    echo "Stopping old containers..."
    docker stop backend when-frontend 2>/dev/null || true
    docker rm backend when-frontend 2>/dev/null || true
    
    echo "Creating network..."
    docker network create when-network 2>/dev/null || true
    
    echo "Starting backend container..."
    docker run -d \
      --name backend \
      --network when-network \
      -p 5050:5050 \
      --env-file /home/ubuntu/.env \
      --restart unless-stopped \
      when-backend:latest
    
    echo "Starting frontend container..."
    docker run -d \
      --name when-frontend \
      --network when-network \
      -p 80:80 -p 443:443 \
      -v /etc/letsencrypt:/etc/letsencrypt:ro \
      --restart unless-stopped \
      when-frontend:latest
    
    echo "Cleaning up TAR files..."
    rm /home/ubuntu/when-backend.tar /home/ubuntu/when-frontend.tar
    
    echo "Deployment complete!"
    docker ps
ENDSSH

echo -e "${GREEN}✅ Deployment complete!${NC}"

# Step 5: Clean up local TAR files
echo -e "${YELLOW}🧹 Step 5: Cleaning up local files...${NC}"
rm when-backend.tar when-frontend.tar

echo -e "${GREEN}🎉 All done! Your application is now running on EC2${NC}"
echo -e "Visit: ${GREEN}https://when-now.com${NC}"