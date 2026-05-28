"use client";

import { useRef } from "react";

export function ScoreInput({
  name,
  defaultValue,
  value,
  disabled,
  onChange,
}: {
  name: string;
  defaultValue?: number;
  value?: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      name={name}
      type="number"
      min={0}
      max={20}
      {...(value !== undefined ? { value } : { defaultValue })}
      disabled={disabled}
      className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      onFocus={() => inputRef.current?.select()}
      onChange={(e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && onChange) onChange(val);
      }}
    />
  );
}