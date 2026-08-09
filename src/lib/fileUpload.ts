export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateUploadFile(
  file: File,
  options: { allowedMimeTypes?: string[]; maxBytes?: number } = {}
): { valid: true } | { valid: false; error: string } {
  if (!file.name?.trim()) {
    return { valid: false, error: 'Please choose a file with a valid name.' };
  }

  const allowedMimeTypes = options.allowedMimeTypes ?? [];
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;

  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'This file type is not supported.' };
  }

  if (file.size > maxBytes) {
    return { valid: false, error: 'The selected file is too large.' };
  }

  return { valid: true };
}

export function buildStoragePath(prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || 'file';
  const ext = safeName.includes('.') ? safeName.slice(safeName.lastIndexOf('.')) : '';
  const baseName = safeName.replace(new RegExp(`${ext.replace('.', '\\.')}$`), '');
  return `${prefix}/${Date.now()}-${baseName}${ext}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
