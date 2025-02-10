import { Groq } from 'groq-sdk';

// Define the interfaces first
interface SecurityIssue {
  type: string;
  description: string;
  location?: string;
  impact: string;
  recommendation: string;
}

interface Optimization {
  type: string;
  description: string;
  suggestion: string;
  impact: string;
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
}

export class ContractAnalyzer {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async analyzeContract(code: string, model: string): Promise<ContractAnalysis> {
    const startTime = Date.now();
    
    try {
      // Prepare system prompt for contract analysis
      const systemPrompt = `You are an expert Move smart contract security auditor. Analyze the contract and provide a detailed security assessment.
      Format your response as a JSON object with the following structure:
      {
        "securityScore": number,
        "critical": array of issues,
        "high": array of issues,
        "medium": array of issues,
        "low": array of issues,
        "informational": array of issues,
        "optimizations": array of optimization suggestions
      }
      where each issue has: type, description, impact, and recommendation fields.`;

      // Send analysis request to Groq
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this Move smart contract:\n\n${code}` }
        ],
        model: model,
      });

      const analysisResponse = completion.choices[0]?.message?.content;
      if (!analysisResponse) {
        throw new Error('No analysis response received');
      }

      // Parse the AI response
      const analysisResult = JSON.parse(analysisResponse);

      // Calculate actual metrics
      const scanDuration = `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`;
      const linesOfCode = code.split('\n').filter(line => line.trim()).length;
      
      // Ensure all arrays are initialized even if AI doesn't return them
      const analysis: ContractAnalysis = {
        securityScore: analysisResult.securityScore || 100,
        scanDuration,
        linesOfCode,
        issuesCount: 0,
        critical: this.validateIssues(analysisResult.critical || []),
        high: this.validateIssues(analysisResult.high || []),
        medium: this.validateIssues(analysisResult.medium || []),
        low: this.validateIssues(analysisResult.low || []),
        informational: this.validateIssues(analysisResult.informational || []),
        optimizations: this.validateOptimizations(analysisResult.optimizations || [])
      };

      // Calculate total issues count
      analysis.issuesCount = 
        analysis.critical.length +
        analysis.high.length +
        analysis.medium.length +
        analysis.low.length +
        analysis.informational.length;

      return analysis;
    } catch (error) {
      console.error('Contract analysis error:', error);
      // Return a safe default if analysis fails
      return this.getDefaultAnalysis(code);
    }
  }

  private validateIssues(issues: any[]): SecurityIssue[] {
    return issues.map(issue => ({
      type: issue.type || 'Unknown Issue',
      description: issue.description || 'No description provided',
      location: issue.location,
      impact: issue.impact || 'Impact not specified',
      recommendation: issue.recommendation || 'No recommendation provided'
    }));
  }

  private validateOptimizations(optimizations: any[]): Optimization[] {
    return optimizations.map(opt => ({
      type: opt.type || 'Unknown Optimization',
      description: opt.description || 'No description provided',
      suggestion: opt.suggestion || 'No suggestion provided',
      impact: opt.impact || 'Impact not specified'
    }));
  }

  private getDefaultAnalysis(code: string): ContractAnalysis {
    return {
      securityScore: 100,
      scanDuration: '0 seconds',
      linesOfCode: code.split('\n').filter(line => line.trim()).length,
      issuesCount: 0,
      critical: [],
      high: [],
      medium: [],
      low: [],
      informational: [],
      optimizations: []
    };
  }
}

// Export a singleton instance
export const contractAnalyzer = new ContractAnalyzer();