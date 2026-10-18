// Netlify Serverless Function: Secure Groq AI Handler for DOMI Housing Assistant
// Handles Groq AI completions server-side with validation, rate limiting, and fallback.

// In-memory rate limiting tracker (per function container instance)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 prompts per minute per IP

function isRateLimited(clientIp) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIp) || [];
  
  // Filter out timestamps older than the window
  const activeTimestamps = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(clientIp, activeTimestamps);
    return true;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(clientIp, activeTimestamps);

  // Periodic cleanup if map grows too large
  if (rateLimitMap.size > 2000) {
    for (const [ip, list] of rateLimitMap.entries()) {
      if (!list.some((time) => now - time < RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(ip);
      }
    }
  }

  return false;
}

export default async function handler(request) {
  const json = (body, status = 200, headers = {}) =>
    Response.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
        ...headers,
      },
    });

  // Handle CORS preflight if needed
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Only POST requests are supported." }, 405);
  }

  // 1. Validate Groq Server Environment Secret
  const groqApiKey = (process.env.GROQ_API_KEY || "").trim();
  if (!groqApiKey) {
    return json(
      {
        error: "GROQ_API_KEY is not configured on the server. Please add it to your environment variables.",
      },
      503,
    );
  }

  // 2. Client IP Rate Limiting
  const clientIp =
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("client-ip") ||
    "127.0.0.1";

  if (isRateLimited(clientIp)) {
    return json(
      {
        error: "Rate limit exceeded. Please wait a moment before sending another message to DOMI.",
      },
      429,
      { "Retry-After": "60" },
    );
  }

  // 3. Request Body Validation
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON request body." }, 400);
  }

  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    return json({ error: "Request must include a non-empty 'messages' array." }, 400);
  }

  if (payload.messages.length > 12) {
    return json({ error: "Conversation history exceeds the maximum allowed length (12 messages)." }, 400);
  }

  const validRoles = new Set(["system", "user", "assistant"]);
  const sanitizedMessages = [];

  for (const msg of payload.messages) {
    if (!msg || typeof msg !== "object") {
      return json({ error: "Each message must be a valid object." }, 400);
    }
    const role = String(msg.role || "").toLowerCase();
    if (!validRoles.has(role)) {
      return json({ error: `Invalid message role: '${role}'. Allowed: system, user, assistant.` }, 400);
    }
    const content = typeof msg.content === "string" ? msg.content.trim() : "";
    if (!content) {
      return json({ error: "Message content cannot be empty." }, 400);
    }
    if (content.length > 2500) {
      return json({ error: "Message content exceeds maximum allowed length of 2,500 characters." }, 400);
    }
    sanitizedMessages.push({ role, content });
  }

  // 4. Dispatch to Groq API with automatic fallback
  // Primary: qwen/qwen3.8-27b (Free fast open model requested by user), Fallback: openai/gpt-oss-20b
  const modelsToTry = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: sanitizedMessages,
          temperature: 0.6,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(15000), // 15-second timeout
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "";
        return json({
          reply,
          model,
          choices: data.choices || [],
        });
      }

      const status = response.status;
      const rawErrorText = await response.text();
      lastError = `Groq status ${status}`;

      // If unauthorized, stop immediately (bad key)
      if (status === 401) {
        return json({ error: "Invalid GROQ_API_KEY. Please verify your API key." }, 401);
      }
      
      // If rate limited or service unavailable, continue to next model
      console.warn(`[DOMI Server] Model ${model} returned ${status}: ${rawErrorText.slice(0, 150)}`);
    } catch (err) {
      lastError = err.message;
      console.warn(`[DOMI Server] Attempt with ${model} failed:`, err.message);
    }
  }

  return json(
    {
      error: "Groq AI service is temporarily unavailable. Please try again in a few seconds.",
      detail: lastError,
    },
    502,
  );
}
