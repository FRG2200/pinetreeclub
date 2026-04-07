import { z } from 'zod';
import { insertGenerationSchema, generations, userCredits, tasks, userTaskProgress, aiModels, apps, inspirations, creditPackages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  insufficientCredits: z.object({
    message: z.string(),
    required: z.number(),
    available: z.number(),
  }),
};

export const api = {
  // Generations
  generations: {
    list: {
      method: 'GET' as const,
      path: '/api/generations',
      responses: {
        200: z.array(z.custom<typeof generations.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/generations',
      input: insertGenerationSchema,
      responses: {
        201: z.custom<typeof generations.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        402: errorSchemas.insufficientCredits,
        500: errorSchemas.internal,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/generations/:id',
      responses: {
        200: z.custom<typeof generations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    toggleFavorite: {
      method: 'PATCH' as const,
      path: '/api/generations/:id/favorite',
      responses: {
        200: z.custom<typeof generations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/generations/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },

  // User Credits
  credits: {
    get: {
      method: 'GET' as const,
      path: '/api/credits',
      responses: {
        200: z.custom<typeof userCredits.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    purchase: {
      method: 'POST' as const,
      path: '/api/credits/purchase',
      input: z.object({ packageId: z.number() }),
      responses: {
        200: z.custom<typeof userCredits.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Tasks
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.object({
          task: z.custom<typeof tasks.$inferSelect>(),
          progress: z.custom<typeof userTaskProgress.$inferSelect>().optional(),
        })),
        401: errorSchemas.unauthorized,
      },
    },
    claim: {
      method: 'POST' as const,
      path: '/api/tasks/:id/claim',
      responses: {
        200: z.object({ credits: z.number() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },

  // AI Models
  models: {
    list: {
      method: 'GET' as const,
      path: '/api/models',
      responses: {
        200: z.array(z.custom<typeof aiModels.$inferSelect>()),
      },
    },
    imageModels: {
      method: 'GET' as const,
      path: '/api/models/image',
      responses: {
        200: z.array(z.custom<typeof aiModels.$inferSelect>()),
      },
    },
    videoModels: {
      method: 'GET' as const,
      path: '/api/models/video',
      responses: {
        200: z.array(z.custom<typeof aiModels.$inferSelect>()),
      },
    },
  },

  // Apps
  apps: {
    list: {
      method: 'GET' as const,
      path: '/api/apps',
      responses: {
        200: z.array(z.custom<typeof apps.$inferSelect>()),
      },
    },
  },

  // Inspirations
  inspirations: {
    list: {
      method: 'GET' as const,
      path: '/api/inspirations',
      responses: {
        200: z.array(z.custom<typeof inspirations.$inferSelect>()),
      },
    },
  },

  // Credit Packages
  packages: {
    list: {
      method: 'GET' as const,
      path: '/api/packages',
      responses: {
        200: z.array(z.custom<typeof creditPackages.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
