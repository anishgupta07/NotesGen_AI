export interface ChatSummary {
  id: string;
  title: string;
  video_url: string;
  language: 'hinglish' | 'english';
  note_style: 'detailed' | 'cheatsheet';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatDetail extends ChatSummary {
  notes: string;
  transcript: string;
  messages: ChatMessage[];
}

export interface GenerateNotesRequest {
  url: string;
  language: 'hinglish' | 'english';
  style: 'detailed' | 'cheatsheet';
  timeline_mode?: 'full' | 'custom';
  start_time?: string;
  end_time?: string;
}
