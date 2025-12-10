#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Server configuration
interface ServerConfig {
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbDatabase: string;
  eeBasePath: string;
}

// Get configuration from environment variables or use defaults for Devilbox
const config: ServerConfig = {
  dbHost: process.env.EE_DB_HOST || "127.0.0.1",
  dbPort: parseInt(process.env.EE_DB_PORT || "3306"),
  dbUser: process.env.EE_DB_USER || "root",
  dbPassword: process.env.EE_DB_PASSWORD || "",
  dbDatabase: process.env.EE_DB_DATABASE || "expressionengine",
  eeBasePath: process.env.EE_BASE_PATH || "/shared/httpd/expressionengine",
};

// Database connection pool
let pool: mysql.Pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.dbHost,
      port: config.dbPort,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbDatabase,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// Tool definitions
const TOOLS: Tool[] = [
  // Channel Management
  {
    name: "ee_add_channel",
    description: "Add a new channel to Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        channel_title: {
          type: "string",
          description: "The title of the channel",
        },
        channel_name: {
          type: "string",
          description: "The short name of the channel (URL-safe)",
        },
        site_id: {
          type: "number",
          description: "The site ID (default: 1)",
          default: 1,
        },
      },
      required: ["channel_title", "channel_name"],
    },
  },
  {
    name: "ee_list_channels",
    description: "List all channels in Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        site_id: {
          type: "number",
          description: "Filter by site ID (optional)",
        },
      },
    },
  },
  // Field Management
  {
    name: "ee_add_field",
    description: "Add a new field to Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        field_name: {
          type: "string",
          description: "The short name of the field",
        },
        field_label: {
          type: "string",
          description: "The label of the field",
        },
        field_type: {
          type: "string",
          description: "The type of field (text, textarea, select, etc.)",
        },
        group_id: {
          type: "number",
          description: "The field group ID",
        },
      },
      required: ["field_name", "field_label", "field_type", "group_id"],
    },
  },
  {
    name: "ee_list_fields",
    description: "List all fields in Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "number",
          description: "Filter by field group ID (optional)",
        },
      },
    },
  },
  // Template Management
  {
    name: "ee_add_template",
    description: "Add a new template to Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        template_name: {
          type: "string",
          description: "The name of the template",
        },
        template_data: {
          type: "string",
          description: "The content of the template",
        },
        template_type: {
          type: "string",
          description: "The type of template (webpage, css, js, etc.)",
          default: "webpage",
        },
        group_id: {
          type: "number",
          description: "The template group ID",
        },
        site_id: {
          type: "number",
          description: "The site ID (default: 1)",
          default: 1,
        },
      },
      required: ["template_name", "template_data", "group_id"],
    },
  },
  {
    name: "ee_list_templates",
    description: "List all templates in Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "number",
          description: "Filter by template group ID (optional)",
        },
        site_id: {
          type: "number",
          description: "Filter by site ID (optional)",
        },
      },
    },
  },
  // Entry Management
  {
    name: "ee_add_entry",
    description: "Add a new entry to Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title of the entry",
        },
        channel_id: {
          type: "number",
          description: "The channel ID",
        },
        author_id: {
          type: "number",
          description: "The author ID (default: 1)",
          default: 1,
        },
        status: {
          type: "string",
          description: "The status of the entry (open, closed, etc.)",
          default: "open",
        },
        custom_fields: {
          type: "object",
          description: "Custom field data as key-value pairs",
        },
      },
      required: ["title", "channel_id"],
    },
  },
  {
    name: "ee_list_entries",
    description: "List entries in Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "number",
          description: "Filter by channel ID (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of entries to return",
          default: 100,
        },
      },
    },
  },
  // Category Management
  {
    name: "ee_add_category",
    description: "Add a new category to Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        cat_name: {
          type: "string",
          description: "The name of the category",
        },
        cat_url_title: {
          type: "string",
          description: "The URL-safe title of the category",
        },
        group_id: {
          type: "number",
          description: "The category group ID",
        },
        parent_id: {
          type: "number",
          description: "The parent category ID (optional)",
          default: 0,
        },
      },
      required: ["cat_name", "cat_url_title", "group_id"],
    },
  },
  {
    name: "ee_list_categories",
    description: "List categories in Expression Engine",
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "number",
          description: "Filter by category group ID (optional)",
        },
      },
    },
  },
  // File Management
  {
    name: "ee_upload_file",
    description: "Upload a file to Expression Engine file manager",
    inputSchema: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "The name of the file",
        },
        file_path: {
          type: "string",
          description: "The local path to the file to upload",
        },
        upload_location_id: {
          type: "number",
          description: "The upload directory ID",
          default: 1,
        },
        title: {
          type: "string",
          description: "The title of the file",
        },
      },
      required: ["file_name", "file_path", "upload_location_id"],
    },
  },
  {
    name: "ee_list_files",
    description: "List files in Expression Engine file manager",
    inputSchema: {
      type: "object",
      properties: {
        upload_location_id: {
          type: "number",
          description: "Filter by upload directory ID (optional)",
        },
      },
    },
  },
  // File I/O Access
  {
    name: "read_file",
    description: "Read a file from the Expression Engine server",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file relative to EE base path or absolute path",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file on the Expression Engine server",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file relative to EE base path or absolute path",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
        create_directories: {
          type: "boolean",
          description: "Create parent directories if they don't exist",
          default: false,
        },
      },
      required: ["file_path", "content"],
    },
  },
  {
    name: "list_directory",
    description: "List contents of a directory on the Expression Engine server",
    inputSchema: {
      type: "object",
      properties: {
        directory_path: {
          type: "string",
          description: "The path to the directory relative to EE base path or absolute path",
        },
        recursive: {
          type: "boolean",
          description: "List directories recursively",
          default: false,
        },
      },
      required: ["directory_path"],
    },
  },
  // Database Queries
  {
    name: "execute_sql",
    description: "Execute a raw SQL query on the Expression Engine database",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The SQL query to execute",
        },
        params: {
          type: "array",
          description: "Parameters for prepared statement (optional)",
          items: {
            type: ["string", "number", "boolean", "null"],
          },
        },
      },
      required: ["query"],
    },
  },
  {
    name: "query_sql",
    description: "Execute a SQL SELECT query and return results",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The SQL SELECT query to execute",
        },
        params: {
          type: "array",
          description: "Parameters for prepared statement (optional)",
          items: {
            type: ["string", "number", "boolean", "null"],
          },
        },
      },
      required: ["query"],
    },
  },
];

