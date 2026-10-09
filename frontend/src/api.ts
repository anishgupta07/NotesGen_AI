import { ChatSummary, ChatDetail, GenerateNotesRequest, ChatMessage } from './types';

const API_BASE = '/api';

export async function fetchChats(): Promise<ChatSummary[]> {
  const res = await fetch(`${API_BASE}/chats`);
  if (!res.ok) throw new Error('Failed to load chat history');
  return res.json();
}

export async function fetchChatById(chatId: string): Promise<ChatDetail> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`);
  if (!res.ok) throw new Error('Failed to load chat details');
  return res.json();
}

export async function requestGenerateNotes(payload: GenerateNotesRequest): Promise<ChatDetail> {
  const res = await fetch(`${API_BASE}/generate-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate notes');
  }
  return res.json();
}

export async function sendChatMessage(
  chatId: string,
  question: string
): Promise<{ user_message: ChatMessage; assistant_message: ChatMessage }> {
  const res = await fetch(`${API_BASE}/chats/${chatId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to send message');
  }
  return res.json();
}

export async function deleteChatSession(chatId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete chat');
}
