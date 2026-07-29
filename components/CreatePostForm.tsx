"use client";

import { filterPokemonSuggestions } from "@/lib/pokemon-data";
import type { CreatePostRequest } from "@/lib/types";
import { FormEvent, useMemo, useState } from "react";

interface CreatePostFormProps {
  onSubmit: (data: Omit<CreatePostRequest, "authorId" | "authorNickname">) => Promise<void>;
  onCancel: () => void;
}

export function CreatePostForm({ onSubmit, onCancel }: CreatePostFormProps) {
  const [offeringName, setOfferingName] = useState("");
  const [offeringLevel, setOfferingLevel] = useState("");
  const [offeringNature, setOfferingNature] = useState("");
  const [offeringAbility, setOfferingAbility] = useState("");
  const [offeringNote, setOfferingNote] = useState("");
  const [offeringShiny, setOfferingShiny] = useState(false);
  const [wanting, setWanting] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(() => filterPokemonSuggestions(offeringName), [offeringName]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        offering: {
          name: offeringName.trim(),
          level: offeringLevel ? Number(offeringLevel) : undefined,
          nature: offeringNature.trim() || undefined,
          ability: offeringAbility.trim() || undefined,
          note: offeringNote.trim() || undefined,
          shiny: offeringShiny,
        },
        wanting: wanting.trim(),
        note: note.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800">교환 게시글 올리기</h3>
        <button type="button" className="text-sm text-slate-400" onClick={onCancel}>
          닫기
        </button>
      </div>

      {/* 줄 포켓몬 */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-red-600">📦 줄게요 (내 포켓몬)</legend>

        <div className="relative">
          <input
            className="input"
            placeholder="포켓몬 이름 *"
            value={offeringName}
            onChange={(e) => setOfferingName(e.target.value)}
            required
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => setOfferingName(s)}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="레벨 (선택)"
            type="number"
            min={1}
            max={100}
            value={offeringLevel}
            onChange={(e) => setOfferingLevel(e.target.value)}
          />
          <input
            className="input"
            placeholder="성격 (선택)"
            value={offeringNature}
            onChange={(e) => setOfferingNature(e.target.value)}
          />
        </div>
        <input
          className="input"
          placeholder="특성 (선택)"
          value={offeringAbility}
          onChange={(e) => setOfferingAbility(e.target.value)}
        />
        <input
          className="input"
          placeholder="메모 (개체값, 기술 등)"
          value={offeringNote}
          onChange={(e) => setOfferingNote(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={offeringShiny}
            onChange={(e) => setOfferingShiny(e.target.checked)}
          />
          ✨ 색이 다른 포켓몬
        </label>
      </fieldset>

      {/* 원하는 포켓몬 */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-blue-600">🎯 원해요 (상대 포켓몬)</legend>
        <input
          className="input"
          placeholder="원하는 포켓몬 이름 또는 조건 *"
          value={wanting}
          onChange={(e) => setWanting(e.target.value)}
          required
        />
      </fieldset>

      {/* 추가 메모 */}
      <input
        className="input"
        placeholder="추가 설명 (선택)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "등록 중..." : "게시글 올리기"}
      </button>
    </form>
  );
}
