#!/bin/bash

echo "🔄 Monitoring Render deployment for texas-tailgaters..."
echo "Started at: $(date)"
echo "----------------------------------------"

INITIAL_DATE="Fri, 12 Sep 2025"
CHECK_COUNT=0
MAX_CHECKS=30  # Max 15 minutes (30 * 30 seconds)

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    
    # Get the last-modified header
    LAST_MODIFIED=$(curl -I https://texas-tailgaters.onrender.com 2>/dev/null | grep -i 'last-modified' | cut -d' ' -f2-4)
    
    echo "[$(date '+%H:%M:%S')] Check #$CHECK_COUNT - Last Modified: $LAST_MODIFIED"
    
    # Check if date has changed from initial
    if [[ "$LAST_MODIFIED" != "$INITIAL_DATE" ]]; then
        echo ""
        echo "✅ DEPLOYMENT COMPLETE!"
        echo "New deployment detected at: $(date)"
        echo "Last Modified: $LAST_MODIFIED"
        
        # Test the site is working
        HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" https://texas-tailgaters.onrender.com)
        echo "Site Status: HTTP $HTTP_STATUS"
        
        if [ "$HTTP_STATUS" = "200" ]; then
            echo "🎉 Site is live and responding successfully!"
        else
            echo "⚠️  Site returned HTTP $HTTP_STATUS - may need investigation"
        fi
        
        exit 0
    fi
    
    # Wait 30 seconds before next check
    sleep 30
done

echo ""
echo "⏱️ Timeout reached after $((MAX_CHECKS * 30 / 60)) minutes"
echo "Deployment may still be in progress. Check Render dashboard for status."
exit 1