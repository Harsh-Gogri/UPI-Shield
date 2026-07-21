export interface ScamGuide {
  title: string;
  explanation: string;
  howItWorks: string[];
  warningSigns: string[];
  whatToDo: string[];
  sources?: string[];
}

export interface RiskAnalysis {
  classification: string;
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
  signals: string[];
  explanation: string;
  recommendation: string;
}
