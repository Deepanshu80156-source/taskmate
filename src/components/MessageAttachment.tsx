import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Maximize2 } from 'lucide-react';
import type { Message } from '@/data/mockData';

interface MessageAttachmentProps {
  message: Message;
  getSignedUrl: (path: string) => Promise<string | null>;
  onDownload: () => void;
  loading?: boolean;
}

export default function MessageAttachment({
  message,
  getSignedUrl,
  onDownload,
  loading = false,
}: MessageAttachmentProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!message.attachmentPath) {
      setUrl(null);
      return () => { cancelled = true; };
    }

    void getSignedUrl(message.attachmentPath).then((signedUrl) => {
      if (!cancelled) setUrl(signedUrl);
    });

    return () => { cancelled = true; };
  }, [getSignedUrl, message.attachmentPath]);

  if (!message.attachmentPath) return null;

  const isImage = message.attachmentMimeType?.startsWith('image/');

  if (isImage) {
    return (
      <div className="mt-2 overflow-hidden rounded-xl border border-white/15 bg-black/10">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="group relative block" title="Open image">
            <img
              src={url}
              alt={message.attachmentName ?? 'Message photo'}
              className="max-h-64 w-full object-cover transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
            <span className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </a>
        ) : (
          <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading photo…
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 text-xs">
          <span className="flex-1 truncate">{message.attachmentName}</span>
          <button type="button" onClick={onDownload} disabled={loading} className="rounded p-1 hover:bg-white/15 disabled:opacity-50" title="Download photo">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 p-2">
      <FileText className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-xs">{message.attachmentName}</span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="rounded p-1 hover:bg-white/15" title="Open file">
          <Maximize2 className="h-3.5 w-3.5" />
        </a>
      )}
      <button type="button" onClick={onDownload} disabled={loading} className="rounded p-1 hover:bg-white/15 disabled:opacity-50" title="Download file">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}