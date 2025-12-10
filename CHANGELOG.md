# Changelog

All notable changes to the ExpressionEngine MCP Server will be documented in this file.

## [1.0.0] - 2024-12-10

### Added

#### Core Features
- Initial release of ExpressionEngine V7 MCP Server
- Support for Expression Engine running in Devilbox Docker containers
- Complete MCP (Model Context Protocol) integration

#### Channel Management
- `ee_add_channel` - Create new channels
- `ee_list_channels` - List all channels with optional filtering

#### Field Management
- `ee_add_field` - Add custom fields to field groups
- `ee_list_fields` - List fields with optional group filtering

#### Template Management
- `ee_add_template` - Create new templates
- `ee_list_templates` - List templates with filtering by group and site

#### Entry Management
- `ee_add_entry` - Create channel entries with custom field support
- `ee_list_entries` - List entries with channel filtering and limits

#### Category Management
- `ee_add_category` - Create categories with parent support
- `ee_list_categories` - List categories with group filtering

#### File Management
- `ee_upload_file` - Upload files to EE file manager
- `ee_list_files` - List files in upload directories

#### File I/O Access
- `read_file` - Read any file from the server
- `write_file` - Write content to files with directory creation
- `list_directory` - List directory contents with recursive option

#### Database Access
- `execute_sql` - Execute raw SQL queries (INSERT, UPDATE, DELETE)
- `query_sql` - Execute SELECT queries with result returns
- Connection pooling for efficient database access
- Prepared statement support for SQL injection prevention

#### Configuration
- Environment variable-based configuration
- Support for custom database hosts, ports, users, and passwords
- Configurable Expression Engine base path
- Default values for Devilbox setups

#### Documentation
- Comprehensive README with feature overview
- Detailed USAGE guide with examples
- DEVILBOX-specific integration guide
- Quick start guide for fast setup
- Example Claude Desktop configuration
- Environment variable templates

#### Developer Experience
- TypeScript implementation with type safety
- Automated build process
- Structure validation tests
- ESM module support
- Proper error handling and reporting

### Technical Details
- Built with @modelcontextprotocol/sdk
- MySQL2 for database connections
- Node.js 18+ required
- Stdio transport for MCP communication
- Automatic connection pool management

### Security
- Prepared statements for SQL queries
- Sandboxed file access within base path
- Password support for database connections
- No hardcoded credentials
