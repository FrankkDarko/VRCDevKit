/** Trigger a client-side file download from in-memory content. */
export function downloadFile(
  name: string,
  content: string | Uint8Array | Blob,
  mime = 'application/octet-stream',
) {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content as BlobPart], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
