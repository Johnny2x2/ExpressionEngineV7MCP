# ExpressionEngine MCP Server Usage Guide

This guide provides detailed examples of how to use the ExpressionEngine MCP Server.

## Setup

### 1. Configure Environment Variables

First, set up your environment variables to connect to your Expression Engine installation:

```bash
export EE_DB_HOST=127.0.0.1
export EE_DB_PORT=3306
export EE_DB_USER=root
export EE_DB_PASSWORD=your_password
export EE_DB_DATABASE=expressionengine
export EE_BASE_PATH=/shared/httpd/expressionengine
```

### 2. Start the Server

```bash
npm start
```

## Common Workflows

### Creating a Complete Channel Setup

This workflow shows how to create a channel with custom fields and templates.

#### Step 1: Create a Channel

```
Tool: ee_add_channel
Arguments:
{
  "channel_title": "Blog Posts",
  "channel_name": "blog",
  "site_id": 1
}
```

#### Step 2: List Channels to Get the Channel ID

```
Tool: ee_list_channels
Arguments: {}
```

#### Step 3: Add Custom Fields

First, you need a field group. Query the database to find or create one:

```
Tool: query_sql
Arguments:
{
  "query": "SELECT * FROM exp_field_groups"
}
```

Then add fields:

```
Tool: ee_add_field
Arguments:
{
  "field_name": "blog_content",
  "field_label": "Blog Content",
  "field_type": "textarea",
  "group_id": 1
}
```

#### Step 4: Create a Template

First, get or create a template group:

```
Tool: query_sql
Arguments:
{
  "query": "SELECT * FROM exp_template_groups"
}
```

Then add a template:

```
Tool: ee_add_template
Arguments:
{
  "template_name": "index",
  "template_data": "{exp:channel:entries channel=\"blog\"}\n  <h2>{title}</h2>\n  <div>{blog_content}</div>\n{/exp:channel:entries}",
  "template_type": "webpage",
  "group_id": 1
}
```

#### Step 5: Add an Entry

```
Tool: ee_add_entry
Arguments:
{
  "title": "My First Blog Post",
  "channel_id": 1,
  "status": "open",
  "custom_fields": {
    "id_1": "This is the content of my first blog post!"
  }
}
```

### Managing Categories

#### Create a Category Group

```
Tool: execute_sql
Arguments:
{
  "query": "INSERT INTO exp_category_groups (site_id, group_name) VALUES (?, ?)",
  "params": [1, "Blog Categories"]
}
```

#### Add Categories

```
Tool: ee_add_category
Arguments:
{
  "cat_name": "Technology",
  "cat_url_title": "technology",
  "group_id": 1
}
```

```
Tool: ee_add_category
Arguments:
{
  "cat_name": "Design",
  "cat_url_title": "design",
  "group_id": 1
}
```

### File Management

#### Upload a File

```
Tool: ee_upload_file
Arguments:
{
  "file_name": "hero-image.jpg",
  "file_path": "/path/to/local/hero-image.jpg",
  "upload_location_id": 1,
  "title": "Hero Image for Homepage"
}
```

#### List Files

```
Tool: ee_list_files
Arguments:
{
  "upload_location_id": 1
}
```

### Working with Template Files

#### Read a Template File

```
Tool: read_file
Arguments:
{
  "file_path": "system/user/templates/default_site/site.group/index.html"
}
```

#### Modify a Template File

```
Tool: write_file
Arguments:
{
  "file_path": "system/user/templates/default_site/site.group/header.html",
  "content": "<header>\n  <h1>My Website</h1>\n  <nav>{embed=\"site/nav\"}</nav>\n</header>",
  "create_directories": true
}
```

#### List Template Directory

```
Tool: list_directory
Arguments:
{
  "directory_path": "system/user/templates/default_site",
  "recursive": true
}
```

### Database Operations

#### Get Channel Information

