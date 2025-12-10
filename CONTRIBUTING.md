# Contributing to ExpressionEngine MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Access to an Expression Engine V7 installation (for testing)
- MySQL/MariaDB database

### Initial Setup

1. **Fork and Clone**

```bash
git clone https://github.com/yourusername/ExpressionEngineV7MCP.git
cd ExpressionEngineV7MCP
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with your development settings
```

4. **Build**

```bash
npm run build
```

5. **Test**

```bash
npm test
```

## Project Structure

```
ExpressionEngineV7MCP/
├── src/
│   └── index.ts           # Main MCP server implementation
├── build/                  # Compiled JavaScript (gitignored)
├── node_modules/          # Dependencies (gitignored)
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
├── test-server.js         # Structure validation tests
├── .env.example           # Example environment configuration
├── .gitignore             # Git ignore rules
├── README.md              # Main documentation
├── USAGE.md               # Usage examples
├── DEVILBOX.md            # Devilbox integration guide
├── QUICKSTART.md          # Quick start guide
├── CHANGELOG.md           # Version history
└── CONTRIBUTING.md        # This file
```

## Development Workflow

### Making Changes

1. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**

Edit files in the `src/` directory. The main server implementation is in `src/index.ts`.

3. **Build and Test**

```bash
npm run build
npm test
```

4. **Test with Real MCP Client**

Configure Claude Desktop or another MCP client to use your development build:

```json
{
  "mcpServers": {
    "expressionengine-dev": {
      "command": "node",
      "args": ["/path/to/your/clone/build/index.js"],
      "env": {
        "EE_DB_HOST": "127.0.0.1",
        "EE_DB_PORT": "3306",
        "EE_DB_USER": "root",
        "EE_DB_PASSWORD": "",
        "EE_DB_DATABASE": "expressionengine",
        "EE_BASE_PATH": "/path/to/ee"
      }
    }
  }
}
```

5. **Commit Your Changes**

```bash
git add .
git commit -m "Add feature: description of your changes"
```

6. **Push and Create PR**

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Enable strict type checking
- Use explicit types for function parameters and return values
- Use interfaces for complex types

### Code Organization

- Keep functions focused and single-purpose
- Use descriptive variable and function names
- Add comments for complex logic
- Follow existing patterns in the codebase

### Example Code Style

```typescript
// Good
async function handleChannelAdd(args: any) {
  const { channel_title, channel_name, site_id = 1 } = args;
  
  const [result] = await pool.execute(
    `INSERT INTO exp_channels (site_id, channel_name, channel_title) VALUES (?, ?, ?)`,
    [site_id, channel_name, channel_title]
  );
  
  return {
    content: [{
      type: "text",
      text: `Channel created with ID: ${(result as any).insertId}`,
    }],
  };
}
```

## Adding New Tools

To add a new MCP tool:

1. **Add Tool Definition**

Add to the `TOOLS` array:

```typescript
{
  name: "ee_your_tool",
  description: "Description of what your tool does",
  inputSchema: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Description of param1",
      },
    },
    required: ["param1"],
  },
}
```

2. **Create Handler Function**

```typescript
async function handleYourTool(args: any) {
  const { param1 } = args;
  
  // Implement your logic here
  
  return {
    content: [{
      type: "text",
      text: "Result of your tool",
    }],
  };
}
```

3. **Register Handler**

Add to the switch statement in the `CallToolRequestSchema` handler:

```typescript
case "ee_your_tool":
  return await handleYourTool(args);
```

4. **Document Your Tool**

Add documentation to `README.md` and `USAGE.md` with examples.

5. **Test Your Tool**

- Build the project
- Test with a real MCP client
- Verify error handling
- Test edge cases

## Security Guidelines

### SQL Injection Prevention

- **Always** use prepared statements
- **Never** concatenate user input into SQL queries
- Validate field names before using in dynamic SQL

```typescript
// Good - uses prepared statements
await pool.execute(
  "SELECT * FROM exp_channels WHERE channel_id = ?",
  [channelId]
);

// Bad - vulnerable to SQL injection
await pool.execute(
  `SELECT * FROM exp_channels WHERE channel_id = ${channelId}`
);
```

### Path Traversal Prevention

- Validate file paths
- Keep operations within `EE_BASE_PATH`
- Check for `..` in paths

```typescript
// Good - validates path
const fullPath = path.isAbsolute(file_path)
  ? file_path
  : path.join(config.eeBasePath, file_path);

// Validate it's within base path
if (!fullPath.startsWith(config.eeBasePath)) {
  throw new Error("Access denied: Path outside base directory");
}
```

### Input Validation

- Validate all user inputs
- Use allow-lists over deny-lists
- Return clear error messages

```typescript
// Good - validates field names
if (!/^[a-zA-Z0-9_]+$/.test(fieldName)) {
  throw new Error(`Invalid field name: ${fieldName}`);
}
```

## Testing

### Structure Tests

Run the structure validation tests:

```bash
npm test
```

This verifies that all tools are properly defined in the compiled output.

### Manual Testing

1. Configure a test Expression Engine installation
2. Set up environment variables
3. Run the server with Claude Desktop
4. Test each tool with various inputs
5. Verify error handling
6. Check database changes

### Integration Testing

Test with real Devilbox setup:

1. Start Devilbox
2. Configure MCP server to connect
3. Test database operations
4. Test file operations
5. Test error scenarios

## Documentation

### What to Document

- New tools and their parameters
- Usage examples
- Configuration options
- Troubleshooting tips
- Breaking changes

### Where to Document

- **README.md**: Feature overview and installation
- **USAGE.md**: Detailed usage examples
- **DEVILBOX.md**: Devilbox-specific information
- **QUICKSTART.md**: Quick setup for new users
- **CHANGELOG.md**: Version history and changes

## Pull Request Process

1. **Update Documentation**
   - Add/update relevant documentation
   - Include usage examples
   - Update CHANGELOG.md

2. **Test Thoroughly**
   - Run structure tests
   - Test manually with MCP client
   - Test with real Expression Engine

3. **Create Pull Request**
   - Clear description of changes
   - Reference any related issues
   - Include screenshots if relevant

4. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Keep discussion focused and professional

5. **Merge**
   - Squash commits if requested
   - Ensure CI passes
   - Wait for maintainer approval

## Reporting Issues

### Bug Reports

Include:
- Description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, EE version)
- Error messages or logs

### Feature Requests

Include:
- Description of the feature
- Use case/motivation
- Example usage
- Alternative approaches considered

## Questions?

- Open an issue for questions
- Check existing documentation first
- Be patient and respectful

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
