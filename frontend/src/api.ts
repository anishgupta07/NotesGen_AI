import {
  ChatSummary,
  ChatDetail,
  GenerateNotesRequest,
  ChatMessage,
  User,
  AuthResponse,
} from './types';

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('notesgen_token');
}

export function setToken(token: string): void {
  localStorage.setItem('notesgen_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('notesgen_token');
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function registerUser(
  name: string,
  email: string,
  password: string,
  groqApiKey?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      password,
      groq_api_key: groqApiKey || undefined,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }
  const data: AuthResponse = await res.json();
  setToken(data.token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }
  const data: AuthResponse = await res.json();
  setToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Unauthorized or session expired');
  }
  return res.json();
}

export async function updateGroqApiKey(groqApiKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/groq-key`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ groq_api_key: groqApiKey }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update Groq API key');
  }
}

// ─── Chat & Note API ──────────────────────────────────────────────────────────

export async function fetchChats(): Promise<ChatSummary[]> {
  const res = await fetch(`${API_BASE}/chats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('Failed to load chat history');
  }
  return res.json();
}

export async function fetchChatById(chatId: string): Promise<ChatDetail> {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load chat details');
  return res.json();
}

export async function requestGenerateNotes(payload: GenerateNotesRequest): Promise<ChatDetail> {
  const res = await fetch(`${API_BASE}/generate-notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete chat');
}
