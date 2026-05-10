import type { BusinessContext, OpportunityReport } from "./types";
import { FASHION_OPPORTUNITY_SYSTEM_PROMPT } from "./systemPrompt";
import { extractJsonObject } from "./parseJsonResponse";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

function getModel(): string {
  return import.meta.env.VITE_OPENAI_MODEL?.trim() || "gpt-4o";
}

export async function analyzeGarmentOpportunity(
  imageBase64: string,
  imageMime: string,
  businessContext: BusinessContext
): Promise<OpportunityReport> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Missing VITE_OPENAI_API_KEY. Add it to .env.local (see .env.example)."
    );
  }

  const model = getModel();
  const userText = `Business context (JSON):\n${JSON.stringify(businessContext, null, 2)}\n\nAnalyze the attached garment image. Return ONLY one JSON object matching the schema from your instructions. No markdown, no prose outside JSON.`;

  const body = {
    model,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system" as const, content: FASHION_OPPORTUNITY_SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userText },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:${imageMime};base64,${imageBase64}`,
              detail: "high" as const,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ChatCompletionResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI request failed (${res.status})`);
  }

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from model");

  const jsonStr = extractJsonObject(raw);
  return JSON.parse(jsonStr) as OpportunityReport;
}

export function fileToBase64(file: File): Promise<{
  base64: string;
  mime: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      const mime = file.type || "image/jpeg";
      resolve({ base64, mime });
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
