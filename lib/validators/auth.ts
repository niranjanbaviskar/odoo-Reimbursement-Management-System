import { z } from "zod";

export const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const signUpSchema = z.object({
    companyName: z.string().min(2),
    adminName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    country: z.string().min(2),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