```
Tool: query_sql
Arguments:
{
  "query": "SELECT channel_id, channel_name, channel_title FROM exp_channels WHERE site_id = ?",
  "params": [1]
}
```

#### Find Entries by Date

```
Tool: query_sql
Arguments:
{
  "query": "SELECT title, entry_date FROM exp_channel_titles WHERE channel_id = ? AND entry_date > ? ORDER BY entry_date DESC",
  "params": [1, 1609459200]
}
```

#### Update Entry Status

```
Tool: execute_sql
Arguments:
{
  "query": "UPDATE exp_channel_titles SET status = ? WHERE entry_id = ?",
  "params": ["closed", 42]
}
```

#### Complex Query with Joins

```
Tool: query_sql
Arguments:
{
  "query": "SELECT t.title, t.entry_date, c.channel_name FROM exp_channel_titles t JOIN exp_channels c ON t.channel_id = c.channel_id WHERE t.site_id = ? LIMIT ?",
  "params": [1, 10]
}
```

## Advanced Use Cases

### Bulk Entry Creation

You can create multiple entries by calling the tool multiple times:

```javascript
// Entry 1
{
  "tool": "ee_add_entry",
  "arguments": {
    "title": "Post 1",
    "channel_id": 1,
    "custom_fields": {"id_1": "Content 1"}
  }
}

// Entry 2
{
  "tool": "ee_add_entry",
  "arguments": {
    "title": "Post 2",
    "channel_id": 1,
    "custom_fields": {"id_1": "Content 2"}
  }
}
```

### Migrating Content

Use SQL queries to extract data and file I/O to create backups:

```
1. Query data:
Tool: query_sql
Arguments: {"query": "SELECT * FROM exp_channel_data"}

2. Write to backup file:
Tool: write_file
Arguments: {
  "file_path": "/backups/channel_data_backup.json",
  "content": "[query results]",
  "create_directories": true
}
```

### Template Development Workflow

1. Read existing template
2. Modify locally
3. Write back to server
4. Test in browser

```
Tool: read_file
Arguments: {"file_path": "system/user/templates/default_site/blog.group/single.html"}

[Make changes to the content]

Tool: write_file
Arguments: {
  "file_path": "system/user/templates/default_site/blog.group/single.html",
  "content": "[modified template]"
}
```

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. Verify your environment variables are set correctly
2. Check that the database server is running
3. Ensure the database user has proper permissions
4. For Devilbox, make sure you're connecting to the correct host (usually 127.0.0.1 from host machine)

### File Path Issues

If file operations fail:

1. Verify the `EE_BASE_PATH` is correct
2. Check file/directory permissions
3. Use absolute paths if relative paths don't work
4. For Docker setups, ensure the path is from inside the container's perspective

### Field ID Confusion

When adding entries with custom fields, you need to use the field_id, not the field_name:

```
# Find field IDs
Tool: query_sql
Arguments: {
  "query": "SELECT field_id, field_name, field_label FROM exp_channel_fields"
}

# Then use field_id in custom_fields
Tool: ee_add_entry
Arguments: {
  "title": "My Entry",
  "channel_id": 1,
  "custom_fields": {
    "id_5": "Value for field with ID 5"
  }
}
```

## Best Practices

1. **Always query first**: Before adding entries or content, query to understand the current state
2. **Use prepared statements**: The tools use prepared statements for SQL queries to prevent injection
3. **Backup before bulk operations**: Use SQL queries to export data before making bulk changes
4. **Test on development first**: Test all operations on a development instance before production
5. **Monitor database size**: Regular queries can help track database growth
6. **Use transactions**: For complex operations, consider using database transactions

## Integration with Claude Desktop

Add this configuration to your Claude Desktop config file:

### macOS/Linux
`~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows
`%APPDATA%\Claude\claude_desktop_config.json`

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
        "EE_BASE_PATH": "/shared/httpd/expressionengine"
      }
    }
  }
}
```

Then restart Claude Desktop and you'll have access to all the ExpressionEngine tools!