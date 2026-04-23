import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, login } from "@/services/auth-service";

vi.mock("@/repositories/user-repository", () => ({
  findByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  signToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

import { findByEmail, createUser } from "@/repositories/user-repository";
import { signToken } from "@/lib/jwt";
import { hash, compare } from "bcryptjs";

const mockFindByEmail = vi.mocked(findByEmail);
const mockCreateUser = vi.mocked(createUser);
const mockSignToken = vi.mocked(signToken);
const mockHash = vi.mocked(hash);
const mockCompare = vi.mocked(compare);

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    const validEmail = "test@example.com";
    const validPassword = "password123";

    it("registers a new user successfully and returns token and user", async () => {
      mockFindByEmail.mockResolvedValueOnce(null);
      mockHash.mockResolvedValueOnce("hashed-password" as never);
      mockCreateUser.mockResolvedValueOnce({
        id: "user-123",
        email: validEmail,
        createdAt: "2024-01-15T00:00:00.000Z",
      });
      mockSignToken.mockResolvedValueOnce("jwt-token-123");

      const result = await register(validEmail, validPassword);

      expect(result).toEqual({
        token: "jwt-token-123",
        user: {
          id: "user-123",
          email: validEmail,
          createdAt: "2024-01-15T00:00:00.000Z",
        },
      });

      expect(mockFindByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockHash).toHaveBeenCalledWith(validPassword, expect.any(Number));
      expect(mockCreateUser).toHaveBeenCalledWith(validEmail, "hashed-password");
      expect(mockSignToken).toHaveBeenCalledWith({
        userId: "user-123",
        email: validEmail,
      });
    });

    it("normalizes email to lowercase and trimmed", async () => {
      mockFindByEmail.mockResolvedValueOnce(null);
      mockHash.mockResolvedValueOnce("hashed-password" as never);
      mockCreateUser.mockResolvedValueOnce({
        id: "user-123",
        email: "test@example.com",
        createdAt: "2024-01-15T00:00:00.000Z",
      });
      mockSignToken.mockResolvedValueOnce("jwt-token-123");

      await register("  Test@Example.COM  ", validPassword);

      expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockCreateUser).toHaveBeenCalledWith(
        "test@example.com",
        "hashed-password"
      );
    });

    it("throws ConflictError when email is already registered", async () => {
      mockFindByEmail.mockResolvedValueOnce({
        id: "existing-user",
        email: validEmail,
        createdAt: "2024-01-01T00:00:00.000Z",
        passwordHash: "existing-hash",
      });

      await expect(register(validEmail, validPassword)).rejects.toThrow(
        "A user with this email already exists"
      );

      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockSignToken).not.toHaveBeenCalled();
    });

    it("throws ValidationError when email is empty", async () => {
      await expect(register("", validPassword)).rejects.toThrow(
        "Email is required"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("throws ValidationError when email format is invalid", async () => {
      await expect(register("not-an-email", validPassword)).rejects.toThrow(
        "Email format is invalid"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("throws ValidationError when password is empty", async () => {
      await expect(register(validEmail, "")).rejects.toThrow(
        "Password is required"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("throws ValidationError when password is too short", async () => {
      await expect(register(validEmail, "short")).rejects.toThrow(
        "Password must be at least 8 characters"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("throws ValidationError when both email and password are invalid", async () => {
      await expect(register("", "")).rejects.toThrow();

      expect(mockFindByEmail).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const validEmail = "test@example.com";
    const validPassword = "password123";

    const existingUser = {
      id: "user-123",
      email: validEmail,
      createdAt: "2024-01-15T00:00:00.000Z",
      passwordHash: "hashed-password",
    };

    it("logs in successfully and returns token and user", async () => {
      mockFindByEmail.mockResolvedValueOnce(existingUser);
      mockCompare.mockResolvedValueOnce(true as never);
      mockSignToken.mockResolvedValueOnce("jwt-token-456");

      const result = await login(validEmail, validPassword);

      expect(result).toEqual({
        token: "jwt-token-456",
        user: {
          id: "user-123",
          email: validEmail,
          createdAt: "2024-01-15T00:00:00.000Z",
        },
      });

      expect(mockFindByEmail).toHaveBeenCalledWith(validEmail);
      expect(mockCompare).toHaveBeenCalledWith(validPassword, "hashed-password");
      expect(mockSignToken).toHaveBeenCalledWith({
        userId: "user-123",
        email: validEmail,
      });
    });

    it("normalizes email to lowercase and trimmed on login", async () => {
      mockFindByEmail.mockResolvedValueOnce(existingUser);
      mockCompare.mockResolvedValueOnce(true as never);
      mockSignToken.mockResolvedValueOnce("jwt-token-456");

      await login("  Test@Example.COM  ", validPassword);

      expect(mockFindByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("throws AuthenticationError when user does not exist", async () => {
      mockFindByEmail.mockResolvedValueOnce(null);

      await expect(login(validEmail, validPassword)).rejects.toThrow(
        "Invalid email or password"
      );

      expect(mockCompare).not.toHaveBeenCalled();
      expect(mockSignToken).not.toHaveBeenCalled();
    });

    it("throws AuthenticationError when password is incorrect", async () => {
      mockFindByEmail.mockResolvedValueOnce(existingUser);
      mockCompare.mockResolvedValueOnce(false as never);

      await expect(login(validEmail, "wrongpassword")).rejects.toThrow(
        "Invalid email or password"
      );

      expect(mockCompare).toHaveBeenCalledWith("wrongpassword", "hashed-password");
      expect(mockSignToken).not.toHaveBeenCalled();
    });

    it("throws ValidationError when email is empty", async () => {
      await expect(login("", validPassword)).rejects.toThrow(
        "Email is required"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
    });

    it("throws ValidationError when email format is invalid", async () => {
      await expect(login("not-an-email", validPassword)).rejects.toThrow(
        "Email format is invalid"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
    });

    it("throws ValidationError when password is empty", async () => {
      await expect(login(validEmail, "")).rejects.toThrow(
        "Password is required"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
    });

    it("throws ValidationError when password is too short", async () => {
      await expect(login(validEmail, "short")).rejects.toThrow(
        "Password must be at least 8 characters"
      );

      expect(mockFindByEmail).not.toHaveBeenCalled();
    });

    it("does not return passwordHash in the user object", async () => {
      mockFindByEmail.mockResolvedValueOnce(existingUser);
      mockCompare.mockResolvedValueOnce(true as never);
      mockSignToken.mockResolvedValueOnce("jwt-token-789");

      const result = await login(validEmail, validPassword);

      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.user).toEqual({
        id: "user-123",
        email: validEmail,
        createdAt: "2024-01-15T00:00:00.000Z",
      });
    });
  });
});