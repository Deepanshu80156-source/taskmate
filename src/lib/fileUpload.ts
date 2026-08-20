export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

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
    .filter(Boolean)
    .filter((part) => part !== 'avatars');

  const ownerId = prefixParts[prefixParts.length - 1] || 'user';

  const filename = safeFilename(file.name);
  const uniqueId =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${ownerId}/${uniqueId}-${filename}`;
}

export function normalizeAvatarStoragePath(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      // Keep the leading slash while matching Supabase's storage URL
      // prefixes. Older versions removed it first, so legacy public and
      // signed avatar URLs were treated as external images and could not be
      // re-signed when the bucket was private or the token had expired.
      const pathname = url.pathname;
      const storageMarkers = [
        '/storage/v1/object/public/avatars/',
        '/storage/v1/object/sign/avatars/',
        '/storage/v1/object/authenticated/avatars/',
      ];
      const marker = storageMarkers.find((candidate) =>
        pathname.includes(candidate),
      );

      if (marker) {
        const suffix = pathname.slice(pathname.indexOf(marker) + marker.length);
        return suffix.replace(/^\/+/, '').split('?')[0] || null;
      }

      return null;
    } catch {
      return null;
    }
  }

  const withoutPrefix = trimmed
    .replace(/^\/+/, '')
    .replace(/^avatars\//i, '')
    .split('?')[0]
    .replace(/^\/+/, '');

  if (!withoutPrefix) return null;

  return withoutPrefix;
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