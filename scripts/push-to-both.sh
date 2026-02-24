#!/bin/bash

# Script to push to both git repositories
# Usage: ./push-to-both.sh

echo "🚀 Starting push to both repositories..."
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Push to origin (playwrightCucumber/cucumber)
echo "📤 Pushing to origin (playwrightCucumber/cucumber)..."
if git push origin $CURRENT_BRANCH; then
    echo "✅ Successfully pushed to origin"
else
    echo "❌ Failed to push to origin"
    exit 1
fi
echo ""

# Push to map-chronicle
echo "📤 Pushing to map-chronicle (map-chronicle-rip/playwright)..."
if git push map-chronicle $CURRENT_BRANCH; then
    echo "✅ Successfully pushed to map-chronicle"
else
    echo "❌ Failed to push to map-chronicle"
    exit 1
fi
echo ""

echo "🎉 Successfully pushed to both repositories!"
