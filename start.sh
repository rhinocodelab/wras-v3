#!/bin/bash

# WRAS V2 Application Startup Script
# This script starts the Next.js application with proper setup and error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to handle git operations
handle_git_operations() {
    print_status "Checking git repository status..."
    
    # Check if git is installed
    if ! command_exists git; then
        print_warning "Git is not installed. Skipping git operations."
        return 0
    fi
    
    # Check if this is a git repository
    if [ ! -d ".git" ]; then
        print_warning "This is not a git repository. Skipping git operations."
        return 0
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current 2>/dev/null)
    if [ -z "$current_branch" ]; then
        print_warning "Could not determine current branch. Skipping git operations."
        return 0
    fi
    
    print_status "Current branch: $current_branch"
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        print_warning "You have uncommitted changes. Consider committing them before pulling."
        read -p "Do you want to continue without committing? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Please commit your changes and run the script again."
            exit 1
        fi
    fi
    
    # Fetch latest changes from remote
    print_status "Fetching latest changes from remote..."
    if git fetch origin 2>/dev/null; then
        print_success "Fetched latest changes from remote."
    else
        print_warning "Failed to fetch from remote. Continuing with local version."
        return 0
    fi
    
    # Check if local branch is behind remote
    local behind_count=$(git rev-list HEAD..origin/$current_branch --count 2>/dev/null)
    if [ "$behind_count" -gt 0 ] 2>/dev/null; then
        print_status "Local branch is $behind_count commits behind remote. Pulling changes..."
        
        # Set pull strategy to merge to handle divergent branches
        git config pull.rebase false
        
        # Pull changes
        if git pull origin $current_branch 2>/dev/null; then
            print_success "Successfully pulled latest changes."
        else
            print_warning "Failed to pull changes automatically. You may need to resolve conflicts manually."
            print_status "You can run 'git status' to see the current state."
            read -p "Do you want to continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_status "Please resolve git conflicts and run the script again."
                exit 1
            fi
        fi
    else
        print_success "Local branch is up to date with remote."
    fi
    
    # Check if there are new dependencies in package.json
    if git diff HEAD~1 --name-only 2>/dev/null | grep -q "package.json"; then
        print_status "package.json has changed. Updating dependencies..."
        npm install
        if [ $? -eq 0 ]; then
            print_success "Dependencies updated successfully."
        else
            print_warning "Failed to update dependencies. Continuing with existing ones."
        fi
    fi
}

# Function to wait for application to be ready
wait_for_app() {
    local port=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for application to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            print_success "Application is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "Application may not be fully ready yet, but continuing..."
    return 1
}

# Main startup function
main() {
    print_status "Starting WRAS V2 Application..."
    
    # Check if we're in the correct directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root directory."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Node.js version: $(node --version)"
    print_status "npm version: $(npm --version)"
    
    # Handle git operations (pull latest changes)
    #handle_git_operations
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies."
            exit 1
        fi
        print_success "Dependencies installed successfully."
    fi
    
    # Check if port 9002 is already in use
    if check_port 9002; then
        print_warning "Port 9002 is already in use. Checking if it's our application..."
        if curl -s http://localhost:9002 >/dev/null 2>&1; then
            print_success "Application is already running on http://localhost:9002"
            print_status "You can access it at: http://localhost:9002"
            exit 0
        else
            print_error "Port 9002 is in use by another process. Please stop it first."
            exit 1
        fi
    fi
    
    # Start the application
    print_status "Starting the application in development mode..."
    print_status "The application will be available at: http://localhost:9002"
    print_status "Press Ctrl+C to stop the application"
    echo ""
    
    # Start the development server
    npm run dev
    
    # Note: The script will only reach here if the dev server exits
    print_status "Application stopped."
}

# Trap Ctrl+C to provide clean exit
trap 'echo ""; print_status "Received interrupt signal. Shutting down..."; exit 0' INT

# Run the main function
main "$@" 