import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

// Reuse the existing Prisma instance if it exists; otherwise, create a new one
const prisma = globalForPrisma.prisma || new PrismaClient();

// preventing creating a new client on every file change
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;