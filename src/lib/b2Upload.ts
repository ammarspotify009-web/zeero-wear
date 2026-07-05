/**
 * Backblaze B2 Upload Utility
 * Uploads images via the /api/upload serverless function to avoid CORS issues.
 */

function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);
  return `products/${cleanName}-${timestamp}-${random}.${extension}`;
}

/**
 * Convert an ArrayBuffer to a base64 string safely (handles large files)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a single image file to Backblaze B2 via the /api/upload serverless function.
 * This avoids CORS issues by doing the upload server-side.
 */
export async function uploadImageToB2(file: File): Promise<UploadResult> {
  try {
    const fileName = generateFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = arrayBufferToBase64(arrayBuffer);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        contentType: file.type || 'image/jpeg',
        data: base64Data,
      }),
    });

    const result = await response.json();

    if (result.success && result.url) {
      return { success: true, url: result.url };
    } else {
      return { success: false, error: result.error || 'Upload failed' };
    }
  } catch (error: unknown) {
    console.error('Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    return { success: false, error: message };
  }
}

/**
 * Upload multiple image files via the serverless proxy
 */
export async function uploadMultipleImagesToB2(
  files: (File | null)[],
  onProgress?: (index: number, status: 'uploading' | 'done' | 'error') => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;

    onProgress?.(i, 'uploading');

    const result = await uploadImageToB2(file);
    if (result.success && result.url) {
      urls.push(result.url);
      onProgress?.(i, 'done');
    } else {
      console.error(`Failed to upload image ${i + 1}:`, result.error);
      onProgress?.(i, 'error');
    }
  }

  return urls;
}
