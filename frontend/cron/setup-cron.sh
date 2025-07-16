#!/bin/bash

# Autosave Cleanup Cron Job Setup Script
# This script sets up the cron job for autosave cleanup

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_SCRIPT="$PROJECT_DIR/scripts/cleanup-cron.js"
CRON_CONFIG="$PROJECT_DIR/cron/cleanup-config.json"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/cleanup-cron.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root"
   exit 1
fi

# Create log directory
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    log_info "Created log directory: $LOG_DIR"
fi

# Check if cleanup script exists
if [ ! -f "$CRON_SCRIPT" ]; then
    log_error "Cleanup script not found: $CRON_SCRIPT"
    exit 1
fi

# Make cleanup script executable
chmod +x "$CRON_SCRIPT"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    log_warn "node_modules not found, installing dependencies..."
    cd "$PROJECT_DIR"
    npm install
fi

# Environment variables check
if [ -z "$CRON_SECRET" ]; then
    log_error "CRON_SECRET environment variable is not set"
    exit 1
fi

# Create cron job entry
CRON_ENTRY="0 2 * * * cd $PROJECT_DIR && node $CRON_SCRIPT --config $CRON_CONFIG >> $LOG_FILE 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
    log_warn "Cron job already exists. Removing old entry..."
    crontab -l | grep -v "$CRON_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

log_info "Cron job added successfully:"
log_info "  Schedule: Daily at 2:00 AM"
log_info "  Script: $CRON_SCRIPT"
log_info "  Config: $CRON_CONFIG"
log_info "  Log: $LOG_FILE"

# Test the cron job (dry run)
log_info "Testing cron job with dry run..."
cd "$PROJECT_DIR"
if node "$CRON_SCRIPT" --dry-run --config "$CRON_CONFIG"; then
    log_info "Dry run completed successfully"
else
    log_error "Dry run failed"
    exit 1
fi

# Display current cron jobs
log_info "Current cron jobs:"
crontab -l

log_info "Setup completed successfully!"
log_info "The cleanup job will run daily at 2:00 AM"
log_info "Check logs at: $LOG_FILE"
log_info "To remove the cron job, run: crontab -e"