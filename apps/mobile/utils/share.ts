import { Share } from 'react-native';

export async function sharePostText(input: { user: string; content: string }) {
  const message = `${input.user} on Master Connect:\n${input.content}`.trim();
  await Share.share({ message });
}
