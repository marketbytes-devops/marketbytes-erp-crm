#!/bin/bash

# Exit on any error
set -e

echo "Starting Update Process..."

# 1. Pull latest changes from GitHub
echo "Pulling latest changes from GitHub..."
git pull

# 2. Rebuild and restart Docker containers
# Note: Using 'docker compose' (V2) instead of 'docker-compose' (V1)
# to fix a bug (KeyError: 'ContainerConfig') in old versions.
echo "Rebuilding and restarting Docker containers..."
docker compose up -d --build

# 3. Clean up old images (dangling)
# This only removes the "old" versions of images left over from the build.
# It will NOT affect your other running projects.
echo "Cleaning up old Docker images..."
docker image prune -f

echo "Update Complete! Your ERP-CRM is now up to date."
