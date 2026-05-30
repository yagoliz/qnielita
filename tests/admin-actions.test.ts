import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockAuth = {
  getUser: mockGetUser,
  signInWithPassword: mockSignInWithPassword,
  signOut: mockSignOut,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: mockAuth,
      from: mockFrom,
    })
  ),
}));

const mockDeleteUser = vi.fn(() => Promise.resolve({ error: null }));
const mockCreateUser = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
    auth: { admin: { deleteUser: mockDeleteUser, createUser: mockCreateUser } },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

function setupAdmin(userId = "admin-id") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
}

function mockProfilesTable(opts: { is_admin: boolean; updateError?: string | null }) {
  const mockUpdate = vi.fn(() => ({
    eq: () => Promise.resolve({ error: opts.updateError ? { message: opts.updateError } : null }),
  }));
  mockFrom.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: { is_admin: opts.is_admin }, error: null })
            ),
          })),
        })),
        update: mockUpdate,
      };
    }
    return {};
  });
  return mockUpdate;
}

describe("toggleUserAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("prevents self-demotion", async () => {
    setupAdmin("admin-id");
    mockProfilesTable({ is_admin: true });
    const { toggleUserAdmin } = await import("@/actions/admin");
    const result = await toggleUserAdmin("admin-id");
    expect(result).toEqual({ error: "No puedes cambiar tu propio rol de admin." });
  });

  it("flips is_admin for another user", async () => {
    setupAdmin("admin-id");
    const mockUpdate = mockProfilesTable({ is_admin: true });
    const { toggleUserAdmin } = await import("@/actions/admin");
    const result = await toggleUserAdmin("other-user-id");
    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({ is_admin: false });
  });
});

describe("removeUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("prevents self-deletion", async () => {
    setupAdmin("admin-id");
    mockProfilesTable({ is_admin: true });
    const { removeUser } = await import("@/actions/admin");
    const result = await removeUser("admin-id");
    expect(result).toEqual({ error: "No puedes eliminarte a ti mismo." });
  });

  it("deletes another user via admin client", async () => {
    setupAdmin("admin-id");
    mockProfilesTable({ is_admin: true });
    mockDeleteUser.mockResolvedValue({ error: null });
    const { removeUser } = await import("@/actions/admin");
    const result = await removeUser("other-user-id");
    expect(result).toEqual({ success: true });
    expect(mockDeleteUser).toHaveBeenCalledWith("other-user-id");
  });
});

describe("submitMatchResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function makeFormData(fields: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    return fd;
  }

  it("saves a group stage result without penalty_winner", async () => {
    setupAdmin("admin-id");
    const mockUpsert = vi.fn(() =>
      Promise.resolve({ error: null })
    );
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { is_admin: true }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "match_results") {
        return { upsert: mockUpsert };
      }
      return {};
    });

    const { submitMatchResult } = await import("@/actions/admin");
    const result = await submitMatchResult(
      makeFormData({ match_id: "1", home_score: "2", away_score: "1", stage: "group" })
    );
    expect(result).toEqual({ success: true });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ home_score: 2, away_score: 1, penalty_winner: null }),
      { onConflict: "match_id" }
    );
  });

  it("requires penalty_winner for tied knockout match", async () => {
    setupAdmin("admin-id");
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { is_admin: true }, error: null })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { submitMatchResult } = await import("@/actions/admin");
    const result = await submitMatchResult(
      makeFormData({ match_id: "1", home_score: "2", away_score: "2", stage: "QF" })
    );
    expect(result).toEqual({
      error: "Debes indicar quién avanzó en penaltis.",
    });
  });

  it("saves tied knockout match with penalty_winner", async () => {
    setupAdmin("admin-id");
    const mockUpsert = vi.fn(() =>
      Promise.resolve({ error: null })
    );
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { is_admin: true }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "match_results") {
        return { upsert: mockUpsert };
      }
      return {};
    });

    const { submitMatchResult } = await import("@/actions/admin");
    const result = await submitMatchResult(
      makeFormData({
        match_id: "1", home_score: "2", away_score: "2",
        stage: "QF", penalty_winner: "home",
      })
    );
    expect(result).toEqual({ success: true });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ penalty_winner: "home" }),
      { onConflict: "match_id" }
    );
  });

  it("clears penalty_winner when knockout scores are not tied", async () => {
    setupAdmin("admin-id");
    const mockUpsert = vi.fn(() =>
      Promise.resolve({ error: null })
    );
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { is_admin: true }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "match_results") {
        return { upsert: mockUpsert };
      }
      return {};
    });

    const { submitMatchResult } = await import("@/actions/admin");
    const result = await submitMatchResult(
      makeFormData({
        match_id: "1", home_score: "3", away_score: "1",
        stage: "R16", penalty_winner: "home",
      })
    );
    expect(result).toEqual({ success: true });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ penalty_winner: null }),
      { onConflict: "match_id" }
    );
  });
});

