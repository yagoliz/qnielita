"use client";

import { useRef } from "react";

export function ScoreInput({
  name,
  defaultValue,
  disabled,
}: {
  name: string;
  defaultValue?: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      name={name}
      type="number"
      min={0}
      max={20}
      defaultValue={defaultValue}
      disabled={disabled}
      className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      onFocus={() => inputRef.current?.select()}
    />
  );
}
