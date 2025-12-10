# Devilbox Integration Guide

This guide explains how to set up and use the ExpressionEngine MCP Server with a Devilbox Docker setup.

## What is Devilbox?

Devilbox is a modern Docker LAMP/LEMP stack that provides a complete development environment. It's perfect for running Expression Engine V7 in a containerized environment.

## Prerequisites

- Devilbox installed and running
- Expression Engine V7 installed in Devilbox
- Node.js installed on your host machine (for running the MCP server)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Host Machine                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MCP Server (Node.js)                                │   │
│  │  - Connects to MySQL in Docker                       │   │
│  │  - Accesses files via bind mount                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Devilbox Docker Containers                          │   │
│  │                                                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │   MySQL    │  │    PHP     │  │   httpd    │    │   │
│  │  │   :3306    │  │            │  │            │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  │                                                       │   │
│  │  Bind Mount: ./data/www → /shared/httpd             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Devilbox Configuration

1. **Start Devilbox with required services:**

```bash
cd /path/to/devilbox
docker-compose up -d httpd mysql php
```

2. **Verify services are running:**

```bash
docker-compose ps
```

### Step 2: Expression Engine Installation

1. **Place Expression Engine in the Devilbox www directory:**

```bash
# The path should be something like:
# /path/to/devilbox/data/www/expressionengine/
```

2. **Access Expression Engine installer:**
   - Navigate to `http://localhost/expressionengine/` in your browser
   - Complete the installation wizard

3. **Note the database credentials from Devilbox:**
   - Host: `127.0.0.1` (when connecting from host) or `mysql` (from within containers)
   - Port: `3306`
   - User: `root`
   - Password: (check your `.env` file in Devilbox, usually empty)
   - Database: `expressionengine` (or whatever you created)

### Step 3: MCP Server Configuration

1. **Clone and setup the MCP server:**

```bash
git clone https://github.com/Johnny2x2/ExpressionEngineV7MCP.git
cd ExpressionEngineV7MCP
npm install
```

2. **Configure environment variables:**

Create a `.env` file in the MCP server directory:

```bash
# Connection from host machine to Devilbox MySQL
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=

# Database name
EE_DB_DATABASE=expressionengine

# Path to EE installation
# This should match your Devilbox data/www directory structure
EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
```

**Important Path Notes:**
- On **Linux/macOS**: Use the absolute path to your Devilbox www directory
- On **Windows**: Use forward slashes, e.g., `C:/devilbox/data/www/expressionengine`

3. **Build the server:**

```bash
npm run build
```

### Step 4: Test the Connection

1. **Test database connectivity:**

Create a test script `test-db.js`:

```javascript
import mysql from 'mysql2/promise';

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'expressionengine'
    });
    
    const [rows] = await connection.execute('SELECT * FROM exp_channels LIMIT 1');
    console.log('✓ Database connection successful!');
    console.log('Found channels:', rows.length);
    await connection.end();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  }
}

test();
```

Run it:
```bash
node test-db.js
```

2. **Test file access:**

```bash
# Should list your EE files
ls -la /path/to/devilbox/data/www/expressionengine/system
```

## Common Devilbox Configurations

### Default Devilbox Paths

```bash
# Devilbox installation
DEVILBOX_ROOT=/path/to/devilbox

# Web root (inside containers)
CONTAINER_WWW=/shared/httpd

# Web root (on host)
HOST_WWW=/path/to/devilbox/data/www

# EE Installation
EE_IN_CONTAINER=/shared/httpd/expressionengine
EE_ON_HOST=/path/to/devilbox/data/www/expressionengine
```

### Environment Variables for Different Scenarios

#### Scenario 1: Standard Devilbox Setup (Recommended)

```bash
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=
EE_DB_DATABASE=expressionengine
EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
```

#### Scenario 2: Custom MySQL Port

If you've mapped MySQL to a different port (e.g., 3307):

```bash
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3307
EE_DB_USER=root
EE_DB_PASSWORD=
EE_DB_DATABASE=expressionengine
EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
```

#### Scenario 3: Remote Devilbox

If Devilbox is on a different machine:

```bash
EE_DB_HOST=192.168.1.100
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=your_password
EE_DB_DATABASE=expressionengine
EE_BASE_PATH=/path/to/shared/mount/expressionengine
```

## Running the MCP Server with Devilbox

### Option 1: Run Directly

```bash
cd /path/to/ExpressionEngineV7MCP
export EE_DB_HOST=127.0.0.1
export EE_DB_PORT=3306
export EE_DB_USER=root
export EE_DB_PASSWORD=
export EE_DB_DATABASE=expressionengine
export EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
node build/index.js
```

