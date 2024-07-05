export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface Conversation {
    id: string;
    timestamp: number;
    messages: Message[];
  }