// Tool handlers
async function handleChannelAdd(args: any) {
  const pool = getPool();
  const { channel_title, channel_name, site_id = 1 } = args;

  const [result] = await pool.execute(
    `INSERT INTO exp_channels (site_id, channel_name, channel_title, channel_url, channel_description, 
      channel_lang, total_entries, total_comments, last_entry_date, last_comment_date)
    VALUES (?, ?, ?, ?, '', 'en', 0, 0, 0, 0)`,
    [site_id, channel_name, channel_title, `/${channel_name}/`]
  );

  return {
    content: [
      {
        type: "text",
        text: `Channel "${channel_title}" (${channel_name}) created successfully with ID: ${(result as any).insertId}`,
      },
    ],
  };
}

async function handleChannelList(args: any) {
  const pool = getPool();
  const { site_id } = args;

  let query = "SELECT * FROM exp_channels";
  const params: any[] = [];

  if (site_id) {
    query += " WHERE site_id = ?";
    params.push(site_id);
  }

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleFieldAdd(args: any) {
  const pool = getPool();
  const { field_name, field_label, field_type, group_id } = args;

  const [result] = await pool.execute(
    `INSERT INTO exp_channel_fields (site_id, group_id, field_name, field_label, field_type, 
      field_order, field_required, field_search, field_is_hidden)
    VALUES (1, ?, ?, ?, ?, 0, 'n', 'y', 'n')`,
    [group_id, field_name, field_label, field_type]
  );

  return {
    content: [
      {
        type: "text",
        text: `Field "${field_label}" (${field_name}) created successfully with ID: ${(result as any).insertId}`,
      },
    ],
  };
}

async function handleFieldList(args: any) {
  const pool = getPool();
  const { group_id } = args;

  let query = "SELECT * FROM exp_channel_fields";
  const params: any[] = [];

  if (group_id) {
    query += " WHERE group_id = ?";
    params.push(group_id);
  }

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleTemplateAdd(args: any) {
  const pool = getPool();
  const { template_name, template_data, template_type = "webpage", group_id, site_id = 1 } = args;

  const [result] = await pool.execute(
    `INSERT INTO exp_templates (site_id, group_id, template_name, template_type, template_data, 
      edit_date, last_author_id, save_template_file)
    VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP(), 1, 'n')`,
    [site_id, group_id, template_name, template_type, template_data]
  );

  return {
    content: [
      {
        type: "text",
        text: `Template "${template_name}" created successfully with ID: ${(result as any).insertId}`,
      },
    ],
  };
}

async function handleTemplateList(args: any) {
  const pool = getPool();
  const { group_id, site_id } = args;

  let query = "SELECT * FROM exp_templates WHERE 1=1";
  const params: any[] = [];

  if (group_id) {
    query += " AND group_id = ?";
    params.push(group_id);
  }

  if (site_id) {
    query += " AND site_id = ?";
    params.push(site_id);
  }

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleEntryAdd(args: any) {
  const pool = getPool();
  const { title, channel_id, author_id = 1, status = "open", custom_fields = {} } = args;

  const timestamp = Math.floor(Date.now() / 1000);
  const url_title = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const [result] = await pool.execute(
    `INSERT INTO exp_channel_titles (site_id, channel_id, author_id, title, url_title, status, 
      entry_date, edit_date, versioning_enabled)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, 'n')`,
    [channel_id, author_id, title, url_title, status, timestamp, timestamp]
  );

  const entryId = (result as any).insertId;

  // Insert channel data entry
  await pool.execute(
    `INSERT INTO exp_channel_data (entry_id, site_id, channel_id) VALUES (?, 1, ?)`,
    [entryId, channel_id]
  );

  // Handle custom fields if provided
  if (Object.keys(custom_fields).length > 0) {
    const fieldUpdates: string[] = [];
    const fieldValues: any[] = [];

    for (const [fieldName, fieldValue] of Object.entries(custom_fields)) {
      fieldUpdates.push(`field_${fieldName} = ?`);
      fieldValues.push(fieldValue);
    }

    if (fieldUpdates.length > 0) {
      await pool.execute(
        `UPDATE exp_channel_data SET ${fieldUpdates.join(", ")} WHERE entry_id = ?`,
        [...fieldValues, entryId]
      );
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Entry "${title}" created successfully with ID: ${entryId}`,
      },
    ],
  };
}

async function handleEntryList(args: any) {
  const pool = getPool();
  const { channel_id, limit = 100 } = args;

  let query = "SELECT * FROM exp_channel_titles";
  const params: any[] = [];

  if (channel_id) {
    query += " WHERE channel_id = ?";
    params.push(channel_id);
  }

  query += " LIMIT ?";
  params.push(limit);

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleCategoryAdd(args: any) {
  const pool = getPool();
  const { cat_name, cat_url_title, group_id, parent_id = 0 } = args;

  const [result] = await pool.execute(
    `INSERT INTO exp_categories (site_id, group_id, parent_id, cat_name, cat_url_title, cat_order)
    VALUES (1, ?, ?, ?, ?, 0)`,
    [group_id, parent_id, cat_name, cat_url_title]
  );

  return {
    content: [
      {
        type: "text",
        text: `Category "${cat_name}" created successfully with ID: ${(result as any).insertId}`,
      },
    ],
  };
}

async function handleCategoryList(args: any) {
  const pool = getPool();
  const { group_id } = args;

  let query = "SELECT * FROM exp_categories";
  const params: any[] = [];

  if (group_id) {
    query += " WHERE group_id = ?";
    params.push(group_id);
  }

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleFileUpload(args: any) {
  const pool = getPool();
  const { file_name, file_path, upload_location_id, title = file_name } = args;

  // Read file stats
  const stats = await fs.stat(file_path);
  const timestamp = Math.floor(Date.now() / 1000);

  // Get upload location info
  const [locations] = await pool.execute(
    "SELECT server_path FROM exp_upload_prefs WHERE id = ?",
    [upload_location_id]
  );

  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error(`Upload location ${upload_location_id} not found`);
  }

  const serverPath = (locations[0] as any).server_path;
  const destPath = path.join(serverPath, file_name);

  // Copy file to upload directory
  await fs.copyFile(file_path, destPath);

  // Insert file record
  const [result] = await pool.execute(
    `INSERT INTO exp_files (site_id, title, upload_location_id, file_name, file_size, 
      uploaded_by_member_id, upload_date, modified_by_member_id, modified_date)
    VALUES (1, ?, ?, ?, ?, 1, ?, 1, ?)`,
    [title, upload_location_id, file_name, stats.size, timestamp, timestamp]
  );

  return {
    content: [
      {
        type: "text",
        text: `File "${file_name}" uploaded successfully with ID: ${(result as any).insertId}`,
      },
    ],
  };
}

async function handleFileList(args: any) {
  const pool = getPool();
  const { upload_location_id } = args;

  let query = "SELECT * FROM exp_files";
  const params: any[] = [];

  if (upload_location_id) {
    query += " WHERE upload_location_id = ?";
    params.push(upload_location_id);
  }

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

async function handleReadFile(args: any) {
  const { file_path } = args;
  const fullPath = path.isAbsolute(file_path)
    ? file_path
    : path.join(config.eeBasePath, file_path);

  const content = await fs.readFile(fullPath, "utf-8");

  return {
    content: [
      {
        type: "text",
        text: content,
      },
    ],
  };
}

async function handleWriteFile(args: any) {
  const { file_path, content, create_directories = false } = args;
  const fullPath = path.isAbsolute(file_path)
    ? file_path
    : path.join(config.eeBasePath, file_path);

  if (create_directories) {
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
  }

  await fs.writeFile(fullPath, content, "utf-8");

  return {
    content: [
      {
        type: "text",
        text: `File written successfully to ${fullPath}`,
      },
    ],
  };
}

async function handleListDirectory(args: any) {
  const { directory_path, recursive = false } = args;
  const fullPath = path.isAbsolute(directory_path)
    ? directory_path
    : path.join(config.eeBasePath, directory_path);

  const listDir = async (dir: string, prefix = ""): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const results: string[] = [];

    for (const entry of entries) {
      const fullEntry = path.join(dir, entry.name);
      const relativePath = path.join(prefix, entry.name);

      if (entry.isDirectory()) {
        results.push(`${relativePath}/`);
        if (recursive) {
          const subResults = await listDir(fullEntry, relativePath);
          results.push(...subResults);
        }
      } else {
        results.push(relativePath);
      }
    }

    return results;
  };

  const entries = await listDir(fullPath);

  return {
    content: [
      {
        type: "text",
        text: entries.join("\n"),
      },
    ],
  };
}

async function handleExecuteSQL(args: any) {
  const pool = getPool();
  const { query, params = [] } = args;

  const [result] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: `Query executed successfully. Affected rows: ${(result as any).affectedRows || 0}`,
      },
    ],
  };
}

async function handleQuerySQL(args: any) {
  const pool = getPool();
  const { query, params = [] } = args;

  const [rows] = await pool.execute(query, params);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(rows, null, 2),
      },
    ],
  };
}

// Create and start server
const server = new Server(
  {
    name: "expressionengine-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Channel management
      case "ee_add_channel":
        return await handleChannelAdd(args);
      case "ee_list_channels":
        return await handleChannelList(args);

      // Field management
      case "ee_add_field":
        return await handleFieldAdd(args);
      case "ee_list_fields":
        return await handleFieldList(args);

      // Template management
      case "ee_add_template":
        return await handleTemplateAdd(args);
      case "ee_list_templates":
        return await handleTemplateList(args);

      // Entry management
      case "ee_add_entry":
        return await handleEntryAdd(args);
      case "ee_list_entries":
        return await handleEntryList(args);

      // Category management
      case "ee_add_category":
        return await handleCategoryAdd(args);
      case "ee_list_categories":
        return await handleCategoryList(args);

      // File management
      case "ee_upload_file":
        return await handleFileUpload(args);
      case "ee_list_files":
        return await handleFileList(args);

      // File I/O
      case "read_file":
        return await handleReadFile(args);
      case "write_file":
        return await handleWriteFile(args);
      case "list_directory":
        return await handleListDirectory(args);

      // Database queries
      case "execute_sql":
        return await handleExecuteSQL(args);
      case "query_sql":
        return await handleQuerySQL(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ExpressionEngine MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
