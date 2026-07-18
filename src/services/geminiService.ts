import { GoogleGenAI, Type } from "@google/genai";
import { SCAM_GUIDE_SYSTEM_PROMPT, RISK_ANALYSIS_SYSTEM_PROMPT, buildScamGuidePrompt, buildRiskAnalysisPrompt } from "../prompts/geminiPrompts";
import { scamGuideSchema, riskAnalysisSchema } from "../schemas/geminiSchemas";
import type { ScamGuide, RiskAnalysis } from "../types/gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TEXT_MODEL = "gemini-3.1-flash-lite";
const IMAGE_MODEL = "gemini-3.1-flash-image";

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
        continue;
      }
    }
  }

  throw lastError;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLatestScamInfo(query: string): Promise<ScamGuide> {
  try {
    const data = await generateJson<ScamGuide>(buildScamGuidePrompt(query), SCAM_GUIDE_SYSTEM_PROMPT, scamGuideSchema);

    return {
      ...data,
      sources: [],
    };
  } catch (error) {
    console.error("Error fetching scam info:", error);

    return {
      title: "Error",
      explanation: "Could not fetch latest information. Please try again later.",
      howItWorks: [],
      warningSigns: [],
      whatToDo: [],
      sources: [],
    };
  }
}

export async function generateBannerImage(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error("Error generating banner image:", error);
    return null;
  }
}

export async function analyzeRisk(input: string): Promise<RiskAnalysis> {
  try {
    return await generateJson<RiskAnalysis>(buildRiskAnalysisPrompt(input), RISK_ANALYSIS_SYSTEM_PROMPT, riskAnalysisSchema);
  } catch (error) {
    console.error("Error analyzing risk:", error);

    return {
      classification: "Manual Verification Required",
      riskLevel: "Medium",
      riskScore: 50,
      signals: ["AI analysis failed"],
      explanation: "We could not complete the automated fraud analysis at this time.",
      recommendation: "Verify the recipient before completing any UPI transaction.",
    };
  }
}
