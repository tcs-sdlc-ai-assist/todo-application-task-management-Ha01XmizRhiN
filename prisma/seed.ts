import { PrismaClient, TaskStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing data");

  // Create sample users
  const saltRounds = 12;

  const user1Password = await hash("password123", saltRounds);
  const user2Password = await hash("password456", saltRounds);

  const user1 = await prisma.user.create({
    data: {
      email: "alice@example.com",
      passwordHash: user1Password,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "bob@example.com",
      passwordHash: user2Password,
    },
  });

  console.log(`👤 Created user: ${user1.email} (id: ${user1.id})`);
  console.log(`👤 Created user: ${user2.email} (id: ${user2.id})`);

  // Create sample tasks for user1
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  const user1Tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Set up project repository",
        description: "Initialize the Git repository and configure CI/CD pipeline for the new project.",
        status: TaskStatus.DONE,
        dueDate: new Date(now.getTime() - 7 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Design database schema",
        description: "Create the ERD and define all tables, relationships, and indexes for the application.",
        status: TaskStatus.DONE,
        dueDate: new Date(now.getTime() - 3 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Implement user authentication",
        description: "Build registration and login endpoints with JWT token generation and validation.",
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(now.getTime() + 2 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Build task CRUD API",
        description: "Create REST endpoints for creating, reading, updating, and deleting tasks.",
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(now.getTime() + 5 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Add pagination support",
        description: "Implement server-side pagination for the task listing endpoint with configurable page size.",
        status: TaskStatus.TODO,
        dueDate: new Date(now.getTime() + 7 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Write unit tests",
        description: "Add comprehensive test coverage for all API endpoints and utility functions.",
        status: TaskStatus.TODO,
        dueDate: new Date(now.getTime() + 10 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Set up deployment pipeline",
        description: "Configure Vercel deployment with environment variables and database migrations.",
        status: TaskStatus.TODO,
        dueDate: new Date(now.getTime() + 14 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Review accessibility compliance",
        description: "Audit the application for WCAG 2.1 AA compliance and fix any issues found.",
        status: TaskStatus.TODO,
        dueDate: null,
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Update project documentation",
        description: "Write comprehensive README with setup instructions, API docs, and deployment guide.",
        status: TaskStatus.TODO,
        dueDate: null,
      },
    }),
    prisma.task.create({
      data: {
        userId: user1.id,
        title: "Fix overdue bug report",
        description: "Investigate and resolve the reported issue with task status not updating correctly.",
        status: TaskStatus.TODO,
        dueDate: new Date(now.getTime() - 2 * oneDay),
      },
    }),
  ]);

  console.log(`📋 Created ${user1Tasks.length} tasks for ${user1.email}`);

  // Create sample tasks for user2
  const user2Tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user2.id,
        title: "Research frontend frameworks",
        description: "Compare React, Vue, and Angular for the upcoming dashboard project.",
        status: TaskStatus.DONE,
        dueDate: new Date(now.getTime() - 5 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user2.id,
        title: "Create wireframes",
        description: "Design low-fidelity wireframes for the main application screens.",
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date(now.getTime() + 1 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user2.id,
        title: "Set up monitoring",
        description: "Configure application monitoring and alerting with uptime checks.",
        status: TaskStatus.TODO,
        dueDate: new Date(now.getTime() + 8 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user2.id,
        title: "Prepare demo presentation",
        description: "Create slides and talking points for the sprint demo meeting.",
        status: TaskStatus.TODO,
        dueDate: new Date(now.getTime() + 3 * oneDay),
      },
    }),
    prisma.task.create({
      data: {
        userId: user2.id,
        title: "Grocery shopping",
        description: "",
        status: TaskStatus.TODO,
        dueDate: null,
      },
    }),
  ]);

  console.log(`📋 Created ${user2Tasks.length} tasks for ${user2.email}`);

  const totalTasks = user1Tasks.length + user2Tasks.length;
  console.log(`\n✅ Seed completed successfully!`);
  console.log(`   - 2 users created`);
  console.log(`   - ${totalTasks} tasks created`);
  console.log(`\n📧 Test credentials:`);
  console.log(`   alice@example.com / password123`);
  console.log(`   bob@example.com / password456`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });