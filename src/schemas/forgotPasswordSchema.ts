import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Missing email or invalid email format.' })
    .email({ message: 'Invalid email format.' })
    .min(1, { message: 'Email is a required field.' }),
});

export { forgotPasswordSchema };
