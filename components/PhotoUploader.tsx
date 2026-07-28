"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PhotoUploader({ routeId, userId }: { routeId: string; userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${routeId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("route-photos")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { error: insertError } = await supabase.from("route_photos").insert({
        route_id: routeId,
        user_id: userId,
        storage_path: path,
      });

      if (insertError) setError(insertError.message);
    }

    setUploading(false);
    e.target.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="w-fit cursor-pointer rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5">
        {uploading ? "Subiendo..." : "Añadir fotos"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
