import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from './api';
import { getToken } from './session';

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
};

function extensionFromName(name: string, fallback = 'jpg') {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : fallback;
}

export async function uploadFile(_uid: string, file: PickedFile, _folder: string) {
  const token = await getToken();
  const body = new FormData();
  body.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_URL}/v1/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'Upload failed');
  }
  return data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
}

export async function pickImages(limit = 4): Promise<PickedFile[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
  });

  if (result.canceled) return [];

  return result.assets.map((asset, index) => ({
    uri: asset.uri,
    name: asset.fileName || `image-${Date.now()}-${index}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
  }));
}

export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'text/plain', 'image/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || `document-${Date.now()}.${extensionFromName(asset.name || 'file.pdf', 'pdf')}`,
    mimeType: asset.mimeType || 'application/octet-stream',
  };
}
