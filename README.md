# ExpressionEngine V7 MCP Server

A Model Context Protocol (MCP) server for managing Expression Engine V7 installations running in Devilbox Docker containers. This server provides comprehensive tools for managing channels, fields, templates, entries, categories, files, and direct database access.

## Features

- **Channel Management**: Create and list channels
- **Field Management**: Add and list custom fields
- **Template Management**: Create and manage templates
- **Entry Management**: Add and list channel entries
- **Category Management**: Create and list categories
- **File Management**: Upload and list files in the EE file manager
- **File I/O Access**: Read, write, and list server files
- **Database Queries**: Execute raw SQL queries on the EE database

## Installation

```bash
npm install
npm run build
```

## Configuration

The server uses environment variables for configuration. Create a `.env` file or set these variables:

- `EE_DB_HOST`: Database host (default: `127.0.0.1`)
- `EE_DB_PORT`: Database port (default: `3306`)
- `EE_DB_USER`: Database user (default: `root`)
- `EE_DB_PASSWORD`: Database password (default: empty)
- `EE_DB_DATABASE`: Database name (default: `expressionengine`)
- `EE_BASE_PATH`: Expression Engine installation path (default: `/shared/httpd/expressionengine`)

### Devilbox Configuration

For a typical Devilbox setup:

```bash
export EE_DB_HOST=127.0.0.1
export EE_DB_PORT=3306
export EE_DB_USER=root
export EE_DB_PASSWORD=
export EE_DB_DATABASE=expressionengine
export EE_BASE_PATH=/shared/httpd/expressionengine
```

## Usage

### Running the Server

```bash
npm start
```

Or directly:

```bash
node build/index.js
```

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop config):

```json
{
  "mcpServers": {
    "expressionengine": {
      "command": "node",
      "args": ["/path/to/ExpressionEngineV7MCP/build/index.js"],
      "env": {
        "EE_DB_HOST": "127.0.0.1",
        "EE_DB_PORT": "3306",
        "EE_DB_USER": "root",
        "EE_DB_PASSWORD": "",
        "EE_DB_DATABASE": "expressionengine",
        "EE_BASE_PATH": "/shared/httpd/expressionengine"
      }
    }
  }
}
```

## Available Tools

### Channel Management

#### `ee_add_channel`
Add a new channel to Expression Engine.

**Parameters:**
- `channel_title` (string, required): The title of the channel
- `channel_name` (string, required): The short name of the channel (URL-safe)
- `site_id` (number, optional): The site ID (default: 1)

#### `ee_list_channels`
List all channels in Expression Engine.

**Parameters:**
- `site_id` (number, optional): Filter by site ID

### Field Management

#### `ee_add_field`
Add a new field to Expression Engine.

**Parameters:**
- `field_name` (string, required): The short name of the field
- `field_label` (string, required): The label of the field
- `field_type` (string, required): The type of field (text, textarea, select, etc.)
- `group_id` (number, required): The field group ID

#### `ee_list_fields`
List all fields in Expression Engine.

**Parameters:**
- `group_id` (number, optional): Filter by field group ID

### Template Management

#### `ee_add_template`
Add a new template to Expression Engine.

**Parameters:**
- `template_name` (string, required): The name of the template
- `template_data` (string, required): The content of the template
- `group_id` (number, required): The template group ID
- `template_type` (string, optional): The type of template (webpage, css, js, etc., default: webpage)
- `site_id` (number, optional): The site ID (default: 1)

#### `ee_list_templates`
List all templates in Expression Engine.

**Parameters:**
- `group_id` (number, optional): Filter by template group ID
- `site_id` (number, optional): Filter by site ID

### Entry Management

#### `ee_add_entry`
Add a new entry to Expression Engine.

**Parameters:**
- `title` (string, required): The title of the entry
- `channel_id` (number, required): The channel ID
- `author_id` (number, optional): The author ID (default: 1)
- `status` (string, optional): The status of the entry (default: "open")
- `custom_fields` (object, optional): Custom field data as key-value pairs

#### `ee_list_entries`
List entries in Expression Engine.

**Parameters:**
- `channel_id` (number, optional): Filter by channel ID
- `limit` (number, optional): Maximum number of entries to return (default: 100)

### Category Management

#### `ee_add_category`
Add a new category to Expression Engine.

**Parameters:**
- `cat_name` (string, required): The name of the category
- `cat_url_title` (string, required): The URL-safe title of the category
- `group_id` (number, required): The category group ID
- `parent_id` (number, optional): The parent category ID (default: 0)

#### `ee_list_categories`
List categories in Expression Engine.

**Parameters:**
- `group_id` (number, optional): Filter by category group ID

### File Management

#### `ee_upload_file`
Upload a file to Expression Engine file manager.

**Parameters:**
- `file_name` (string, required): The name of the file
- `file_path` (string, required): The local path to the file to upload
- `upload_location_id` (number, required): The upload directory ID
- `title` (string, optional): The title of the file (defaults to file_name)

#### `ee_list_files`
List files in Expression Engine file manager.

**Parameters:**
- `upload_location_id` (number, optional): Filter by upload directory ID

### File I/O Access

#### `read_file`
Read a file from the Expression Engine server.

**Parameters:**
- `file_path` (string, required): The path to the file (relative to EE base path or absolute)

#### `write_file`
Write content to a file on the Expression Engine server.

**Parameters:**
- `file_path` (string, required): The path to the file (relative to EE base path or absolute)
- `content` (string, required): The content to write to the file
- `create_directories` (boolean, optional): Create parent directories if they don't exist (default: false)

#### `list_directory`
List contents of a directory on the Expression Engine server.

**Parameters:**
- `directory_path` (string, required): The path to the directory (relative to EE base path or absolute)
- `recursive` (boolean, optional): List directories recursively (default: false)

### Database Queries

#### `execute_sql`
Execute a raw SQL query on the Expression Engine database (INSERT, UPDATE, DELETE).

**Parameters:**
- `query` (string, required): The SQL query to execute
- `params` (array, optional): Parameters for prepared statement

#### `query_sql`
Execute a SQL SELECT query and return results.

**Parameters:**
- `query` (string, required): The SQL SELECT query to execute
- `params` (array, optional): Parameters for prepared statement

## Examples

### Creating a Channel

```javascript
{
  "tool": "ee_add_channel",
  "arguments": {
    "channel_title": "Blog Posts",
    "channel_name": "blog",
    "site_id": 1
  }
}
```

### Adding an Entry

```javascript
{
  "tool": "ee_add_entry",
  "arguments": {
    "title": "My First Blog Post",
    "channel_id": 1,
    "status": "open",
    "custom_fields": {
      "id_1": "This is the blog content",
      "id_2": "Summary text"
    }
  }
}
```

### Reading a Template File

```javascript
{
  "tool": "read_file",
  "arguments": {
    "file_path": "system/user/templates/default_site/index.group/index.html"
  }
}
```

### Executing a SQL Query

```javascript
{
  "tool": "query_sql",
  "arguments": {
    "query": "SELECT * FROM exp_channels WHERE site_id = ?",
    "params": [1]
  }
}
```

## Security Considerations

- **Database Access**: This server has full access to your Expression Engine database. Use appropriate credentials and network security.
- **File System Access**: The server can read and write files within the configured base path. Ensure proper permissions.
- **SQL Injection**: All SQL queries use prepared statements to prevent SQL injection attacks.
- **Network Security**: When running in Docker, ensure proper network isolation.

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

## Requirements

- Node.js 18 or higher
- Expression Engine V7
- MySQL/MariaDB database
- Devilbox Docker setup (optional but recommended)

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
