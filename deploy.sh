#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm ci --omit=dev

echo "Building frontend..."
npm run build

echo "Running migrations..."
npm run migrate

echo "Ensuring upload directories..."
mkdir -p public/uploads/{sliders,logos,tasks,landing,frames,audio,assets,presentation-audio,temp/video}

echo "Deploy complete."
