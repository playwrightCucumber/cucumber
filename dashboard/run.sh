#!/bin/bash

# Dashboard Runner Script
# Runs the Next.js dashboard on an available port

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Dashboard...${NC}"

# Default ports to try
PORTS=(3000 3001 3002 3003)

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Parse arguments
FORCE_KILL=false
PORT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -k|--kill)
            FORCE_KILL=true
            shift
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# If specific port requested
if [ -n "$PORT" ]; then
    if check_port $PORT; then
        if [ "$FORCE_KILL" = true ]; then
            kill_port $PORT
        else
            echo -e "${RED}Port $PORT is in use. Use -k to kill existing process.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}Starting on port $PORT${NC}"
    npm run dev -- -p $PORT
    exit 0
fi

# Find available port
for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        echo -e "${GREEN}Starting on port $port${NC}"
        echo -e "${GREEN}Dashboard URL: http://localhost:$port${NC}"
        npm run dev -- -p $port
        exit 0
    else
        echo -e "${YELLOW}Port $port is in use, trying next...${NC}"
    fi
done

# If all ports are in use, ask to kill
echo -e "${RED}All ports (${PORTS[*]}) are in use.${NC}"
echo -e "${YELLOW}Run with -k flag to kill existing process on port 3000${NC}"
echo -e "${YELLOW}Example: ./run.sh -k${NC}"
