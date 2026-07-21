import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { RISK_ANALYSIS_SYSTEM_PROMPT, buildRiskAnalysisPrompt } from "../src/prompts/geminiPrompts";
import { riskAnalysisSchema } from "../src/schemas/geminiSchemas";
import type { RiskAnalysis } from "../src/types/gemini";

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

  const { input } = req.body || {};

  if (!input) {
    return res.status(400).json({ error: "Missing input" });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const result = await generateJson<RiskAnalysis>(
      ai,
      buildRiskAnalysisPrompt(input),
      RISK_ANALYSIS_SYSTEM_PROMPT,
      riskAnalysisSchema
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in analyzeRisk serverless function:", error);

    return res.status(200).json({
      classification: "Manual Verification Required",
      riskLevel: "Medium",
      riskScore: 50,
      signals: ["AI analysis failed"],
      explanation: "We could not complete the automated fraud analysis at this time.",
      recommendation: "Verify the recipient before completing any UPI transaction.",
    });
  }
}
