#!/bin/bash

# Monitor Render deployment status
DEPLOY_ID="dep-d39eddali9vc73fuv0lg"
SERVICE_ID="srv-d2oahier433s738jpdkg"
API_KEY="rnd_mFPjhdLcr078PMUvubLB58EqgAIl"

echo "🚀 Monitoring Render deployment..."
echo "Deployment ID: $DEPLOY_ID"
echo ""

while true; do
    RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" \
        "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID")

    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    STARTED=$(echo "$RESPONSE" | grep -o '"startedAt":"[^"]*"' | cut -d'"' -f4)

    echo -ne "\r[$(date '+%H:%M:%S')] Status: $STATUS           "

    if [ "$STATUS" = "live" ]; then
        echo ""
        echo "✅ Deployment is LIVE!"
        echo ""
        echo "🎉 The headline feature is now deployed to production!"
        echo "🌐 Visit: https://texas-tailgaters.onrender.com"
        break
    elif [ "$STATUS" = "build_failed" ] || [ "$STATUS" = "update_failed" ]; then
        echo ""
        echo "❌ Deployment FAILED!"
        break
    fi

    sleep 10
done
