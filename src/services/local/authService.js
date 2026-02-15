import { localDb } from "./localDb";

const users = [
  {
    id: "local-admin",
    email: "admin@local.test",
    password: "Admin@123",
    role: "Admin",
  },
  {
    id: "local-viewer",
    email: "viewer@local.test",
    password: "Viewer@123",
    role: "Viewer",
  },
];

const authService = {
  async login(payload) {
    const user = users.find(
      (candidate) =>
        candidate.email.toLowerCase() === String(payload.email || "").toLowerCase() &&
        candidate.password === payload.password
    );

    if (!user) {
      throw new Error("Invalid credentials for local mode.");
    }

    return {
      token: `local-token-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  },

  async getMe() {
    return {
      id: "local-admin",
      email: "admin@local.test",
      role: "Admin",
    };
  },

  async logout() {
    return Promise.resolve();
  },

  async resetSeedData() {
    localDb.resetDbFromSeed();
  },
};

export default authService;
