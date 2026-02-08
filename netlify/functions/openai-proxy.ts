import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface OpenAIRequest {
  model?: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  response_format?: {
    type: string;
  };
  temperature?: number;
  max_tokens?: number;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  try {
    const requestBody: OpenAIRequest = JSON.parse(event.body || "{}");
    
    // Default to gpt-5 if no model specified
    const model = requestBody.model || "gpt-5";
    
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: requestBody.messages,
        response_format: requestBody.response_format,
        temperature: requestBody.temperature ?? 0.7,
        max_tokens: requestBody.max_tokens ?? 4000,
      }),
    });

    const data = await openaiResponse.json();

    // Handle rate limiting
    if (openaiResponse.status === 429) {
      return {
        statusCode: 429,
        body: JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          details: data.error?.message || "Too many requests"
        }),
      };
    }

    // Handle invalid API key
    if (openaiResponse.status === 401) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          error: "Invalid API key",
          details: data.error?.message || "Authentication failed"
        }),
      };
    }

    // Handle other errors
    if (!openaiResponse.ok) {
      console.error("OpenAI API error:", data);
      return {
        statusCode: openaiResponse.status,
        body: JSON.stringify({ 
          error: "OpenAI API error",
          details: data.error?.message || "Unknown error"
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
    };
  }
};

export { handler };