### Option 2: Use with Claude Desktop

Edit your Claude Desktop config:

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "expressionengine": {
      "command": "node",
      "args": ["/absolute/path/to/ExpressionEngineV7MCP/build/index.js"],
      "env": {
        "EE_DB_HOST": "127.0.0.1",
        "EE_DB_PORT": "3306",
        "EE_DB_USER": "root",
        "EE_DB_PASSWORD": "",
        "EE_DB_DATABASE": "expressionengine",
        "EE_BASE_PATH": "/absolute/path/to/devilbox/data/www/expressionengine"
      }
    }
  }
}
```

## Troubleshooting

### Issue: Cannot Connect to Database

**Symptoms:**
- `ECONNREFUSED` error
- `Access denied` error

**Solutions:**

1. **Check if MySQL is running:**
```bash
cd /path/to/devilbox
docker-compose ps mysql
```

2. **Verify MySQL port mapping:**
```bash
docker-compose port mysql 3306
```

3. **Test connection from host:**
```bash
mysql -h 127.0.0.1 -P 3306 -u root -p expressionengine
```

4. **Check Devilbox .env file:**
```bash
cat /path/to/devilbox/.env | grep MYSQL
```

### Issue: Cannot Access Files

**Symptoms:**
- `ENOENT: no such file or directory`
- Permission denied errors

**Solutions:**

1. **Verify the path exists:**
```bash
ls -la /path/to/devilbox/data/www/expressionengine
```

2. **Check permissions:**
```bash
# The files should be readable by your user
ls -la /path/to/devilbox/data/www/
```

3. **Fix permissions if needed:**
```bash
# In Devilbox directory
cd /path/to/devilbox
# Make sure your user owns the files
sudo chown -R $(whoami):$(whoami) data/www/expressionengine
```

4. **Use absolute paths:**
   - Always use absolute paths in `EE_BASE_PATH`
   - On Windows, use forward slashes

### Issue: Wrong Database Selected

**Symptoms:**
- Table doesn't exist errors
- Wrong data returned

**Solutions:**

1. **List databases:**
```bash
mysql -h 127.0.0.1 -P 3306 -u root -e "SHOW DATABASES;"
```

2. **Verify EE tables exist:**
```bash
mysql -h 127.0.0.1 -P 3306 -u root expressionengine -e "SHOW TABLES LIKE 'exp_%';"
```

3. **Check EE config:**
```bash
cat /path/to/devilbox/data/www/expressionengine/system/user/config/config.php | grep database
```

## Performance Tips

1. **Use bind mounts efficiently:**
   - Keep files organized
   - Avoid deep nesting
   - Use `.devilboxignore` if available

2. **Database connection pooling:**
   - The MCP server uses connection pooling by default
   - Limit concurrent operations if performance is an issue

3. **File operations:**
   - Batch file operations when possible
   - Use the database for large-scale queries instead of file I/O

## Security Best Practices

1. **Never expose ports publicly:**
   - Keep Devilbox MySQL bound to `127.0.0.1` only
   - Use firewall rules if needed

2. **Use strong passwords:**
   - Change default MySQL password
   - Update `EE_DB_PASSWORD` accordingly

3. **Limit file access:**
   - The MCP server only accesses files within `EE_BASE_PATH`
   - Don't set `EE_BASE_PATH` to root or home directory

4. **Regular backups:**
   - Use the MCP server to automate backups
   - Store backups outside the Devilbox directory

## Example: Complete Setup Script

```bash
#!/bin/bash

# Setup script for ExpressionEngine MCP with Devilbox

# Configuration
DEVILBOX_PATH="/path/to/devilbox"
EE_PATH="$DEVILBOX_PATH/data/www/expressionengine"
MCP_PATH="/path/to/ExpressionEngineV7MCP"

# Start Devilbox
echo "Starting Devilbox..."
cd "$DEVILBOX_PATH"
docker-compose up -d httpd mysql php

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
sleep 10

# Setup MCP Server
echo "Setting up MCP Server..."
cd "$MCP_PATH"

# Create .env file
cat > .env << EOF
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=
EE_DB_DATABASE=expressionengine
EE_BASE_PATH=$EE_PATH
EOF

# Install and build
npm install
npm run build

echo "Setup complete!"
echo "Start the MCP server with: npm start"
```

## Additional Resources

- [Devilbox Documentation](https://devilbox.readthedocs.io/)
- [Expression Engine Documentation](https://docs.expressionengine.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
