"use client";

import { SearchSidebar } from "@/components/search/search-sidebar";

export function SearchScreen() {
  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[320px_1fr] md:gap-4">
      <SearchSidebar />
      <div className="glass-panel flex h-full flex-col rounded-3xl p-4">
        <h1 className="text-lg font-semibold">Новый диалог</h1>
        <p className="mt-1 text-sm text-zinc-400">Выберите пользователя в левой панели, и чат откроется автоматически</p>
      </div>
    </div>
  );
}
