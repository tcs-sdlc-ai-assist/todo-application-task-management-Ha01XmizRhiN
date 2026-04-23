# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- **User Registration and Login**
  - Email and password-based user registration with input validation
  - Secure login flow with credential verification
  - Password hashing for secure storage

- **JWT Authentication**
  - Token-based authentication using JSON Web Tokens
  - Protected API routes requiring valid authentication
  - Automatic token expiration and refresh handling
  - Typed JWT payload with userId, email, issued-at, and expiration claims

- **Task CRUD Operations**
  - Create tasks with title, description, optional status, and optional due date
  - Read tasks with full detail view
  - Update task title, description, status, and due date
  - Delete tasks with confirmation
  - Task status management with TODO, IN_PROGRESS, and DONE states

- **Pagination**
  - Server-side paginated task listing
  - Configurable page size and page number
  - Response includes total count, current page, limit, and total pages

- **Responsive Design**
  - Mobile-first responsive layout using Tailwind CSS
  - Optimized views for mobile, tablet, and desktop breakpoints
  - Consistent UI across all screen sizes

- **WCAG 2.1 AA Accessibility**
  - Semantic HTML structure throughout the application
  - Proper ARIA labels and roles on interactive elements
  - Keyboard navigation support for all features
  - Sufficient color contrast ratios meeting AA standards
  - Focus management and visible focus indicators
  - Screen reader compatible form labels and error messages

- **Vercel Deployment**
  - Production deployment configuration for Vercel
  - Environment variable management for server and client settings
  - Optimized Next.js build for edge deployment