const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Finance Dashboard API',
    version: '1.0.0',
    description: `
A RESTful backend for a personal finance dashboard.

## Authentication
All protected endpoints require a **Bearer JWT token** in the \`Authorization\` header.
Obtain a token via \`POST /api/auth/login\` or \`POST /api/auth/register\`.

## Roles
| Role | Permissions |
|------|------------|
| **VIEWER** | Read records and dashboard summary / categories / recent |
| **ANALYST** | VIEWER + create/edit records, view trends |
| **ADMIN** | Full access including user management |

## Quick Start
1. Register or login to get a token
2. Click **Authorize** (🔒) and paste: \`Bearer <your_token>\`
3. Explore the endpoints below
    `,
    contact: { name: 'Finance Dashboard API' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: 'https://zorvyn-assessment-vgu9.onrender.com', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Register and login — no token required' },
    { name: 'Users', description: 'User management — ADMIN only' },
    { name: 'Records', description: 'Financial records CRUD with filters and pagination' },
    { name: 'Dashboard', description: 'Aggregated analytics via MongoDB pipelines' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your JWT token here (without the "Bearer " prefix)',
      },
    },
    schemas: {
      // ── Common ──────────────────────────────────────────────
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'object',
                additionalProperties: { type: 'string' },
                example: { email: 'Invalid email', password: 'Too small: expected string to have >=6 characters' },
              },
            },
          },
        },
      },
      ObjectId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        example: '664f1b2c3d4e5f6a7b8c9d0e',
      },

      // ── User ────────────────────────────────────────────────
      User: {
        type: 'object',
        properties: {
          _id: { $ref: '#/components/schemas/ObjectId' },
          name: { type: 'string', example: 'Alice Johnson' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'], example: 'ANALYST' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUserBody: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Alice Johnson' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
          role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'], example: 'ANALYST' },
        },
      },
      UpdateUserBody: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 2, example: 'Alice Smith' },
          role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'], example: 'ADMIN' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'], example: 'INACTIVE' },
        },
      },

      // ── Auth ────────────────────────────────────────────────
      RegisterBody: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Alice Johnson' },
          email: { type: 'string', format: 'email', example: 'alice@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
          role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'], example: 'VIEWER' },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@finance.com' },
          password: { type: 'string', example: 'pass123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },

      // ── Financial Record ────────────────────────────────────
      FinancialRecord: {
        type: 'object',
        properties: {
          _id: { $ref: '#/components/schemas/ObjectId' },
          amount: { type: 'number', example: 5000 },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
          category: { type: 'string', example: 'Salary' },
          date: { type: 'string', format: 'date-time', example: '2025-04-01T00:00:00.000Z' },
          description: { type: 'string', example: 'Monthly salary' },
          createdBy: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Alice Johnson' },
              email: { type: 'string', example: 'alice@example.com' },
            },
          },
          deletedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateRecordBody: {
        type: 'object',
        required: ['amount', 'type', 'category', 'date'],
        properties: {
          amount: { type: 'number', minimum: 0.01, example: 5000 },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
          category: { type: 'string', minLength: 1, example: 'Salary' },
          date: { type: 'string', format: 'date-time', example: '2025-04-01T00:00:00.000Z' },
          description: { type: 'string', example: 'Monthly salary' },
        },
      },
      UpdateRecordBody: {
        type: 'object',
        minProperties: 1,
        properties: {
          amount: { type: 'number', minimum: 0.01, example: 5500 },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          category: { type: 'string', minLength: 1, example: 'Consulting' },
          date: { type: 'string', format: 'date-time' },
          description: { type: 'string', example: 'Updated description' },
        },
      },
      PaginatedRecords: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          records: {
            type: 'array',
            items: { $ref: '#/components/schemas/FinancialRecord' },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 42 },
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              totalPages: { type: 'integer', example: 3 },
            },
          },
        },
      },

      // ── Dashboard ───────────────────────────────────────────
      DashboardSummary: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              totalIncome: { type: 'number', example: 36700 },
              totalExpenses: { type: 'number', example: 17005 },
              netBalance: { type: 'number', example: 19695 },
              totalRecords: { type: 'integer', example: 25 },
            },
          },
        },
      },
      CategoryTotal: {
        type: 'object',
        properties: {
          category: { type: 'string', example: 'Salary' },
          income: { type: 'number', example: 30000 },
          expense: { type: 'number', example: 0 },
          net: { type: 'number', example: 30000 },
          count: { type: 'integer', example: 6 },
        },
      },
      MonthlyTrend: {
        type: 'object',
        properties: {
          year: { type: 'integer', example: 2025 },
          month: { type: 'integer', example: 4 },
          income: { type: 'number', example: 6500 },
          expense: { type: 'number', example: 2345 },
          net: { type: 'number', example: 4155 },
        },
      },
    },

    // ── Reusable responses ────────────────────────────────────
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Forbidden: {
        description: 'Authenticated but insufficient role',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      BadRequest: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Conflict: {
        description: 'Duplicate value (e.g. email already in use)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },

    // ── Reusable parameters ───────────────────────────────────
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/ObjectId' },
        description: 'MongoDB ObjectId (24 hex characters)',
      },
    },
  },

  // ── Paths ───────────────────────────────────────────────────
  paths: {
    // Health
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Auth'],
        security: [],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } } },
        },
      },
    },

    // ── Auth ──────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          201: { description: 'Registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login and receive JWT',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Users ─────────────────────────────────────────────────
    '/api/users': {
      get: {
        summary: 'List all users',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            description: 'Filter by account status',
          },
        ],
        responses: {
          200: {
            description: 'User list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a user',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserBody' } } },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user by ID',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'User found',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/User' } } } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Update user (name, role, or status)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserBody' } } },
        },
        responses: {
          200: {
            description: 'User updated',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/User' } } } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete user permanently',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'User deleted',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { nullable: true, example: null } } } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Records ───────────────────────────────────────────────
    '/api/records': {
      get: {
        summary: 'List records with filters and pagination',
        tags: ['Records'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] }, description: 'Filter by type' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Partial, case-insensitive match on category' },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Records on or after this date', example: '2025-01-01T00:00:00.000Z' },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Records on or before this date', example: '2025-12-31T23:59:59.000Z' },
          { name: 'minAmount', in: 'query', schema: { type: 'number' }, description: 'Minimum amount (inclusive)' },
          { name: 'maxAmount', in: 'query', schema: { type: 'number' }, description: 'Maximum amount (inclusive)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number (1-based)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Records per page' },
        ],
        responses: {
          200: { description: 'Paginated records', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedRecords' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        summary: 'Create a financial record',
        tags: ['Records'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRecordBody' } } },
        },
        responses: {
          201: {
            description: 'Record created',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FinancialRecord' } } } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/records/{id}': {
      get: {
        summary: 'Get a single record by ID',
        tags: ['Records'],
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'Record found',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FinancialRecord' } } } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Update a record',
        tags: ['Records'],
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRecordBody' } } },
        },
        responses: {
          200: {
            description: 'Record updated',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { $ref: '#/components/schemas/FinancialRecord' } } } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Soft-delete a record (sets deletedAt, excluded from all queries)',
        tags: ['Records'],
        security: [{ BearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          200: {
            description: 'Record soft-deleted',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: { nullable: true, example: null } } } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Dashboard ─────────────────────────────────────────────
    '/api/dashboard/summary': {
      get: {
        summary: 'Total income, expenses, net balance and record count',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Summary totals', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardSummary' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dashboard/categories': {
      get: {
        summary: 'Income, expense and net broken down by category',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Category breakdown',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/CategoryTotal' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dashboard/trends': {
      get: {
        summary: 'Monthly income vs expense trends (ANALYST+ only)',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'months',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 24, default: 6 },
            description: 'Number of past months to include (1–24)',
          },
        ],
        responses: {
          200: {
            description: 'Monthly trend data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/MonthlyTrend' } },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dashboard/recent': {
      get: {
        summary: 'Most recent financial records sorted by date descending',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Number of records to return (1–100)',
          },
        ],
        responses: {
          200: {
            description: 'Recent records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecord' } },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
