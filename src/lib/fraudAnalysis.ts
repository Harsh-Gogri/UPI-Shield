export type RiskLevel = 'Low' | 'Medium' | 'High' | null;

export interface AnalysisResult {
  classification: string;
  riskLevel: RiskLevel;
  riskScore: number;
  signals: string[];
  explanation: string;
  recommendation: string;
  upiId?: string;
  merchantName?: string;
  deepScanResult?: string;
  isDeepScanning?: boolean;
}

export function performLocalAnalysis(input: string): Omit<AnalysisResult, 'explanation' | 'recommendation'> {
  const signals: string[] = [];
  let score = 0;

  // 1. UPI VPA format validation
  const vpaRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const isValidVpa = vpaRegex.test(input);
  if (isValidVpa) {
    signals.push("Valid UPI ID format");
  } else {
    signals.push("Invalid or non-standard UPI ID format");
    score += 30;
  }

  // 2. Username structure analysis & 6. Merchant-style naming patterns
  const [username] = input.split('@');
  
  const merchantKeywords = ['pay', 'bill', 'store', 'shop', 'care', 'help', 'support', 'service', 'official'];
  const isMerchantStyle = merchantKeywords.some(k => username?.toLowerCase().includes(k));
  if (isMerchantStyle) {
    signals.push("Merchant-style naming pattern");
  }

  // 3. Suspicious scam keywords
  const scamKeywords = ['refund', 'reward', 'cashback', 'claim', 'verify', 'bank-update', 'customer-care', 'helpdesk'];
  const detectedScamKeywords = scamKeywords.filter(k => input.toLowerCase().includes(k));
  if (detectedScamKeywords.length > 0) {
    signals.push(`Contains suspicious keywords: ${detectedScamKeywords.join(', ')}`);
    score += 40 * detectedScamKeywords.length;
  } else {
    signals.push("No suspicious keywords detected");
  }

  // 4. Hyphen abuse patterns
  const hyphenCount = (input.match(/-/g) || []).length;
  if (hyphenCount > 2) {
    signals.push("Excessive hyphen usage (potential impersonation)");
    score += 20;
  }

  // 5. Random character patterns
  const hasRandomPattern = /[a-z0-9]{10,}/i.test(username || "");
  if (hasRandomPattern && !isMerchantStyle) {
    signals.push("Random character sequence detected");
    score += 15;
  }

  // Final score normalization
  const finalScore = Math.min(Math.max(score, 0), 100);
  
  let riskLevel: RiskLevel = 'Low';
  if (finalScore > 70) riskLevel = 'High';
  else if (finalScore > 30) riskLevel = 'Medium';

  let classification = "Likely legitimate VPA";
  if (riskLevel === 'High') classification = "High Risk Identifier";
  else if (riskLevel === 'Medium') classification = "Suspicious Identifier";

  return {
    classification,
    signals,
    riskScore: finalScore,
    riskLevel
  };
}
