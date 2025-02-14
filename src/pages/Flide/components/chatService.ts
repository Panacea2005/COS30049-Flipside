import Groq from "groq-sdk";
import { contractAnalyzer } from "./contractAnalyzer";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface Message {
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp?: number;
  analysisResult?: any;
}

export const chatService = {
  async sendMessage(messages: Message[], model: string): Promise<string> {
    try {
      if (!messages.length) throw new Error("Messages array is empty.");

      const userMessage = messages[messages.length - 1];
      if (!userMessage || userMessage.role !== 'user') {
        throw new Error("No valid user message found.");
      }

      console.log('Sending message to Groq:', userMessage.content);

      // Check if the message contains Move code
      const isContractCode = this.detectMoveCode(userMessage.content);
      
      if (isContractCode) {
        // If it's contract code, let's analyze it using the contractAnalyzer
        const analysis = await contractAnalyzer.analyzeContract(userMessage.content, model);
        
        // Return the complete analysis including thinking process
        return analysis.rawAnalysis || this.formatDefaultAnalysis(analysis);
      }

      // For regular chat messages
      const systemMessage = {
        role: "system" as const,
        content: `You are an expert Move smart contract developer assistant. If the user asks about previous analysis results, refer to them and provide detailed explanations.`
      };

      const completion = await groq.chat.completions.create({
        messages: [
          systemMessage,
          ...messages.slice(-5).map(msg => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content
          }))
        ],
        model: model,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      console.error('Chat service error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  formatDefaultAnalysis(analysis: any): string {
    return `# Smart Contract Analysis Results

## Overview
- Security Score: ${analysis.securityScore}/100
- Scan Duration: ${analysis.scanDuration}
- Lines of Code: ${analysis.linesOfCode}
- Total Issues: ${analysis.issuesCount}

${analysis.summary ? `## Summary\n${analysis.summary}\n\n` : ''}

${analysis.critical.length > 0 ? `## Critical Issues\n${this.formatIssues(analysis.critical)}\n\n` : ''}
${analysis.high.length > 0 ? `## High Severity Issues\n${this.formatIssues(analysis.high)}\n\n` : ''}
${analysis.medium.length > 0 ? `## Medium Severity Issues\n${this.formatIssues(analysis.medium)}\n\n` : ''}
${analysis.low.length > 0 ? `## Low Severity Issues\n${this.formatIssues(analysis.low)}\n\n` : ''}
${analysis.informational.length > 0 ? `## Informational Issues\n${this.formatIssues(analysis.informational)}\n\n` : ''}
${analysis.optimizations.length > 0 ? `## Optimization Suggestions\n${this.formatOptimizations(analysis.optimizations)}\n\n` : ''}

${analysis.modificationSuggestions ? `## Recommended Modifications\n\`\`\`move\n${analysis.modificationSuggestions}\n\`\`\`\n` : ''}`;
  },

  formatIssues(issues: any[]): string {
    return issues.map(issue => 
      `### ${issue.type}\n` +
      `- **Location**: ${issue.location}\n` +
      `- **Description**: ${issue.description}\n` +
      `- **Impact**: ${issue.impact}\n` +
      `- **Recommendation**: ${issue.recommendation}\n` +
      (issue.codeExample ? `- **Example Fix**:\n\`\`\`move\n${issue.codeExample}\n\`\`\`\n` : '')
    ).join('\n');
  },

  formatOptimizations(optimizations: any[]): string {
    return optimizations.map(opt =>
      `### ${opt.type}\n` +
      `- **Description**: ${opt.description}\n` +
      `- **Suggestion**: ${opt.suggestion}\n` +
      `- **Impact**: ${opt.impact}\n` +
      (opt.codeExample ? `- **Example**:\n\`\`\`move\n${opt.codeExample}\n\`\`\`\n` : '')
    ).join('\n');
  },

  detectMoveCode(content: string): boolean {
    const moveKeywords = [
      'module',
      'script',
      'public fun',
      'struct',
      '#[test]',
      'use sui::',
      'fun init',
      'entry fun',
      '#[allow(unused_variable)]'
    ];
    const codeIndicators = [
      content.includes('{') && content.includes('}'),
      content.split('\n').length > 3,
      moveKeywords.some(keyword => content.toLowerCase().includes(keyword))
    ];
    return codeIndicators.filter(Boolean).length >= 2;
  }
};