# Deployment Guide

This guide covers deploying the ExpressionEngine MCP Server in various environments.

## Table of Contents

- [Quick Deployment](#quick-deployment)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Security Hardening](#security-hardening)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Quick Deployment

For most users with Devilbox:

```bash
# 1. Clone and install
git clone https://github.com/Johnny2x2/ExpressionEngineV7MCP.git
cd ExpressionEngineV7MCP
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your settings

# 3. Build
npm run build

# 4. Test
npm test

# 5. Configure Claude Desktop (see README.md)
```

## Development Environment

### Local Machine Setup

**Prerequisites:**
- Node.js 18+
- MySQL/MariaDB (via Devilbox or standalone)
- Expression Engine V7

**Steps:**

1. **Install Dependencies**

```bash
npm install
```

2. **Development Configuration**

Create `.env` for development:

```bash
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=
EE_DB_DATABASE=expressionengine_dev
EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
```

3. **Watch Mode for Development**

```bash
npm run watch
```

This automatically rebuilds when you make changes to `src/index.ts`.

4. **Testing Changes**

In a separate terminal:

```bash
# Set environment variables
export $(cat .env | xargs)

# Run server manually for testing
node build/index.js
```

Or configure Claude Desktop to use your development build.

### Devilbox Development Setup

```bash
# 1. Start Devilbox
cd /path/to/devilbox
docker-compose up -d httpd mysql php

# 2. Install Expression Engine
# Place EE in devilbox/data/www/expressionengine/

# 3. Configure MCP Server
cd /path/to/ExpressionEngineV7MCP
cat > .env << EOF
EE_DB_HOST=127.0.0.1
EE_DB_PORT=3306
EE_DB_USER=root
EE_DB_PASSWORD=
EE_DB_DATABASE=expressionengine
EE_BASE_PATH=/path/to/devilbox/data/www/expressionengine
EOF

# 4. Build and test
npm run build
npm test
```

## Production Environment

### Server Deployment

**For production use:**

1. **Clone to Production Server**

```bash
cd /opt
sudo git clone https://github.com/Johnny2x2/ExpressionEngineV7MCP.git
cd ExpressionEngineV7MCP
sudo npm install --production
```

2. **Production Configuration**

```bash
sudo cp .env.example .env
sudo nano .env
```

Set production values:

```bash
EE_DB_HOST=production-db-host
EE_DB_PORT=3306
EE_DB_USER=ee_mcp_user
EE_DB_PASSWORD=strong_secure_password
EE_DB_DATABASE=expressionengine_prod
EE_BASE_PATH=/var/www/expressionengine
```

3. **Build**

```bash
sudo npm run build
```

4. **Set Permissions**

```bash
sudo chown -R mcp-user:mcp-group /opt/ExpressionEngineV7MCP
sudo chmod 700 .env
sudo chmod 755 build/index.js
```

5. **Test Connection**

```bash
sudo -u mcp-user npm test
```

### System Service (Optional)

For servers that need the MCP server always available:

Create `/etc/systemd/system/ee-mcp.service`:

```ini
[Unit]
Description=ExpressionEngine MCP Server
After=network.target mysql.service

[Service]
Type=simple
User=mcp-user
WorkingDirectory=/opt/ExpressionEngineV7MCP
EnvironmentFile=/opt/ExpressionEngineV7MCP/.env
ExecStart=/usr/bin/node /opt/ExpressionEngineV7MCP/build/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable ee-mcp
sudo systemctl start ee-mcp
sudo systemctl status ee-mcp
```

## Docker Deployment

### Standalone Docker Container

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

USER node

CMD ["node", "build/index.js"]
```

Build and run:

```bash
docker build -t ee-mcp-server .

docker run -d \
  --name ee-mcp \
  -e EE_DB_HOST=host.docker.internal \
  -e EE_DB_PORT=3306 \
  -e EE_DB_USER=root \
  -e EE_DB_PASSWORD= \
  -e EE_DB_DATABASE=expressionengine \
  -e EE_BASE_PATH=/shared/httpd/expressionengine \
  -v /path/to/ee:/shared/httpd/expressionengine:ro \
  ee-mcp-server
```

### Docker Compose with Devilbox

Create `docker-compose.override.yml` in your Devilbox directory:

```yaml
version: '3'

services:
  ee-mcp:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - /path/to/ExpressionEngineV7MCP:/app
      - /path/to/devilbox/data/www:/shared/httpd
    environment:
      EE_DB_HOST: mysql
      EE_DB_PORT: 3306
      EE_DB_USER: root
      EE_DB_PASSWORD: ""
      EE_DB_DATABASE: expressionengine
      EE_BASE_PATH: /shared/httpd/expressionengine
    command: sh -c "npm install && npm run build && npm start"
    depends_on:
      - mysql
```

## Cloud Deployment

### AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.micro or larger
   - Security group: Allow outbound MySQL

2. **Install Dependencies**

```bash
sudo apt update
sudo apt install -y nodejs npm git mysql-client

# Install Node 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Deploy Application**

```bash
cd /opt
sudo git clone https://github.com/Johnny2x2/ExpressionEngineV7MCP.git
cd ExpressionEngineV7MCP
sudo npm install
```

4. **Configure for RDS**

```bash
sudo nano .env
```

```bash
EE_DB_HOST=your-rds-endpoint.rds.amazonaws.com
EE_DB_PORT=3306
EE_DB_USER=admin
EE_DB_PASSWORD=your-rds-password
EE_DB_DATABASE=expressionengine
EE_BASE_PATH=/var/www/expressionengine
```

5. **Build and Test**

```bash
sudo npm run build
sudo npm test
```

### Google Cloud Platform

Similar to AWS, use Google Cloud SQL for MySQL and Compute Engine for the MCP server.

### Azure

Use Azure Database for MySQL and Azure Virtual Machine.

## Security Hardening

### Database Security

1. **Create Dedicated Database User**

```sql
CREATE USER 'ee_mcp'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE ON expressionengine.* TO 'ee_mcp'@'localhost';
FLUSH PRIVILEGES;
```

2. **Use SSL for Database Connections**

Update code to use SSL (if needed):

```typescript
const pool = mysql.createPool({
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbDatabase,
  ssl: {
    ca: fs.readFileSync('/path/to/ca-cert.pem'),
  },
});
```

### File System Security

1. **Restrict File Access**

```bash
# Application files
sudo chown -R mcp-user:mcp-group /opt/ExpressionEngineV7MCP
sudo chmod -R 755 /opt/ExpressionEngineV7MCP
sudo chmod 700 .env

# EE files (read-only for MCP)
sudo chmod -R 755 /var/www/expressionengine
```

2. **Disable Unnecessary Features**

If you don't need file write operations, remove the `write_file` tool from the code.

### Network Security

1. **Firewall Rules**

```bash
# Only allow MySQL from MCP server
sudo ufw allow from mcp-server-ip to any port 3306

# Block all other MySQL access
sudo ufw deny 3306
```

2. **VPN Access**

Consider running the MCP server on a VPN-connected machine for additional security.

## Monitoring and Maintenance

### Logging

Add logging to the MCP server:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Use in handlers
logger.info('Channel created', { channelId: result.insertId });
```

### Health Checks

Create a health check script `health-check.js`:

```javascript
import mysql from 'mysql2/promise';

async function healthCheck() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.EE_DB_HOST,
      port: process.env.EE_DB_PORT,
      user: process.env.EE_DB_USER,
      password: process.env.EE_DB_PASSWORD,
      database: process.env.EE_DB_DATABASE,
    });
    
    await connection.ping();
    console.log('✓ Database connection healthy');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
