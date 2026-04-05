const { z } = require('zod');

const trendsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

const recentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = { trendsQuerySchema, recentQuerySchema };
