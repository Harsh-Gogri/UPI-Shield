import type { ScamGuide, RiskAnalysis } from "../types/gemini";

export async function getLatestScamInfo(query: string): Promise<ScamGuide> {
  try {
    const response = await fetch("/api/scamGuide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch scam info");
    }

    return await response.json();
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

export async function generateBannerImage(prompt: string): Promise<string | null> {
  try {
    const response = await fetch("/api/bannerImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate banner image");
    }

    const data = await response.json();
    return data.image || null;
  } catch (error) {
    console.error("Error generating banner image:", error);
    return null;
  }
}

export async function analyzeRisk(input: string): Promise<RiskAnalysis> {
  try {
    const response = await fetch("/api/analyzeRisk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze risk");
    }

    return await response.json();
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
