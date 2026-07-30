"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  label?: string;
  compact?: boolean; // 채팅용 작은 버튼
}

export function ImageUpload({ onUpload, label = "이미지 첨부", compact = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있어요.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하 이미지만 첨부할 수 있어요.");
      return;
    }

    setUploading(true);
    try {
      // 1. 서명 발급
      const sigRes = await fetch("/api/upload", { method: "POST" });
      const { signature, timestamp, folder, cloudName, apiKey } = await sigRes.json();

      // 2. Cloudinary에 직접 업로드
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("api_key", apiKey);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error?.message ?? "업로드 실패");

      setPreview(uploadData.secure_url);
      onUpload(uploadData.secure_url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="첨부" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
            <button
              type="button"
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-500 text-white text-xs"
              onClick={handleRemove}
            >×</button>
          </div>
        ) : (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            title="이미지 첨부"
          >
            {uploading ? (
              <span className="text-xs">...</span>
            ) : (
              <span className="text-base">📎</span>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img src={preview} alt="첨부 이미지" className="max-h-48 w-full object-contain bg-slate-50" />
          <button
            type="button"
            className="absolute top-2 right-2 rounded-full bg-slate-700/70 px-2 py-0.5 text-xs text-white hover:bg-slate-800"
            onClick={handleRemove}
          >
            삭제
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-sm text-slate-400 hover:bg-slate-100 disabled:opacity-40"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "업로드 중..." : `📎 ${label}`}
        </button>
      )}
    </div>
  );
}
