"use client";

import type { ReactNode } from "react";

export default function ConfirmSubmitButton({
  children,
  confirmText,
  className,
  name,
  value,
  "data-testid": testId,
}: {
  children: ReactNode;
  confirmText: string;
  className?: string;
  name?: string;
  value?: string;
  "data-testid"?: string;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      data-testid={testId}
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
