import { z } from 'zod';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Name must be 1 character or more.' })
      .max(124, { message: 'Name must be 124 characters or less.' }),
    email: z
      .string()
      .email({ message: 'Invalid email format.' })
      .min(1, { message: 'Email is a required field.' }),
    photo: z.string().optional(),
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

const loginSchema = z.object({
  email: z
    .string({ message: 'Missing email or invalid email format.' })
    .email({ message: 'Invalid email format.' })
    .min(1, { message: 'Email is a required field.' }),
  password: z
    .string({ message: 'Missing password or invalid password format.' })
    .min(8, { message: 'Password length must be 8 characters or more.' })
    .max(64, { message: 'Password length must be 64 characters or less.' }),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Missing email or invalid email format.' })
    .email({ message: 'Invalid email format.' })
    .min(1, { message: 'Email is a required field.' }),
});

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

export { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
