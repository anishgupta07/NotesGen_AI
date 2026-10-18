import { ChatDetail, ChatSummary } from '../types';

type ChatLike = Pick<ChatSummary, 'title' | 'video_url' | 'created_at'> | Pick<ChatDetail, 'title' | 'video_url' | 'created_at'>;

function formatFilenameTitle(input: string): string {
  const lastSegment = input.split('/').pop() || input;
  const withoutQuery = lastSegment.split('?')[0];
  const withoutExtension = withoutQuery.replace(/\.[a-z0-9]{2,5}$/i, '');
  const cleaned = withoutExtension.replace(/[_-]+/g, ' ').trim();
  return cleaned || 'Untitled Note';
}

export function getChatTitle(chat: ChatLike): string {
  const directTitle = (chat.title || '').trim();
  if (directTitle) return directTitle;

  const source = (chat.video_url || '').trim();
  if (!source) return 'Untitled Note';

  if (/^https?:\/\//i.test(source)) {
    return source.includes('youtu') ? 'YouTube Video Notes' : 'Video Notes';
  }

  return formatFilenameTitle(source);
}
