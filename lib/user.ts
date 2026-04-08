import { prisma } from "./prisma";

export async function getOrCreateUser(clerkId: string, email: string) {
  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: { clerkId, email },
  });
}

export async function incrementUsage(clerkId: string) {
  await prisma.user.update({
    where: { clerkId },
    data: { analysesUsed: { increment: 1 } },
  });
}
