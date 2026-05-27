"use client";

import { useRef } from "react";

export function ScoreInput({
  name,
  defaultValue,
  disabled,
  onChange,
}: {
  name: string;
  defaultValue?: number;
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
      defaultValue={defaultValue}
      disabled={disabled}
      className="w-12 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      onFocus={() => inputRef.current?.select()}
      onInput={(e) => {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        if (!isNaN(val) && onChange) onChange(val);
      }}
    />
  );
}
