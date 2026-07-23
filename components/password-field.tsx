"use client";

import { useState } from "react";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M8.4 5.5A10.4 10.4 0 0 1 12 4.8c5.4 0 8.7 4.6 9.8 6.6a1.2 1.2 0 0 1 0 1.2 18.5 18.5 0 0 1-2.7 3.5M6.1 6.9a18.3 18.3 0 0 0-3.9 4.5 1.2 1.2 0 0 0 0 1.2c1.1 2 4.4 6.6 9.8 6.6 1.6 0 3-.4 4.2-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M2.2 11.4C3.3 9.4 6.6 4.8 12 4.8s8.7 4.6 9.8 6.6a1.2 1.2 0 0 1 0 1.2c-1.1 2-4.4 6.6-9.8 6.6s-8.7-4.6-9.8-6.6a1.2 1.2 0 0 1 0-1.2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function PasswordField({
  autoComplete,
  hint,
  label,
  onChange,
  placeholder,
  value,
}: {
  autoComplete: string;
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="password-field-label">
      {label}
      <span className="password-field-control">
        <input
          autoComplete={autoComplete}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <EyeIcon visible={visible} />
        </button>
      </span>
      {hint ? <span className="auth-hint">{hint}</span> : null}
    </label>
  );
}
