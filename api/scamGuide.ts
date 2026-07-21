import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { SCAM_GUIDE_SYSTEM_PROMPT, buildScamGuidePrompt } from "../src/prompts/geminiPrompts";
import { scamGuideSchema } from "../src/schemas/geminiSchemas";
import type { ScamGuide } from "../src/types/gemini";

const TEXT_MODEL = "gemini-3.1-flash-lite";

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJson<T>(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>
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
          responseSchema: responseSchema as any,
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      const text = response.text;
      try {
        return JSON.parse(text) as T;
      } catch {
        console.error("Failed to parse Gemini JSON:", text);
        throw new Error("Gemini returned invalid JSON.");
      }
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
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body || {};

  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const data = await generateJson<Omit<ScamGuide, "sources">>(
      ai,
      buildScamGuidePrompt(query),
      SCAM_GUIDE_SYSTEM_PROMPT,
      scamGuideSchema
    );

    const result: ScamGuide = {
      ...data,
      sources: [],
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in scamGuide serverless function:", error);

    const fallback: ScamGuide = {
      title: "Error",
      explanation: "Could not fetch latest information. Please try again later.",
      howItWorks: [],
      warningSigns: [],
      whatToDo: [],
      sources: [],
    };

    return res.status(200).json(fallback);
  }
}
