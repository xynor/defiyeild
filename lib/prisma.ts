import { PrismaClient } from '@prisma/client'

// Prisma client singleton — prevents multiple instances in dev due to HMR
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
