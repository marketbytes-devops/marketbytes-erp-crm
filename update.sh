#!/bin/bash

# Exit on any error
set -e

echo "Starting Update Process..."

# 1. Pull latest changes from GitHub
echo "Pulling latest changes from GitHub..."
git pull

# 2. Rebuild and restart Docker containers
# Note: Rebuild is necessary because the code is inside Docker images.
# Git pull only updates files on the server; rebuild puts them into the app.
echo "Rebuilding and restarting Docker containers..."
docker-compose up -d --build

# 3. Clean up unused Docker images and volumes
echo "Cleaning up unused Docker resources..."
docker system prune -f

echo "Update Complete! Your ERP-CRM is now up to date."
