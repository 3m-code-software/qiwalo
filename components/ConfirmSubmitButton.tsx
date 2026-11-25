"use client";

import type { ReactNode } from "react";

export default function ConfirmSubmitButton({
  children,
  confirmText,
  className,
  name,
  value,
}: {
  children: ReactNode;
  confirmText: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
