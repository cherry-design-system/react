export type DropzoneRejectionReason = "type" | "size" | "count";

export interface DropzoneRejection {
  file: File;
  reason: DropzoneRejectionReason;
}

/**
 * Matches a file against an `accept` string (".pdf,image/*,text/plain"),
 * mirroring the native picker's filter for dropped files.
 */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.split(",").some((raw) => {
    const entry = raw.trim().toLowerCase();
    if (!entry) return false;
    if (entry.startsWith(".")) return name.endsWith(entry);
    if (entry.endsWith("/*")) return type.startsWith(entry.slice(0, -1));
    return type === entry;
  });
}

/** Splits files into accepted and rejected (type, then size, then count). */
export function sortFiles(
  files: File[],
  {
    accept,
    maxBytes,
    maxFiles,
  }: { accept?: string; maxBytes?: number; maxFiles?: number },
): { accepted: File[]; rejected: DropzoneRejection[] } {
  const accepted: File[] = [];
  const rejected: DropzoneRejection[] = [];
  for (const file of files) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
    else if (maxBytes !== undefined && file.size > maxBytes)
      rejected.push({ file, reason: "size" });
    else if (maxFiles !== undefined && accepted.length >= maxFiles)
      rejected.push({ file, reason: "count" });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/** Puts dropped files into a file input so native forms submit them too. */
export function assignFiles(input: HTMLInputElement | null, files: File[]) {
  if (!input || typeof DataTransfer === "undefined") return;
  try {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
  } catch {
    // Older engines cannot construct a DataTransfer; the callback still runs.
  }
}
