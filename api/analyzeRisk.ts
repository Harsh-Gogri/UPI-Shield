import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

interface RiskAnalysis {
  classification: string;
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
  signals: string[];
  explanation: string;
  recommendation: string;
}

const RISK_ANALYSIS_SYSTEM_PROMPT = `
You are an expert UPI fraud detection assistant.

Your task is to analyze UPI IDs and UPI QR code data for possible fraud.

Inputs may include:
- UPI IDs entered manually by users.
- Raw UPI QR payloads.
- Merchant names extracted from QR codes.
- Payment information contained inside UPI QR codes.

Rules:
- Return ONLY valid JSON matching the provided schema.
- Never include markdown, code fences, or additional text.
- Base your assessment ONLY on the information provided.
- Never invent facts or assume missing information.
- If there is insufficient information, explain the limitation while giving the safest reasonable recommendation.
- Keep explanations concise, objective, and easy for non-technical users.

Evaluate the following:
- Suspicious UPI handle patterns.
- Fake or impersonated merchant names.
- QR codes requesting unexpected payments.
- Prefilled payment amounts that may be suspicious.
- Collect request indicators.
- Suspicious UPI providers or handles.
- Known scam naming patterns.
- Any indicators commonly associated with UPI fraud.

Risk Assessment Guidelines:
- Low: No meaningful fraud indicators detected.
- Medium: Some suspicious indicators exist, but evidence is inconclusive.
- High: Multiple strong fraud indicators exist or the QR/UPI ID closely matches known scam patterns.

Recommendations:
- Give one clear, practical recommendation.
- Prioritize user safety.
- Avoid unnecessary alarm.
`;

const buildRiskAnalysisPrompt = (input: string) => `
Application:
This is a UPI fraud detection application.

Input:
${input}

Task:
Analyze the supplied UPI ID or UPI QR code for possible fraud.

Instructions:
- Determine whether the UPI ID or QR appears legitimate or suspicious.
- Base your assessment ONLY on the supplied input.
- Never invent missing information.
- If there is insufficient information, clearly state that while providing the safest recommendation.
- Look for indicators including:
  - Fake UPI IDs
  - Suspicious handle names
  - Impersonation of banks or brands
  - Fake merchant identities
  - Suspicious QR code payment requests
  - Prefilled payment amounts
  - Collect request indicators
  - Known UPI scam patterns

Risk Scoring Guidelines:
- 0–20: Very likely safe.
- 21–50: Minor concerns.
- 51–80: Multiple suspicious indicators.
- 81–100: Strong evidence of fraud.

Response Quality Requirements:
- Explain why the risk score was assigned.
- Keep explanations concise and understandable.
- List only the most relevant indicators.
- Provide one clear recommendation the user can immediately follow.

Example:

Input:
paytm-helpdesk@ibl

Expected Analysis:
- classification: Suspicious UPI ID
- riskLevel: Medium
- riskScore: 68
- signals:
  - Uses a brand name
  - Generic support-style handle
  - Cannot verify merchant identity
- explanation: The UPI ID uses a well-known brand name combined with a support-related identifier. While this alone does not prove fraud, users should verify that the UPI ID belongs to the official merchant before making a payment.
- recommendation: Verify the UPI ID through the merchant's official website or customer support before proceeding.

Return JSON only.
`;

enum SchemaType {
  OBJECT = "OBJECT",
  STRING = "STRING",
  ARRAY = "ARRAY",
  NUMBER = "NUMBER",
}

const riskAnalysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    classification: {
      type: SchemaType.STRING,
      description: "A concise classification of the input, such as Legitimate Payment Request, Suspicious Link, QR Code Scam, Fake Customer Support, Phishing Message, etc.",
    },
    riskLevel: {
      type: SchemaType.STRING,
      enum: ["Low", "Medium", "High"],
      description: "Overall fraud risk level determined from the input.",
    },
    riskScore: {
      type: SchemaType.NUMBER,
      description: "An integer from 0 to 100 representing the estimated fraud risk, where 0 is completely safe and 100 is extremely dangerous.",
    },
    signals: {
      type: SchemaType.ARRAY,
      description: "A list of 3–6 specific reasons or indicators that contributed to the assigned risk score.",
      items: {
        type: SchemaType.STRING,
      },
    },
    explanation: {
      type: SchemaType.STRING,
      description: "A concise explanation describing why the input received this risk assessment in language understandable by everyday users.",
    },
    recommendation: {
      type: SchemaType.STRING,
      description: "The single most important action the user should take next to stay safe.",
    },
  },
  required: ["classification", "riskLevel", "riskScore", "signals", "explanation", "recommendation"],
};

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
