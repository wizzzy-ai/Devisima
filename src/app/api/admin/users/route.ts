import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { suspendUser, restoreUser, changeUserRole } from "@/lib/admin/operations";
import { Prisma, Role, UserStatus } from "@prisma/client";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

const userActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["suspend", "restore"]),
    userId: z.string().cuid(),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("changeRole"),
    userId: z.string().cuid(),
    role: z.nativeEnum(Role),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("create"),
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.nativeEnum(Role),
  }),
  z.object({
    action: z.literal("delete"),
    userId: z.string().cuid(),
  }),
  z.object({
    action: z.literal("resetPassword"),
    userId: z.string().cuid(),
    newPassword: z.string().min(8),
  }),
]);

export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (admin.role !== Role.ADMIN) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const requestedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isSafeInteger(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;
    const search = searchParams.get("search")?.trim().slice(0, 200) ?? "";
    const roleValue = searchParams.get("role");
    if (roleValue && !Object.values(Role).includes(roleValue as Role)) {
      return NextResponse.json({ error: "Invalid role filter." }, { status: 400 });
    }
    const statusValue = searchParams.get("status");
    if (statusValue && !Object.values(UserStatus).includes(statusValue as UserStatus)) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }
    const role = roleValue as Role | null;
    const status = statusValue as UserStatus | null;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") === "asc" ? "asc" : "desc") as "asc" | "desc";

    const db = (await import("@/lib/db/prisma")).db;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === "name") orderBy.name = sortOrder;
    else if (sortBy === "email") orderBy.email = sortOrder;
    else if (sortBy === "role") orderBy.role = sortOrder;
    else if (sortBy === "status") orderBy.status = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          image: true,
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (admin.role !== Role.ADMIN) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });

  try {
    const parsed = userActionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid user-management request." }, { status: 400 });
    const input = parsed.data;

    const db = (await import("@/lib/db/prisma")).db;

    switch (input.action) {
      case "suspend":
        await suspendUser(input.userId, admin.id, input.reason);
        break;
      case "restore":
        await restoreUser(input.userId, admin.id, input.reason);
        break;
      case "changeRole":
        await changeUserRole(input.userId, input.role, admin.id, input.reason);
        break;
      case "create": {
        const existingUser = await db.user.findUnique({ where: { email: input.email } });
        if (existingUser) {
          return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        await db.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: input.role,
            emailVerified: new Date(),
          },
        });
        break;
      }
      case "delete": {
        await db.user.delete({ where: { id: input.userId } });
        break;
      }
      case "resetPassword": {
        const passwordHash = await bcrypt.hash(input.newPassword, 12);
        await db.user.update({
          where: { id: input.userId },
          data: { passwordHash },
        });
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error in user management:", error);
    if (error instanceof Error && error.message.startsWith("Too many ")) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to perform action." }, { status: 500 });
  }
}
