import { hash, compare } from "bcryptjs";
import { findByEmail, createUser } from "@/repositories/user-repository";
import { signToken } from "@/lib/jwt";
import { validateLoginInput, validateRegisterInput } from "@/lib/validation";
import { ValidationError, ConflictError, AuthenticationError } from "@/lib/errors";
import type { AuthResponse } from "@/types";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "12", 10);

export async function register(email: string, password: string): Promise<AuthResponse> {
  const validation = validateRegisterInput({ email, password });

  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join(", ");
    throw new ValidationError(messages);
  }

  const trimmedEmail = email.trim().toLowerCase();

  const existingUser = await findByEmail(trimmedEmail);

  if (existingUser) {
    throw new ConflictError("A user with this email already exists");
  }

  const passwordHash = await hash(password, BCRYPT_SALT_ROUNDS);

  const user = await createUser(trimmedEmail, passwordHash);

  const token = await signToken({
    userId: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const validation = validateLoginInput({ email, password });

  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join(", ");
    throw new ValidationError(messages);
  }

  const trimmedEmail = email.trim().toLowerCase();

  const user = await findByEmail(trimmedEmail);

  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const isPasswordValid = await compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
}