import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string({ message: "Missing email or invalid email format." })
    .email({ message: "Invalid email format." })
    .min(1, { message: "Email is a required field." }),
  password: z
    .string({ message: "Missing password or invalid password format." })
    .min(8, { message: "Password length must be 8 characters or more." })
    .max(64, { message: "Password length must be 64 characters or less." }),
});

export { loginSchema };
