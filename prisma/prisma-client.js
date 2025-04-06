// prisma/prisma-client.js OR wherever you initialize prisma
const { PrismaClient } = require('@prisma/client');

// Singleton pattern for Prisma Client (good practice)
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Ensure the prisma instance is re-used during hot-reloading in development
  // See: https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
  if (!global._prisma) {
    global._prisma = new PrismaClient();
  }
  prisma = global._prisma;
}

module.exports = prisma;