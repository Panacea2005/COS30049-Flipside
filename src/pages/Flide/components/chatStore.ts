export interface ChatHistory {
  id: number;
  title: string;
  date: string;
  messages: Message[];
  pinned?: boolean;
}

export interface Message {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

class ChatStore {
  private readonly STORAGE_KEY = 'flide_chat_history';

  saveChat(chat: ChatHistory): void {
    const history = this.getChatHistory();
    const updatedHistory = [...history, chat];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  getChatHistory(): ChatHistory[] {
    const history = localStorage.getItem(this.STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  }

  updateChat(chatId: number, messages: Message[]): void {
    const history = this.getChatHistory();
    const updatedHistory = history.map(chat => 
      chat.id === chatId ? { ...chat, messages } : chat
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  deleteChat(chatId: number): void {
    const history = this.getChatHistory();
    const updatedHistory = history.filter(chat => chat.id !== chatId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  pinChat(chatId: number): void {
    const history = this.getChatHistory();
    const updatedHistory = history.map(chat => 
      chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
  }

  generateChatTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    return firstUserMessage.content.slice(0, 10) + (firstUserMessage.content.length > 10 ? '...' : '');
  }

  loadChat(chatId: number): ChatHistory | null {
    const history = this.getChatHistory();
    return history.find(chat => chat.id === chatId) || null;
  }
}

export const chatStore = new ChatStore();