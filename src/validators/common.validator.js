const { z } = require('zod');

const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

module.exports = { idParamSchema };
