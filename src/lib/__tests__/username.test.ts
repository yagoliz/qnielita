import { describe, it, expect } from "vitest";
import { validateUsername, usernameToEmail } from "@/lib/username";

describe("validateUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateUsername("juan123")).toBeNull();
    expect(validateUsername("maria_gomez")).toBeNull();
    expect(validateUsername("abc")).toBeNull();
    expect(validateUsername("a".repeat(20))).toBeNull();
  });

  it("rejects usernames shorter than 3 characters", () => {
    expect(validateUsername("ab")).toBe(
      "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)"
    );
  });

  it("rejects usernames longer than 20 characters", () => {
    expect(validateUsername("a".repeat(21))).toBe(
      "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)"
    );
  });

  it("rejects usernames with invalid characters", () => {
    expect(validateUsername("juan!")).toBe(
      "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)"
    );
    expect(validateUsername("maria gomez")).toBe(
      "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)"
    );
    expect(validateUsername("José")).toBe(
      "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)"
    );
  });

  it("rejects empty string", () => {
    expect(validateUsername("")).toBe(
      "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)"
    );
  });
});

describe("usernameToEmail", () => {
  it("converts username to deterministic fake email", () => {
    expect(usernameToEmail("juan123")).toBe("juan123@qnielita.local");
  });

  it("lowercases and trims", () => {
    expect(usernameToEmail("  Juan123  ")).toBe("juan123@qnielita.local");
  });
});