#!/bin/bash
set -euo pipefail

echo "🚀 Deploying ASY Frontend..."
echo ""

# Obtener IP pública
IP=$(curl -s ifconfig.me 2>/dev/null || echo "<IP_DROPLET>")

echo "📦 Pulling latest code..."
git pull origin develop

echo "🏗️  Building Docker image..."
docker compose -f docker-compose.prod.yml build

echo "🔄 Restarting container..."
docker compose -f docker-compose.prod.yml up -d

echo "🧹 Cleaning old images..."
docker image prune -f

echo ""
echo "✅ Deploy complete!"
echo "   http://${IP}:8080"
