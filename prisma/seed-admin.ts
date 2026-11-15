import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    const adminEmail = "admin@devisima.com";
    const adminPassword = "Admin123!";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: "Devisima Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    console.log("Admin account created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: ${admin.role}`);
  } catch (error) {
    console.error("Error creating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
