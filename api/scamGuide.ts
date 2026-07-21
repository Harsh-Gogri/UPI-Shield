import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

interface ScamGuide {
  title: string;
  explanation: string;
  howItWorks: string[];
  warningSigns: string[];
  whatToDo: string[];
  sources?: string[];
}

const SCAM_GUIDE_SYSTEM_PROMPT = `
You are an expert in UPI payments, digital fraud, and cybersecurity.

Your job is to educate Indian users about UPI scams in a simple, accurate, and actionable way.

Rules:
- Return ONLY valid JSON matching the provided schema.
- Never include markdown, code fences, or extra text.
- Do not invent scams or security advice.
- If the user's query is ambiguous, answer using the most common interpretation.
- Explain concepts in language understandable by a non-technical user.
- Avoid jargon whenever possible.
- Keep explanations concise but informative.

Content Guidelines:
- title: Short and specific (maximum 8 words).
- explanation: 2–4 sentences explaining the scam or security concept.
- howItWorks: 4–6 chronological bullet points describing how the fraud happens.
- warningSigns: 4–6 practical warning signs.
- whatToDo: 5–7 actionable safety tips users can follow immediately.

Prioritize guidance published by RBI, NPCI, banks, and established cybersecurity best practices.

Do not exaggerate risks or create unnecessary fear.
`;

const buildScamGuidePrompt = (query: string) => `
Application:
This is a UPI fraud awareness application for Indian users.

User Query:
${query}

Task:
Educate the user about this UPI scam or security topic.

Instructions:
- Assume the user has no prior knowledge of UPI fraud.
- If the query refers to a known UPI scam, explain that scam.
- If the query refers to a UPI security concept, explain the concept.
- If the query is ambiguous, answer using the most common interpretation.
- Focus only on scams relevant to UPI payments and digital banking in India.
- Explain using simple, practical language.
- Do not invent facts.
- Prioritize RBI, NPCI, and bank security guidance.

Response Quality Requirements:
- Provide enough detail that the user does not need another source.
- Avoid repeating information across sections.
- Make every bullet unique and actionable.
- Use concrete examples where appropriate.

Return JSON only.
`;

enum SchemaType {
  OBJECT = "OBJECT",
  STRING = "STRING",
  ARRAY = "ARRAY",
  NUMBER = "NUMBER",
}

const scamGuideSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "A short, descriptive title for the scam or security topic. Maximum 8 words.",
    },
    explanation: {
      type: SchemaType.STRING,
      description: "A simple explanation of the scam in 2–4 sentences, written for non-technical users.",
    },
    howItWorks: {
      type: SchemaType.ARRAY,
      description: "A chronological list of 4–6 steps explaining exactly how scammers execute this fraud.",
      items: {
        type: SchemaType.STRING,
      },
    },
    warningSigns: {
      type: SchemaType.ARRAY,
      description: "A list of 4–6 practical warning signs that indicate the user may be targeted by this scam.",
      items: {
        type: SchemaType.STRING,
      },
    },
    whatToDo: {
      type: SchemaType.ARRAY,
      description: "A list of 5–7 actionable safety tips users should immediately follow to avoid or respond to this scam.",
      items: {
        type: SchemaType.STRING,
      },
    },
  },
  required: ["title", "explanation", "howItWorks", "warningSigns", "whatToDo"],
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
