const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2).optional(),
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

const getUsersQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

module.exports = { createUserSchema, updateUserSchema, getUsersQuerySchema };
