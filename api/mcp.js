// Vercel serverless proxy for MCP — forwards requests server-side to avoid CORS
export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const MCP_URL = 'https://mcp.lilypad.co.in/mcp';
    const API_KEY = 'N_r1ettwQ045LOV6eAPhFzdKofpOWd4MfXPXbukS1-Y';

    // Build headers for MCP server
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'X-API-Key': API_KEY,
    };

    // Forward session ID if present
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }

    // Forward the request to MCP server
    const mcpResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    // Get response as text (could be JSON or SSE)
    const responseText = await mcpResponse.text();
    const contentType = mcpResponse.headers.get('content-type') || '';
    const mcpSessionId = mcpResponse.headers.get('mcp-session-id');

    // Set CORS + forwarded headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    if (mcpSessionId) {
      res.setHeader('Mcp-Session-Id', mcpSessionId);
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    }

    return res.status(mcpResponse.status).send(responseText);
  } catch (error) {
    console.error('MCP proxy error:', error);
    return res.status(502).json({ error: 'Failed to reach MCP server' });
  }
}
