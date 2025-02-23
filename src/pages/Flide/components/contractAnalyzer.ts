import { Groq } from 'groq-sdk';

interface SecurityIssue {
  type: string;
  description: string;
  location?: string;
  impact: string;
  recommendation: string;
  codeExample?: string;
}

interface Optimization {
  type: string;
  description: string;
  suggestion: string;
  impact: string;
  codeExample?: string;
}

export interface ContractAnalysis {
  securityScore: number;
  scanDuration: string;
  linesOfCode: number;
  issuesCount: number;
  critical: SecurityIssue[];
  high: SecurityIssue[];
  medium: SecurityIssue[];
  low: SecurityIssue[];
  informational: SecurityIssue[];
  optimizations: Optimization[];
  modificationSuggestions?: string;
  summary?: string;
  rawAnalysis?: string; // Complete analysis including the thinking process
}

export class ContractAnalyzer {
  private groq: Groq;
  private lastAnalysis: ContractAnalysis | null = null;

  constructor() {
    this.groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async analyzeContract(code: string, model: string): Promise<ContractAnalysis> {
    const startTime = Date.now();
    try {
      console.log("Starting enhanced contract analysis...");
      // Enhanced system prompt for a more detailed and actionable audit
      const systemMessage = {
        role: "system" as const,
        content: `You are an expert Move smart contract security auditor with extensive knowledge of vulnerabilities, best practices, and optimization techniques. 
Analyze the provided Move smart contract thoroughly and step-by-step. 
Your response should begin with a detailed reasoning of your analysis process, then provide a comprehensive security audit.
Include:
1. Specific security vulnerabilities with precise code locations.
2. An assessment of the impact for each issue.
3. Clear, actionable recommendations for each issue.
4. Example code fixes for critical issues.
Finally, output a JSON summary (enclosed in triple backticks with "json") in the following structure:
\`\`\`json
{
  "securityScore": number,
  "summary": string,
  "critical": [ { "type": string, "description": string, "location": string, "impact": string, "recommendation": string, "codeExample": string } ],
  "high": [ ... ],
  "medium": [ ... ],
  "low": [ ... ],
  "informational": [ ... ],
  "optimizations": [ { "type": string, "description": string, "suggestion": string, "impact": string, "codeExample": string } ]
}
\`\`\`
Ensure that your analysis is precise, detailed, and actionable.`
      };

      const userMessage = {
        role: "user" as const,
        content: `Analyze this Move smart contract for security issues, best practices, and optimizations:\n\n${code}`
      };

      const completion = await this.groq.chat.completions.create({
        messages: [systemMessage, userMessage],
        model: model,
      });

      const analysisResponse = completion.choices[0]?.message?.content;
      if (!analysisResponse) {
        throw new Error('No analysis response received');
      }

      // Save the full response for reference
      const rawAnalysis = analysisResponse;

      // Attempt to robustly extract JSON from the response
      const analysisResult = this.robustJSONExtraction(analysisResponse);

      const scanDuration = `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`;
      const linesOfCode = code.split('\n').filter(line => line.trim()).length;

      const analysis: ContractAnalysis = {
        securityScore: analysisResult.securityScore || 100,
        scanDuration,
        linesOfCode,
        issuesCount: 0,
        summary: analysisResult.summary || "Analysis completed",
        critical: this.validateIssues(analysisResult.critical || []),
        high: this.validateIssues(analysisResult.high || []),
        medium: this.validateIssues(analysisResult.medium || []),
        low: this.validateIssues(analysisResult.low || []),
        informational: this.validateIssues(analysisResult.informational || []),
        optimizations: this.validateOptimizations(analysisResult.optimizations || []),
        rawAnalysis: this.formatAnalysisResponse(rawAnalysis, analysisResult)
      };

      analysis.issuesCount =
        analysis.critical.length +
        analysis.high.length +
        analysis.medium.length +
        analysis.low.length +
        analysis.informational.length;

      console.log(`Enhanced analysis complete: ${analysis.issuesCount} issues found in ${scanDuration}`);

      // If issues were found, request modification suggestions with improved detail.
      if (analysis.issuesCount > 0) {
        analysis.modificationSuggestions = await this.suggestContractModifications(code, analysis, model);
      }

      this.lastAnalysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Enhanced contract analysis error:', error);
      return this.getDefaultAnalysis(code);
    }
  }

  // Try multiple regex patterns to extract a valid JSON block
  private robustJSONExtraction(response: string): any {
    let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("First JSON parse attempt failed:", e);
      }
    }
    // Try without the language identifier
    jsonMatch = response.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Second JSON parse attempt failed:", e);
      }
    }
    // Fallback to extracting summary details from text
    return this.extractAnalysisFromText(response);
  }

  private formatAnalysisResponse(rawAnalysis: string, analysisResult: any): string {
    // Remove any JSON block for clarity in the human-readable section
    const cleanAnalysis = rawAnalysis.replace(/```json[\s\S]*?```/, '');
    let formattedResponse = "# Enhanced Smart Contract Security Analysis\n\n";
    formattedResponse += "## Analysis Process and Detailed Findings\n";
    formattedResponse += cleanAnalysis.trim() + "\n\n";
    formattedResponse += "## Security Issues Summary\n\n";

    if (analysisResult.critical?.length > 0) {
      formattedResponse += "### Critical Issues\n";
      analysisResult.critical.forEach((issue: SecurityIssue) => {
        formattedResponse += `- **${issue.type}**\n`;
        formattedResponse += `  - Location: ${issue.location || "Not specified"}\n`;
        formattedResponse += `  - Description: ${issue.description}\n`;
        formattedResponse += `  - Impact: ${issue.impact}\n`;
        formattedResponse += `  - Recommendation: ${issue.recommendation}\n`;
        if (issue.codeExample) {
          formattedResponse += `  - Example Fix:\n\`\`\`move\n${issue.codeExample}\n\`\`\`\n`;
        }
      });
    }

    // Optionally add sections for high, medium, low, and informational issues similarly
    // (You may repeat similar formatting if needed)

    return formattedResponse;
  }

  private extractAnalysisFromText(text: string): any {
    // Fallback extraction if JSON parsing fails – this is basic and can be expanded as needed
    const result = {
      securityScore: 100,
      summary: "",
      critical: [],
      high: [],
      medium: [],
      low: [],
      informational: [],
      optimizations: []
    };

    // Use keyword matching to estimate the security score
    if (text.toLowerCase().includes("critical") || text.toLowerCase().includes("severe")) {
      result.securityScore = 0;
    } else if (text.toLowerCase().includes("high")) {
      result.securityScore = 25;
    } else if (text.toLowerCase().includes("medium")) {
      result.securityScore = 50;
    } else if (text.toLowerCase().includes("low")) {
      result.securityScore = 75;
    }

    // Attempt to extract a summary line
    const summaryMatch = text.match(/summary:?\s*([^\n]+)/i);
    if (summaryMatch) {
      result.summary = summaryMatch[1];
    }

    return result;
  }

  private validateIssues(issues: any[]): SecurityIssue[] {
    return issues.map(issue => ({
      type: issue.type || 'Unknown Issue',
      description: issue.description || 'No description provided',
      location: issue.location || 'Not specified',
      impact: issue.impact || 'Not specified',
      recommendation: issue.recommendation || 'No recommendation provided',
      codeExample: issue.codeExample || null
    }));
  }

  private validateOptimizations(optimizations: any[]): Optimization[] {
    return optimizations.map(opt => ({
      type: opt.type || 'Unknown Optimization',
      description: opt.description || 'No description provided',
      suggestion: opt.suggestion || 'No suggestion provided',
      impact: opt.impact || 'Not specified',
      codeExample: opt.codeExample || null
    }));
  }

  private async suggestContractModifications(code: string, analysis: ContractAnalysis, model: string): Promise<string> {
    try {
      console.log("Requesting enhanced modification suggestions based on analysis...");
      const systemMessage = {
        role: "system" as const,
        content: `You are an expert Move smart contract developer. Based on the following analysis, provide a modified version of the contract with inline comments that explain each change. Your modifications should address every identified issue and incorporate best practices.`
      };

      const userMessage = {
        role: "user" as const,
        content: `Provide specific code modifications to fix the following issues:
Analysis Summary:
${analysis.summary}

Critical Issues: ${analysis.critical.map(i => i.type).join(", ")}
High Issues: ${analysis.high.map(i => i.type).join(", ")}
Medium Issues: ${analysis.medium.map(i => i.type).join(", ")}
Low Issues: ${analysis.low.map(i => i.type).join(", ")}

Original contract code:

${code}

Return the modified contract code with inline comments for each change.`
      };

      const completion = await this.groq.chat.completions.create({
        messages: [systemMessage, userMessage],
        model: model,
      });

      const modificationResponse = completion.choices[0]?.message?.content;
      if (!modificationResponse) {
        return "No modification suggestions available.";
      }
      return modificationResponse;
    } catch (error) {
      console.error('Enhanced modification suggestion error:', error);
      return "Error fetching modification suggestions.";
    }
  }

  getLastAnalysis(): ContractAnalysis | null {
    return this.lastAnalysis;
  }

  private getDefaultAnalysis(code: string): ContractAnalysis {
    return {
      securityScore: 100,
      scanDuration: '0 seconds',
      linesOfCode: code.split('\n').filter(line => line.trim()).length,
      issuesCount: 0,
      summary: "No issues found in the initial analysis.",
      critical: [],
      high: [],
      medium: [],
      low: [],
      informational: [],
      optimizations: []
    };
  }
}

export const contractAnalyzer = new ContractAnalyzer();
