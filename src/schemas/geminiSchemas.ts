import { Type } from "@google/genai";

export const scamGuideSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, descriptive title for the scam or security topic. Maximum 8 words.",
    },
    explanation: {
      type: Type.STRING,
      description: "A simple explanation of the scam in 2–4 sentences, written for non-technical users.",
    },
    howItWorks: {
      type: Type.ARRAY,
      description: "A chronological list of 4–6 steps explaining exactly how scammers execute this fraud.",
      items: {
        type: Type.STRING,
      },
    },
    warningSigns: {
      type: Type.ARRAY,
      description: "A list of 4–6 practical warning signs that indicate the user may be targeted by this scam.",
      items: {
        type: Type.STRING,
      },
    },
    whatToDo: {
      type: Type.ARRAY,
      description: "A list of 5–7 actionable safety tips users should immediately follow to avoid or respond to this scam.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["title", "explanation", "howItWorks", "warningSigns", "whatToDo"],
};

export const riskAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    classification: {
      type: Type.STRING,
      description: "A concise classification of the input, such as Legitimate Payment Request, Suspicious Link, QR Code Scam, Fake Customer Support, Phishing Message, etc.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "Overall fraud risk level determined from the input.",
    },
    riskScore: {
      type: Type.NUMBER,
      description: "An integer from 0 to 100 representing the estimated fraud risk, where 0 is completely safe and 100 is extremely dangerous.",
    },
    signals: {
      type: Type.ARRAY,
      description: "A list of 3–6 specific reasons or indicators that contributed to the assigned risk score.",
      items: {
        type: Type.STRING,
      },
    },
    explanation: {
      type: Type.STRING,
      description: "A concise explanation describing why the input received this risk assessment in language understandable by everyday users.",
    },
    recommendation: {
      type: Type.STRING,
      description: "The single most important action the user should take next to stay safe.",
    },
  },
  required: ["classification", "riskLevel", "riskScore", "signals", "explanation", "recommendation"],
};