```

Run periodically:

```bash
*/5 * * * * cd /opt/ExpressionEngineV7MCP && node health-check.js >> /var/log/ee-mcp-health.log 2>&1
```

### Backups

Regular database backups:

```bash
#!/bin/bash
# backup-ee.sh

mysqldump -h $EE_DB_HOST -u $EE_DB_USER -p$EE_DB_PASSWORD $EE_DB_DATABASE \
  | gzip > /backups/ee-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 30 days
find /backups -name "ee-*.sql.gz" -mtime +30 -delete
```

### Updates

Update the MCP server:

```bash
cd /opt/ExpressionEngineV7MCP
sudo git pull
sudo npm install
sudo npm run build
sudo npm test
sudo systemctl restart ee-mcp  # If using systemd
```

## Troubleshooting

### Connection Issues

```bash
# Test database connection
mysql -h $EE_DB_HOST -P $EE_DB_PORT -u $EE_DB_USER -p$EE_DB_PASSWORD $EE_DB_DATABASE

# Check if port is accessible
nc -zv $EE_DB_HOST $EE_DB_PORT

# Verify environment variables
env | grep EE_
```

### Permission Issues

```bash
# Check file permissions
ls -la /opt/ExpressionEngineV7MCP
ls -la /var/www/expressionengine

# Check process owner
ps aux | grep node
```

### Performance Issues

```bash
# Monitor MySQL connections
mysqladmin -h $EE_DB_HOST -u $EE_DB_USER -p$EE_DB_PASSWORD processlist

# Check system resources
top
df -h
```

## Best Practices

1. **Always use environment variables** for configuration
2. **Never commit** `.env` files to version control
3. **Use strong passwords** for database users
4. **Restrict database permissions** to minimum required
5. **Keep the server updated** with security patches
6. **Monitor logs** for suspicious activity
7. **Test in development** before deploying to production
8. **Backup regularly** both database and configuration
9. **Document your setup** for future reference
10. **Use HTTPS/TLS** for all connections when possible

## Support

For deployment issues:
- Check the logs
- Review this guide
- Open an issue on GitHub
- Consult the other documentation files

## Additional Resources

- [README.md](README.md) - Main documentation
- [DEVILBOX.md](DEVILBOX.md) - Devilbox-specific setup
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide
