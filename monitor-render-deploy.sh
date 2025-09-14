#!/bin/bash

DEPLOY_ID="dep-d32v68ripnbc73di98m0"
SERVICE_ID="srv-d2oahier433s738jpdkg"
API_KEY="rnd_mFPjhdLcr078PMUvubLB58EqgAIl"

echo "🚀 Monitoring Render deployment: $DEPLOY_ID"
echo "----------------------------------------"

while true; do
  STATUS=$(curl -s "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" \
    -H "Authorization: Bearer $API_KEY" | jq -r '.status')
  
  echo "[$(date +%H:%M:%S)] Status: $STATUS"
  
  if [[ "$STATUS" == "live" ]]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "The latest code is now live in production."
    exit 0
  elif [[ "$STATUS" == "build_failed" ]] || [[ "$STATUS" == "deploy_failed" ]]; then
    echo "❌ DEPLOYMENT FAILED!"
    exit 1
  fi
  
  sleep 10
done