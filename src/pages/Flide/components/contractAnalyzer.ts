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
  rawAnalysis?: string; // Store complete analysis including thinking process
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
      console.log("Starting contract analysis...");
      const systemMessage = {
        role: "system" as const,
        content: `You are an expert Move smart contract security auditor. Analyze the provided contract thoroughly.
First, share your thinking process as you analyze the contract.
Then, provide a detailed analysis including:
1. Security vulnerabilities with specific code locations
2. Impact assessment for each issue
3. Recommendations for fixes
4. Example code showing how to fix critical issues

Finally, include a JSON summary in this format:
{
  "securityScore": number,
  "critical": [], "high": [], "medium": [], "low": [], "informational": [],
  "optimizations": []
}

Each issue should include: type, description, location, impact, recommendation, and codeExample.`
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

      // Store the complete analysis including thinking process
      const rawAnalysis = analysisResponse;

      // Extract JSON data from the response
      const jsonMatch = analysisResponse.match(/```json\n([\s\S]*?)\n```/);
      let analysisResult;
      
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[1]);
        } catch (parseError) {
          console.error('Failed to parse JSON from response:', parseError);
          analysisResult = this.extractAnalysisFromText(analysisResponse);
        }
      } else {
        analysisResult = this.extractAnalysisFromText(analysisResponse);
      }

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

      console.log(`Found ${analysis.issuesCount} issues. Analysis completed in ${scanDuration}`);

      if (analysis.issuesCount > 0) {
        analysis.modificationSuggestions = await this.suggestContractModifications(code, analysis, model);
      }

      this.lastAnalysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Contract analysis error:', error);
      return this.getDefaultAnalysis(code);
    }
  }

  private formatAnalysisResponse(rawAnalysis: string, analysisResult: any): string {
    // Remove the JSON part since we'll format it differently
    const cleanAnalysis = rawAnalysis.replace(/```json[\s\S]*?```/, '');
    
    let formattedResponse = "# Smart Contract Security Analysis\n\n";
    formattedResponse += "## Analysis Process and Findings\n";
    formattedResponse += cleanAnalysis.trim() + "\n\n";
    
    formattedResponse += "## Security Issues Summary\n\n";
    
    if (analysisResult.critical?.length > 0) {
      formattedResponse += "### Critical Issues\n";
      analysisResult.critical.forEach((issue: SecurityIssue) => {
        formattedResponse += `- **${issue.type}**\n`;
        formattedResponse += `  - Location: ${issue.location}\n`;
        formattedResponse += `  - Description: ${issue.description}\n`;
        formattedResponse += `  - Impact: ${issue.impact}\n`;
        formattedResponse += `  - Recommendation: ${issue.recommendation}\n`;
        if (issue.codeExample) {
          formattedResponse += `  - Example Fix:\n\`\`\`move\n${issue.codeExample}\n\`\`\`\n`;
        }
      });
    }

    // Similar sections for high, medium, low, and informational issues...
    
    return formattedResponse;
  }

  private extractAnalysisFromText(text: string): any {
    // Extract analysis details from text when JSON parsing fails
    const result = {
      securityScore: 0,
      summary: "",
      critical: [],
      high: [],
      medium: [],
      low: [],
      informational: [],
      optimizations: []
    };

    // Look for severity indicators in the text
    if (text.toLowerCase().includes("critical") || text.toLowerCase().includes("severe")) {
      result.securityScore = 0;
    } else if (text.toLowerCase().includes("high")) {
      result.securityScore = 25;
    } else if (text.toLowerCase().includes("medium")) {
      result.securityScore = 50;
    } else if (text.toLowerCase().includes("low")) {
      result.securityScore = 75;
    } else {
      result.securityScore = 100;
    }

    // Extract summary
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
      location: issue.location || 'Location not specified',
      impact: issue.impact || 'Impact not specified',
      recommendation: issue.recommendation || 'No recommendation provided',
      codeExample: issue.codeExample || null
    }));
  }

  private validateOptimizations(optimizations: any[]): Optimization[] {
    return optimizations.map(opt => ({
      type: opt.type || 'Unknown Optimization',
      description: opt.description || 'No description provided',
      suggestion: opt.suggestion || 'No suggestion provided',
      impact: opt.impact || 'Impact not specified',
      codeExample: opt.codeExample || null
    }));
  }

  private async suggestContractModifications(code: string, analysis: ContractAnalysis, model: string): Promise<string> {
    try {
      console.log("Requesting modification suggestions based on analysis...");
      
      const systemMessage = {
        role: "system" as const,
        content: "You are an expert Move smart contract developer. Provide code modifications with inline comments explaining the changes."
      };

      const userMessage = {
        role: "user" as const,
        content: `Provide specific code modifications to address these issues:

Analysis Summary:
${analysis.summary}

Critical Issues: ${analysis.critical.map(i => i.type).join(", ")}
High Issues: ${analysis.high.map(i => i.type).join(", ")}
Medium Issues: ${analysis.medium.map(i => i.type).join(", ")}
Low Issues: ${analysis.low.map(i => i.type).join(", ")}

Original contract:

${code}

Return the modified contract with inline comments explaining each change.`
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
      console.error('Modification suggestion error:', error);
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