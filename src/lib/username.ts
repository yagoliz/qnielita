const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const ERROR_MSG =
  "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)";

export function validateUsername(username: string): string | null {
  return USERNAME_RE.test(username) ? null : ERROR_MSG;
}

export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@qnielita.local`;
}