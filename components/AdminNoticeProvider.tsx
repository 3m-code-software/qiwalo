"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type AdminNoticeContextValue = {
  showNotice: (message: string) => void;
};

const AdminNoticeContext = createContext<AdminNoticeContextValue | null>(null);

export function AdminNoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<string | null>(null);
  const showNotice = useCallback((message: string) => setNotice(message), []);

  return (
    <AdminNoticeContext.Provider value={{ showNotice }}>
      {notice && (
        <div role="status" className="mb-5 rounded-lg bg-nile-soft px-4 py-3 text-sm font-bold text-nile-dark">
          {notice}
        </div>
      )}
      {children}
    </AdminNoticeContext.Provider>
  );
}

export function useAdminNotice() {
  const context = useContext(AdminNoticeContext);
  if (!context) throw new Error("useAdminNotice must be used inside AdminNoticeProvider");
  return context;
}
