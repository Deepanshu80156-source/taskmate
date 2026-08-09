export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type FileValidationOptions = {
  allowedMimeTypes?: string[];
  maxBytes?: number;
};

type ValidFile = {
  valid: true;
};

type InvalidFile = {
  valid: false;
  error: string;
};

export function validateUploadFile(
  file: File,
  options: FileValidationOptions = {},
): ValidFile | InvalidFile {
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      error: 'Please choose a file.',
    };
  }

  if (!file.name || !file.name.trim()) {
    return {
      valid: false,
      error: 'Please choose a file with a valid name.',
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: 'The selected file is empty.',
    };
  }

  const allowedMimeTypes = options.allowedMimeTypes ?? [];
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;

  if (
    allowedMimeTypes.length > 0 &&
    !allowedMimeTypes.includes(file.type)
  ) {
    return {
      valid: false,
      error: 'This file type is not supported.',
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `The selected file is too large. The maximum allowed size is ${formatBytes(maxBytes)}.`,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Creates a safe filename for Supabase Storage.
 */
function safeFilename(filename: string): string {
  const cleaned = filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);

  return cleaned || 'file';
}

/**
 * The current application calls this function with values such as:
 *
 *   notes/<teacher-id>
 *   library/<teacher-id>
 *   announcements/<teacher-id>
 *   avatars/<user-id>
 *
 * Supabase policies expect the first folder to be the owner ID.
 * Therefore this function keeps only the final ID portion and returns:
 *
 *   <owner-id>/<unique-file-name>
 */
export function buildStoragePath(prefix: string, file: File): string {
  const prefixParts = prefix
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  const ownerId = prefixParts[prefixParts.length - 1] || 'user';

  const filename = safeFilename(file.name);
  const uniqueId =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${ownerId}/${uniqueId}-${filename}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}