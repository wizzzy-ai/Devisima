import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const [rawEmail, confirmation] = process.argv.slice(2);

if (!rawEmail || confirmation !== "--confirm-admin") {
  console.error("Usage: npm run admin:promote -- <verified-email> --confirm-admin");
  process.exit(1);
}

const email = rawEmail.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Provide a valid account email address.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
  if (!user) throw new Error("No account exists for that email.");
  if (!user.emailVerified) throw new Error("Verify the account email before granting administrator access.");
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.info("Administrator role assigned. Auth.js will refresh the role from the database on the next session check.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Administrator setup failed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
