// Use Vite proxy in dev to avoid CORS, direct URL in production
const MCP_ENDPOINT = import.meta.env.DEV ? '/mcp' : 'https://mcp.lilypad.co.in/mcp';
const API_KEY = 'N_r1ettwQ045LOV6eAPhFzdKofpOWd4MfXPXbukS1-Y';

let sessionId = null;
let requestId = 0;
let initialized = false;

function nextId() { return ++requestId; }

function baseHeaders() {
  const h = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'X-API-Key': API_KEY,
  };
  if (sessionId) h['Mcp-Session-Id'] = sessionId;
  return h;
}

async function mcpRequest(method, params = {}) {
  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: nextId() }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MCP HTTP ${response.status}: ${errText.substring(0, 200)}`);
  }
  const sid = response.headers.get('mcp-session-id');
  if (sid) sessionId = sid;
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('text/event-stream')) return await parseSSE(response);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'MCP request failed');
  return data.result;
}

async function parseSSE(response) {
  const text = await response.text();
  let last = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      try {
        const d = JSON.parse(line.slice(6).trim());
        if (d.error) throw new Error(d.error.message || 'MCP error');
        last = d.result || d;
      } catch (e) { if (e.message.includes('MCP error')) throw e; }
    }
  }
  return last;
}

async function ensureInitialized() {
  if (initialized) return;
  await mcpRequest('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'lilypad-chatbot', version: '1.0.0' },
  });
  await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  initialized = true;
}

async function callTool(name, args = {}) {
  await ensureInitialized();
  return await mcpRequest('tools/call', { name, arguments: args });
}


/* ═══════════════════════════════════════════════════
   INTENT DETECTION
   ═══════════════════════════════════════════════════ */

const BRANDS = [
  'ola', 'ather', 'bajaj', 'tvs', 'hero', 'vida', 'bgauss', 'revolt',
  'ultraviolette', 'oben', 'river', 'ampere', 'vegh', 'emotorad',
  'okaya', 'kinetic', 'chetak', 'iqube',
];

const CITIES = [
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad',
  'pune', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'noida',
  'gurgaon', 'gurugram', 'chandigarh', 'kochi', 'indore', 'bhopal',
  'coimbatore', 'nagpur', 'surat', 'vadodara', 'patna', 'goa',
  'mysore', 'mangalore', 'vizag', 'bhubaneswar',
];

const GREETING_RE = /^(hi+|hey+|hello+|hola|yo+|sup|what'?s\s*up|good\s*(morning|afternoon|evening|night)|thanks?|thank\s*you|ok+|okay|bye|cool|nice|great|awesome)\s*[!.?]*$/i;
const HELP_RE = /^(help|what can you|what do you|how do i|how does this)/i;

function detectIntent(q) {
  const ql = q.toLowerCase().trim();

  // Greetings
  if (GREETING_RE.test(ql)) return { intent: 'greeting' };
  if (HELP_RE.test(ql)) return { intent: 'help' };

  // Dealers
  if (/\b(dealer|showroom|store|shop|where.*(buy|purchase|get)|near\s*me|locate|find.*dealer)\b/.test(ql)) {
    return {
      intent: 'dealers',
      city: CITIES.find(c => ql.includes(c)) || null,
      state: null,
      brand: BRANDS.find(b => ql.includes(b)) || null,
    };
  }

  // Compare — needs 2+ brands or explicit compare keyword
  if (/\b(compare|vs|versus|difference between|which.*better)\b/.test(ql)) {
    const found = BRANDS.filter(b => ql.includes(b));
    if (found.length >= 2) return { intent: 'compare', brands: found };
    // Fall through to ask_question which handles comparison via RAG
  }

  // Brands list
  if (/\b(all brands|list.*brands|which brands|available brands|what brands|brands available)\b/.test(ql)) {
    return { intent: 'brands' };
  }

  // Categories list
  if (/\b(all categories|list.*categories|what types|what kind|vehicle types|categories available|available categories)\b/.test(ql)) {
    return { intent: 'categories' };
  }

  // Search — specific product/filter queries
  if (/\b(search|find|show|list|cheapest|expensive|budget|under|below|above|price)\b/.test(ql)) {
    return {
      intent: 'search',
      brand: BRANDS.find(b => ql.includes(b)) || null,
      category: detectCategory(ql),
    };
  }

  // Default — ask_question handles everything else
  return { intent: 'ask' };
}

function detectCategory(q) {
  if (/kick\s*scooter/.test(q)) return 'Kickscooter';
  if (/(high.speed|fast)/.test(q) && /scooter/.test(q)) return 'High Speed Scooter';
  if (/(low.speed|slow)/.test(q) && /scooter/.test(q)) return 'Low-Speed Scooter';
  if (/\b(scooter|scooty)\b/.test(q)) return 'High Speed Scooter';
  if (/\b(bike|motorcycle)\b/.test(q)) return 'Electric Bike';
  if (/\b(cycle|e-cycle|ebike|e-bike|bicycle)\b/.test(q)) return 'E-Cycles';
  if (/\bsegway\b/.test(q)) return 'Segway';
  return null;
}


/* ═══════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════ */

export async function handleUserMessage(userQuery) {
  const q = userQuery.trim();
  const { intent, ...params } = detectIntent(q);

  try {
    switch (intent) {
      case 'greeting':
        return handleGreeting(q);
      case 'help':
        return handleHelp();
      case 'dealers':
        return await handleDealers(params);
      case 'compare':
        return await handleCompare(params, q);
      case 'brands':
        return await handleBrands();
      case 'categories':
        return await handleCategories();
      case 'search':
        return await handleSearch(params, q);
      case 'ask':
      default:
        return await handleAsk(q);
    }
  } catch (err) {
    console.error('MCP error:', err);
    return { answer: "Sorry, I'm having trouble right now. Please try again in a moment.", products: [] };
  }
}


/* ═══════════════════════════════════════════════════
   HANDLERS — each uses the right MCP tool
   ═══════════════════════════════════════════════════ */

// ── Greeting (local, no MCP) ──
function handleGreeting(q) {
  const ql = q.toLowerCase();
  if (/^(hi|hey|hello|hola)/i.test(ql))
    return { answer: "Hey there! 👋 I'm the **Lilypad Assistant**. I can help you find electric vehicles, compare models, check prices, or locate dealers. What would you like to know?", products: [] };
  if (/thank/i.test(ql))
    return { answer: "You're welcome! Let me know if you need anything else. 😊", products: [] };
  if (/bye/i.test(ql))
    return { answer: "Goodbye! Come back anytime. 🛵", products: [] };
  return { answer: "Got it! What else can I help you with?", products: [] };
}

function handleHelp() {
  return { answer: "I'm the **Lilypad EV Assistant**! Try asking:\n\n• \"Best electric scooter under ₹1 lakh\"\n• \"Compare Ather vs Bajaj\"\n• \"Find dealers in Mumbai\"\n• \"Latest EV models\"\n• \"What brands are available?\"", products: [] };
}

// ── Dealers → find_dealers ──
async function handleDealers({ city, state, brand }) {
  const args = {};
  if (city) args.city = city;
  if (state) args.state = state;
  if (brand) args.brand = brand;

  const result = await callTool('find_dealers', args);
  const parsed = parseResult(result);

  // find_dealers returns { dealers, total }
  const dealers = parsed.dealers || [];
  if (dealers.length === 0) {
    // Fallback to ask_question for a helpful response
    return await handleAsk(`Find EV dealers${city ? ' in ' + city : ''}${brand ? ' for ' + brand : ''}`);
  }

  // Format dealer list from MCP data
  let answer = `Found **${dealers.length}** dealer${dealers.length > 1 ? 's' : ''}`;
  if (city) answer += ` in **${city.charAt(0).toUpperCase() + city.slice(1)}**`;
  answer += ':\n\n';
  dealers.slice(0, 10).forEach((d, i) => {
    answer += `**${i + 1}. ${d.name || d.dealer_name || 'Dealer'}**\n`;
    if (d.address) answer += `📍 ${d.address}\n`;
    if (d.city || d.state) answer += `🏙️ ${[d.city, d.state].filter(Boolean).join(', ')}\n`;
    if (d.phone || d.contact) answer += `📞 ${d.phone || d.contact}\n`;
    if (d.brands?.length) answer += `🏷️ ${d.brands.join(', ')}\n`;
    answer += '\n';
  });
  if (dealers.length > 10) answer += `...and ${dealers.length - 10} more.`;

  return { answer, products: [] };
}

// ── Compare → search_products + get_product for full specs ──
async function handleCompare({ brands }, originalQuery) {
  // Search top product from each brand in parallel
  const searches = await Promise.all(
    brands.map(b => callTool('search_products', { query: b, limit: 2 }))
  );

  // Collect top product IDs
  const topProducts = [];
  const allCards = [];
  for (const result of searches) {
    const parsed = parseResult(result);
    const prods = parsed.products || parsed.results || [];
    if (prods[0]?.id) topProducts.push(prods[0]);
    allCards.push(...prods.slice(0, 2));
  }

  if (topProducts.length < 2) {
    return await handleAsk(originalQuery);
  }

  // Fetch full details (specs) for each top product via get_product
  const details = await Promise.all(
    topProducts.map(async (p) => {
      try {
        const detail = await callTool('get_product', { product_id: p.id });
        const dp = parseResult(detail);
        return { ...p, ...dp, specs: dp.specifications || {} };
      } catch {
        return { ...p, specs: {} };
      }
    })
  );

  // Build comparison table from real specs
  const a = details[0];
  const b = details[1];
  const sa = a.specs || {};
  const sb = b.specs || {};

  let answer = `**${a.name}** vs **${b.name}**\n\n`;

  const rows = [
    ['Price', fmt(a.price, '₹'), fmt(b.price, '₹')],
    ['Category', a.category, b.category],
    ['Range', sa.Range, sb.Range],
    ['Top Speed', (sa['top_speed '] || sa.top_speed || '').trim(), (sb['top_speed '] || sb.top_speed || '').trim()],
    ['Battery', sa.battery_capacity, sb.battery_capacity],
    ['Battery Type', sa['Battery Type'], sb['Battery Type']],
    ['Charging Time', sa.charging_time, sb.charging_time],
    ['Motor', sa['Peak Motor Power'], sb['Peak Motor Power']],
    ['Motor Type', sa.motor_type, sb.motor_type],
    ['Weight', sa['Total Weight'] || sa['Kerb Weight'], sb['Total Weight'] || sb['Kerb Weight']],
    ['0-40 km/h', sa['Acceleration (0-40km/h)'], sb['Acceleration (0-40km/h)']],
    ['Ground Clearance', sa['Ground Clearance'], sb['Ground Clearance']],
    ['Front Brake', sa['Front Brake Type'], sb['Front Brake Type']],
    ['Rear Brake', sa['Rear Brake Type'], sb['Rear Brake Type']],
    ['ABS/CBS', sa['ABS/CBS'], sb['ABS/CBS']],
  ].filter(([, va, vb]) => va || vb); // Only rows with at least one value

  if (rows.length > 0) {
    answer += `| Spec | **${a.name}** | **${b.name}** |\n`;
    answer += '|---|---|---|\n';
    rows.forEach(([label, va, vb]) => {
      answer += `| ${label} | ${va || '—'} | ${vb || '—'} |\n`;
    });
  }

  // Add descriptions if available
  if (a.description) answer += `\n**${a.name}:** ${a.description.substring(0, 200)}${a.description.length > 200 ? '...' : ''}`;
  if (b.description) answer += `\n\n**${b.name}:** ${b.description.substring(0, 200)}${b.description.length > 200 ? '...' : ''}`;

  const enriched = await enrichProducts(allCards.slice(0, 6));
  return { answer, products: enriched };
}

function fmt(price, prefix = '') {
  if (!price) return '—';
  return prefix + Number(price).toLocaleString('en-IN');
}

// ── Brands → get_brands ──
async function handleBrands() {
  const result = await callTool('get_brands', {});
  const parsed = parseResult(result);
  const brands = parsed.result || [];

  if (Array.isArray(brands) && brands.length > 0) {
    return {
      answer: `**Available EV Brands on Lilypad (${brands.length}):**\n\n${brands.map(b => `• ${b}`).join('\n')}\n\nAsk me about any brand for details!`,
      products: [],
    };
  }
  return { answer: parsed.answer || 'Could not fetch brands.', products: [] };
}

// ── Categories → get_categories ──
async function handleCategories() {
  const result = await callTool('get_categories', {});
  const parsed = parseResult(result);
  const cats = parsed.result || [];

  if (Array.isArray(cats) && cats.length > 0) {
    return {
      answer: `**EV Categories on Lilypad:**\n\n${cats.map(c => `• ${c}`).join('\n')}\n\nWhich category interests you?`,
      products: [],
    };
  }
  return { answer: parsed.answer || 'Could not fetch categories.', products: [] };
}

// ── Search → search_products + ask_question in parallel ──
async function handleSearch({ brand, category }, originalQuery) {
  const searchArgs = { query: originalQuery, limit: 6 };
  if (brand) searchArgs.brand = brand;
  if (category) searchArgs.category = category;

  // Run both in parallel — search for products + AI answer
  const [searchResult, aiResult] = await Promise.all([
    callTool('search_products', searchArgs),
    callTool('ask_question', { query: originalQuery, include_products: true, use_expert_rag: true }),
  ]);

  const searchParsed = parseResult(searchResult);
  const aiParsed = parseResult(aiResult);

  // Use AI answer, but prefer search products (more targeted)
  const searchProducts = searchParsed.products || searchParsed.results || [];
  const aiProducts = aiParsed.products || [];

  // Merge + deduplicate
  const seen = new Set();
  const merged = [...searchProducts, ...aiProducts].filter(p => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const enriched = await enrichProducts(merged.slice(0, 6));

  return {
    answer: aiParsed.answer || `Found ${enriched.length} results.`,
    products: enriched,
  };
}

// ── Default ask → ask_question ──
async function handleAsk(query) {
  const result = await callTool('ask_question', {
    query,
    include_products: true,
    use_expert_rag: true,
  });

  const parsed = parseResult(result);

  if (!parsed.answer) {
    parsed.answer = "I couldn't find specific information for that. Try asking about electric scooters, bikes, brands, or dealers.";
  }

  if (parsed.products && parsed.products.length > 0) {
    parsed.products = await enrichProducts(parsed.products.slice(0, 6));
  }

  return parsed;
}


/* ═══════════════════════════════════════════════════
   PRODUCT HELPERS
   ═══════════════════════════════════════════════════ */

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price || p.max_price,
    category: p.category,
    image: p.image_url || p.image,
    in_stock: p.in_stock ?? true,
    slug: p.slug || null,
    description: p.description || '',
  };
}

async function enrichProducts(products) {
  return await Promise.all(
    products.map(async (p) => {
      if (p.slug) return normalizeProduct(p);
      if (!p.id) return normalizeProduct(p);
      try {
        const detail = await callTool('get_product', { product_id: p.id });
        const dp = parseResult(detail);
        return normalizeProduct({ ...p, ...dp });
      } catch {
        return normalizeProduct(p);
      }
    })
  );
}


/* ═══════════════════════════════════════════════════
   RESULT PARSING
   ═══════════════════════════════════════════════════ */

function parseResult(result) {
  if (!result) return { answer: null, products: [] };

  if (result.structuredContent) {
    const sc = result.structuredContent;
    return {
      answer: sc.answer || sc.text || sc.comparison || null,
      products: sc.products || sc.results || [],
      dealers: sc.dealers,
      result: sc.result,
      slug: sc.slug, name: sc.name, brand: sc.brand, price: sc.price,
      category: sc.category, image_url: sc.image_url, image: sc.image_url || sc.image,
      in_stock: sc.in_stock, description: sc.description, specifications: sc.specifications,
      id: sc.id, text: sc.text, comparison: sc.comparison,
    };
  }

  if (result.content && Array.isArray(result.content)) {
    const textContent = result.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');
    try {
      const p = JSON.parse(textContent);
      return {
        answer: p.answer || p.text || p.comparison || null,
        products: p.products || p.results || [],
        dealers: p.dealers, result: p.result,
        slug: p.slug, name: p.name, brand: p.brand, price: p.price,
        category: p.category, image_url: p.image_url, image: p.image_url || p.image,
        in_stock: p.in_stock, description: p.description, specifications: p.specifications,
        id: p.id, text: p.text, comparison: p.comparison,
      };
    } catch {
      return { answer: textContent, products: [] };
    }
  }

  if (typeof result === 'string') return { answer: result, products: [] };
  return { answer: JSON.stringify(result, null, 2), products: [] };
}
