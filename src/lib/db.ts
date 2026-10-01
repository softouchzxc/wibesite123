import { PrismaClient } from "@prisma/client";

// У режимі розробки модулі перезавантажуються, тому клієнт зберігаємо глобально,
// щоб не відкривати нове з'єднання на кожну зміну файлу.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
