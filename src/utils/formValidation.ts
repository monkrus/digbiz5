import * as yup from 'yup';

// Common validation schemas
export const emailSchema = yup
  .string()
  .email('Invalid email format')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .matches(/\d/, 'Password must contain at least one number')
  .required('Password is required');

// Example login form schema
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

// Example registration form schema
export const registerSchema = yup.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
