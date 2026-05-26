import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockAuth = { getUser: mockGetUser };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: mockAuth,
      from: mockFrom,
    })
  ),
}));

const mockDeleteUser = vi.fn(() => Promise.resolve({ error: null }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { deleteUser: mockDeleteUser } },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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