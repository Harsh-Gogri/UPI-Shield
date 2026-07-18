import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";
import { RISK_ANALYSIS_SYSTEM_PROMPT, buildRiskAnalysisPrompt } from "../src/prompts/geminiPrompts";
import { riskAnalysisSchema } from "../src/schemas/geminiSchemas";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const TEXT_MODEL = "gemini-3.1-flash-lite";

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJson<T>(
  prompt: string,
  systemInstruction: string,
  responseSchema: {
    type: Type;
    properties: Record<string, unknown>;
    required?: string[];
  },
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      return JSON.parse(response.text) as T;
    } catch (error) {
      lastError = error;

      if (attempt === 1) {
        await delay(1000);
      }
    }
  }

  throw lastError;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { input } = req.body;

  if (!input) {
    return res.status(400).json({
      error: "Missing input",
    });
  }

  res.status(200).json({
    message: "Request received",
    input,
  });
}
