import prisma from "@/lib/db";
import type { User } from "@/types";

interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

function toUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    createdAt: dbUser.createdAt.toISOString(),
  };
}

export async function findByEmail(
  email: string
): Promise<(User & { passwordHash: string }) | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  return {
    ...toUser(user),
    passwordHash: user.passwordHash,
  };
}

export async function findById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return null;
  }

  return toUser(user);
}

export async function createUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  return toUser(user);
}