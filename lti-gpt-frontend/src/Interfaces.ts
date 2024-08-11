export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens: number;
}

export interface Conversation {
    id: string;
    timestamp: number;
    messages: Message[];
  }

export interface ConversationDataFromAPI {
    id: string;
    updated_at: string;
}  

