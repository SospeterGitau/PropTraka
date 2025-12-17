#!/bin/bash
# Watch and auto-restart dev environment if it stops unexpectedly

echo "🛡️  Dev Environment Guardian - Auto-restart enabled"
echo "   Press Ctrl-C twice quickly to stop permanently"
echo ""

STOP_COUNT=0
LAST_STOP_TIME=0

while true; do
    # Run the dev environment
    npm run dev
    EXIT_CODE=$?
    
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - LAST_STOP_TIME))
    
    # If stopped within 3 seconds, increment counter
    if [ $TIME_DIFF -lt 3 ]; then
        STOP_COUNT=$((STOP_COUNT + 1))
    else
        STOP_COUNT=1
    fi
    
    LAST_STOP_TIME=$CURRENT_TIME
    
    # If Ctrl-C pressed twice within 3 seconds, exit permanently
    if [ $STOP_COUNT -ge 2 ]; then
        echo ""
        echo "🛑 Stopping permanently (Ctrl-C pressed twice)"
        exit 0
    fi
    
    # Otherwise auto-restart
    echo ""
    echo "⚠️  Dev environment stopped unexpectedly"
    echo "🔄 Auto-restarting in 3 seconds..."
    echo "   (Press Ctrl-C again within 3 seconds to stop permanently)"
    sleep 3
    
    echo ""
    echo "🔄 Restarting..."
done
