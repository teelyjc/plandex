import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrismaClient = async (): Promise<PrismaClient> => {
  if (!globalThis.prisma) {
    const adapter = new PrismaMssql(process.env.DATABASE_URL);
    const prismaClient = new PrismaClient({ adapter });

    globalThis.prisma = prismaClient;
    return globalThis.prisma;
  }

  return globalThis.prisma;
}