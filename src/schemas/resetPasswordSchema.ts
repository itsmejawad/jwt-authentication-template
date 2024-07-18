import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password length must be 8 characters or more.' })
      .max(64, { message: 'Password length must be 64 characters or less.' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Password length must be 8 characters or more.' })
      .max(64, { message: 'Password length must be 64 characters or less.' }),
  })
  .refine((data) => data.confirmPassword === data.password, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export { resetPasswordSchema };
