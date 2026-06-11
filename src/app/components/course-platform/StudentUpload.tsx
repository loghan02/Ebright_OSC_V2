"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface Submission {
  id: string;
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: number;
}

interface Props {
  courseSlug: string;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `s_${crypto.randomUUID().slice(0, 8)}`
    : `s_${Date.now().toString(36)}`;

export default function StudentUpload({ courseSlug }: Props) {
  const storageKey = `academy.training.${courseSlug}.submissions`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastUpload, setLastUpload] = useState<{ name: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const latest = (parsed as Submission[]).reduce((a, b) =>
            a.uploadedAt >= b.uploadedAt ? a : b,
          );
          setLastUpload({ name: latest.fileName, at: latest.uploadedAt });
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handlePick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file twice re-fires onChange
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Max 2 MB.`);
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const submission: Submission = {
        id: newId(),
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        dataUrl,
        uploadedAt: Date.now(),
      };

      let existing: Submission[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) existing = parsed as Submission[];
        }
      } catch {
        // ignore parse error, treat as empty
      }

      const next = [...existing, submission];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "localStorage write failed";
        setError(`Could not save upload: ${msg}`);
        return;
      }

      setLastUpload({ name: submission.fileName, at: submission.uploadedAt });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Read failed";
      setError(`Could not read file: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <Upload className="w-5 h-5" />
        {busy ? "Uploading…" : "Upload"}
      </button>

      {error && (
        <p className="text-sm text-rose-600 font-medium">{error}</p>
      )}

      {!error && lastUpload && (
        <p className="text-sm text-slate-600">
          Uploaded: <span className="font-semibold text-slate-800">{lastUpload.name}</span>
        </p>
      )}
    </div>
  );
}
