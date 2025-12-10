# Quick Start Guide

Get up and running with the ExpressionEngine MCP Server in minutes!

## Prerequisites

- Node.js 18 or higher
- Expression Engine V7 running in Devilbox (or any MySQL-accessible environment)
- Access to the EE database and file system

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/Johnny2x2/ExpressionEngineV7MCP.git
cd ExpressionEngineV7MCP
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Database connection (from host to Devilbox MySQL)
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=
EE_DB_DATABASE=expressionengine

# File system path
EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
```

### 3. Build

```bash
npm run build
```

### 4. Test

```bash
npm test
```

You should see all checks passing ✓

## Usage with Claude Desktop

### 1. Locate Your Config File

- **macOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. Add MCP Server Configuration

Edit the config file and add:

```json
{
  "mcpServers": {
    "expressionengine": {
      "command": "node",
      "args": [
        "/absolute/path/to/ExpressionEngineV7MCP/build/index.js"
      ],
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

**Important**: Use absolute paths!

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

### 4. Verify Connection

In Claude Desktop, try asking:

> "List all channels in Expression Engine"

If configured correctly, you should see the available EE tools and get results!

## First Steps

### Check Your Setup

```
Ask Claude: "What channels exist in my Expression Engine installation?"
```

This will use the `ee_list_channels` tool to query your database.

### Create a Channel

```
Ask Claude: "Create a new channel called 'News' with the short name 'news'"
```

### Add an Entry

```
Ask Claude: "Add a blog entry titled 'Hello World' to channel 1"
```

### Query the Database

```
Ask Claude: "Show me all entries from the past 7 days"
```

### Read a Template

```
Ask Claude: "Show me the contents of the index template"
```

## Common Issues

### Can't Connect to Database

**Error**: `ECONNREFUSED 127.0.0.1:3306`

**Fix**:
1. Make sure Devilbox is running: `docker-compose ps`
2. Check MySQL port: `docker-compose port mysql 3306`
3. Test connection: `mysql -h 127.0.0.1 -P 3306 -u root`

### Can't Access Files

**Error**: `ENOENT: no such file or directory`

**Fix**:
1. Verify path exists: `ls -la /path/to/devilbox/data/www/expressionengine`
2. Use absolute paths in configuration
3. Check file permissions

### Claude Desktop Doesn't Show Tools

**Fix**:
1. Verify the config file path is correct
2. Check JSON syntax is valid
3. Ensure absolute paths are used
4. Restart Claude Desktop completely
5. Check Claude Desktop logs for errors

## Next Steps

- Read [USAGE.md](USAGE.md) for detailed examples
- Check [DEVILBOX.md](DEVILBOX.md) for Devilbox-specific setup
- Review [README.md](README.md) for complete documentation

## Getting Help

If you run into issues:

1. Check the logs in Claude Desktop
2. Test the database connection manually
3. Verify file paths and permissions
4. Review the documentation files
5. Open an issue on GitHub

## Tips

- Start with simple queries to verify connectivity
- Use the database query tools to explore your EE installation
- Back up your database before making bulk changes
- Test on a development instance first

Happy building! 🚀
