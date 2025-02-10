import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface Message {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export const chatService = {
  async sendMessage(messages: Message[], model: string): Promise<string> {
    try {
      if (!messages.length) throw new Error("Messages array is empty.");

      const userMessage = messages.find(msg => msg.role === 'user');
      if (!userMessage) throw new Error("No user message found.");

      console.log('Sending message to Groq:', userMessage.content);

      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: userMessage.content,
          },
        ],
        model: model,
      });

      const chatCompletion = response.choices[0]?.message?.content || "";
      console.log('Received response from Groq:', chatCompletion);

      return chatCompletion;
    } catch (error) {
      console.error('Chat service error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  detectMoveCode(content: string): boolean {
    const moveKeywords = ['module', 'script', 'public fun', 'struct', '#[test]'];
    return moveKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }
};