describe("updateUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns error when no changes provided", async () => {
    setupAdmin("admin-id");
    mockProfilesTable({ is_admin: true });
    const { updateUserProfile } = await import("@/actions/admin");
    const result = await updateUserProfile("other-user-id", {});
    expect(result).toEqual({ error: "No hay cambios." });
  });

  it("updates display_name and avatar_emoji", async () => {
    setupAdmin("admin-id");
    const mockUpdate = mockProfilesTable({ is_admin: true });
    const { updateUserProfile } = await import("@/actions/admin");
    const result = await updateUserProfile("other-user-id", {
      display_name: "Nuevo Nombre",
      avatar_emoji: "🏆",
    });
    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      display_name: "Nuevo Nombre",
      avatar_emoji: "🏆",
    });
  });
});

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  function makeFormData(fields: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    return fd;
  }

  it("rejects invalid username format", async () => {
    const { register } = await import("@/actions/auth");
    const result = await register(
      makeFormData({ token: "abc", username: "no spaces", display_name: "Test", password: "123456" })
    );
    expect(result).toEqual({
      error: "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)",
    });
  });

  it("rejects invalid token", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "invites") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: "not found" } })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { register } = await import("@/actions/auth");
    const result = await register(
      makeFormData({ token: "bad-token", username: "juan", display_name: "Juan", password: "123456" })
    );
    expect(result).toEqual({ error: "Enlace de invitación no válido" });
  });

  it("rejects when invite is full", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "invites") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "inv-1", max_claims: 2 }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "invite_claims") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ count: 2, error: null })
            ),
          })),
        };
      }
      return {};
    });

    const { register } = await import("@/actions/auth");
    const result = await register(
      makeFormData({ token: "full-token", username: "juan", display_name: "Juan", password: "123456" })
    );
    expect(result).toEqual({ error: "Este enlace de invitación ya no tiene plazas disponibles" });
  });

  it("rejects duplicate username", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "invites") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "inv-1", max_claims: 10 }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "invite_claims") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ count: 0, error: null })
            ),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: "existing-user" }, error: null })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { register } = await import("@/actions/auth");
    const result = await register(
      makeFormData({ token: "good-token", username: "taken", display_name: "Test", password: "123456" })
    );
    expect(result).toEqual({ error: "Este nombre de usuario ya está en uso" });
  });
});

describe("generateInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates invite with max_claims", async () => {
    setupAdmin("admin-id");
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: { token: "abc123" }, error: null })
        ),
      })),
    }));
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { is_admin: true }, error: null })
              ),
            })),
          })),
        };
      }
      if (table === "invites") {
        return { insert: mockInsert };
      }
      return {};
    });

    const { generateInvite } = await import("@/actions/admin");
    const result = await generateInvite(30);
    expect(result).toEqual({ token: "abc123" });
    expect(mockInsert).toHaveBeenCalledWith({
      created_by: "admin-id",
      max_claims: 30,
    });
  });
});