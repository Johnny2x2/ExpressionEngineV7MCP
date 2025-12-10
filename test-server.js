#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server structure
 * This doesn't test actual database connections, just the tool definitions
 */

import { readFileSync } from 'fs';

const indexPath = './build/index.js';

try {
  console.log('Testing ExpressionEngine MCP Server...\n');
  
  // Read the built file
  const content = readFileSync(indexPath, 'utf-8');
  
  // Check for essential components
  const checks = [
    { name: 'Server initialization', pattern: 'new Server' },
    { name: 'Channel management tools', pattern: 'ee_add_channel' },
    { name: 'Field management tools', pattern: 'ee_add_field' },
    { name: 'Template management tools', pattern: 'ee_add_template' },
    { name: 'Entry management tools', pattern: 'ee_add_entry' },
    { name: 'Category management tools', pattern: 'ee_add_category' },
    { name: 'File management tools', pattern: 'ee_upload_file' },
    { name: 'File I/O tools', pattern: 'read_file' },
    { name: 'Database query tools', pattern: 'execute_sql' },
    { name: 'MySQL connection pooling', pattern: 'mysql.createPool' },
    { name: 'Tool handlers', pattern: 'CallToolRequestSchema' },
    { name: 'Stdio transport', pattern: 'StdioServerTransport' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✓ ${check.name}`);
      passed++;
    } else {
      console.log(`✗ ${check.name} - NOT FOUND`);
      failed++;
    }
  });
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(50)}\n`);
  
  if (failed === 0) {
    console.log('✓ All checks passed! Server structure is correct.\n');
    console.log('Note: This test verifies the server structure only.');
    console.log('To fully test the server, you need:');
    console.log('  1. A running MySQL database');
    console.log('  2. Expression Engine V7 installed');
    console.log('  3. Proper environment variables configured');
    console.log('\nSee README.md and DEVILBOX.md for setup instructions.');
    process.exit(0);
  } else {
    console.error('✗ Some checks failed. Please review the build output.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('Error running tests:', error.message);
  console.error('\nMake sure to run "npm run build" first.');
  process.exit(1);
}
