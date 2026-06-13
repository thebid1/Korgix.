#!/usr/bin/env node
/**
 * Verification script for the Microsoft Work IQ MCP integration.
 *
 * This script starts the @microsoft/workiq MCP server, sends an initialize
 * request, then lists the available tools. It proves the Work IQ layer is
 * reachable from the Korgix project without modifying the React app.
 *
 * Usage:
 *   node scripts/list-workiq-tools.js
 */

const { spawn } = require('child_process');

const child = spawn('npx', ['-y', '@microsoft/workiq', 'mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';

child.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 2 && msg.result && msg.result.tools) {
        console.log('✅ Work IQ MCP server is reachable.');
        console.log('Available tools:');
        for (const tool of msg.result.tools) {
          console.log(`  - ${tool.name}: ${tool.description}`);
        }
        child.kill();
        process.exit(0);
      }
    } catch (err) {
      // Ignore non-JSON lines
    }
  }
});

child.stderr.on('data', (data) => {
  // Work IQ logs to stderr; only print errors if initialization fails
  const text = data.toString();
  if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fail')) {
    console.error(text.trim());
  }
});

const init = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'korgix-workiq-verifier', version: '1.0.0' },
  },
});

child.stdin.write(init + '\n');

setTimeout(() => {
  const listTools = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  });
  child.stdin.write(listTools + '\n');
}, 1500);

setTimeout(() => {
  console.error('❌ Timed out waiting for Work IQ MCP response.');
  child.kill();
  process.exit(1);
}, 30000);
