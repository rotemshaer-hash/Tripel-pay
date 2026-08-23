/** Bytes as something a person reads, not a number they have to divide. */
export function formatBytes(bytes: number | undefined): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** A glanceable stand-in for a file type, so a list of attachments is scannable
 * without reading every filename. */
export function fileIcon(mime: string | undefined): string {
  if (!mime) return "📎";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "📊";
  if (mime.includes("word") || mime.includes("document")) return "📘";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎧";
  return "📎";
}
