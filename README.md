# Todo App

A full-stack task management application built with Next.js, TypeScript, and Prisma.

## Features

- **User Authentication** — Register and login with email/password, JWT-based session management
- **Task Management** — Create, read, update, and delete tasks
- **Task Status Tracking** — Organize tasks by status: TODO, IN_PROGRESS, DONE
- **Due Dates** — Assign optional due dates to tasks
- **Pagination** — Paginated task listing for efficient data loading
- **Type Safety** — End-to-end TypeScript with shared type contracts

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** JWT (JSON Web Tokens)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Folder Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages and API routes
│   │   ├── api/               # API route handlers
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── register/
│   │   │   │       └── route.ts
│   │   │   └── tasks/
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           └── route.ts
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── loading.tsx        # Loading state
│   │   └── error.tsx          # Error boundary
│   ├── types.ts               # Shared type definitions
│   └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A PostgreSQL database (or another Prisma-supported database)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/todo_app"
   JWT_SECRET="your-secret-key-here"
   ```

4. **Run database migrations:**

   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma client:**

   ```bash
   npx prisma generate
   ```

6. **Start the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

### Authentication

| Method | Endpoint              | Description          | Auth Required |
|--------|-----------------------|----------------------|---------------|
| POST   | `/api/auth/register`  | Register a new user  | No            |
| POST   | `/api/auth/login`     | Login and get token  | No            |

#### POST `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Tasks

All task endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint          | Description             | Auth Required |
|--------|-------------------|-------------------------|---------------|
| GET    | `/api/tasks`      | List tasks (paginated)  | Yes           |
| POST   | `/api/tasks`      | Create a new task       | Yes           |
| GET    | `/api/tasks/:id`  | Get a task by ID        | Yes           |
| PUT    | `/api/tasks/:id`  | Update a task           | Yes           |
| DELETE | `/api/tasks/:id`  | Delete a task           | Yes           |

#### GET `/api/tasks`

**Query Parameters:**
- `page` (number, default: 1) — Page number
- `limit` (number, default: 10) — Items per page
- `status` (string, optional) — Filter by status: `TODO`, `IN_PROGRESS`, `DONE`

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "title": "My Task",
      "description": "Task description",
      "status": "TODO",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "dueDate": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### POST `/api/tasks`

**Request Body:**
```json
{
  "title": "My Task",
  "description": "Task description",
  "status": "TODO",
  "dueDate": "2024-12-31T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "id": "clx...",
  "userId": "clx...",
  "title": "My Task",
  "description": "Task description",
  "status": "TODO",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "dueDate": "2024-12-31T00:00:00.000Z"
}
```

#### PUT `/api/tasks/:id`

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "dueDate": "2024-12-31T00:00:00.000Z"
}
```

**Response (200):**
```json
{
  "id": "clx...",
  "userId": "clx...",
  "title": "Updated Title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "dueDate": "2024-12-31T00:00:00.000Z"
}
```

#### DELETE `/api/tasks/:id`

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

### Error Responses

All error responses follow this format:

```json
{
  "message": "Error description",
  "statusCode": 400
}
```

| Status Code | Description           |
|-------------|-----------------------|
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 404         | Not Found             |
| 500         | Internal Server Error |

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Deployment

### Vercel

This project is optimized for deployment on [Vercel](https://vercel.com/).

1. **Push your code** to a GitHub, GitLab, or Bitbucket repository.

2. **Import the project** on [vercel.com/new](https://vercel.com/new).

3. **Configure environment variables** in the Vercel dashboard:
   - `DATABASE_URL` — Your production database connection string
   - `JWT_SECRET` — A strong, unique secret key for JWT signing

4. **Deploy.** Vercel will automatically detect the Next.js framework and configure the build settings.

5. **Run database migrations** against your production database:

   ```bash
   npx prisma migrate deploy
   ```

### Production Considerations

- Use a strong, randomly generated `JWT_SECRET` (minimum 32 characters)
- Use a connection pooler (e.g., PgBouncer or Prisma Accelerate) for serverless database connections
- Enable SSL for your database connection
- Set up proper CORS configuration if accessing the API from external domains

## License

Private — All rights reserved.