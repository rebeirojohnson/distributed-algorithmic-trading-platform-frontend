import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { login, register as registerUser } from '@/api/endpoints';
import { Button, Card, Field, Input } from '@/components/ui';
import { useAuth } from '@/auth/session';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

const registerSchema = loginSchema
  .extend({ confirmPassword: z.string().min(12, 'Password confirmation is required.') })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  })
  .refine((value) => value.password.length >= 12, {
    message: 'Password must be at least 12 characters.',
    path: ['password'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await login(values);
      auth.acceptAuthResponse(response);
      await navigate({ to: '/dashboard' });
    } catch (error) {
      form.setError('root', { message: error instanceof Error ? error.message : 'Login failed.' });
    }
  });

  return (
    <AuthFrame title="Access Terminal" subtitle="Sign in with your paper-trading credentials.">
      {auth.sessionExpiredReason && (
        <div
          className="mb-4 rounded border border-pending/30 bg-pending/10 p-3 text-sm text-pending"
          role="status"
        >
          Your session ended. Sign in again to continue.
        </div>
      )}
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        {form.formState.errors.root?.message && (
          <p className="text-sm text-sell" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Sign In
        </Button>
      </form>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    try {
      const response = await registerUser({ email, password });
      auth.acceptAuthResponse(response);
      await navigate({ to: '/dashboard' });
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Registration failed.',
      });
    }
  });

  return (
    <AuthFrame
      title="Create Account"
      subtitle="Register for the isolated paper-trading environment."
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        <Field label="Confirm Password" error={form.formState.errors.confirmPassword?.message}>
          <Input
            type="password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
        </Field>
        {form.formState.errors.root?.message && (
          <p className="text-sm text-sell" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Register
        </Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md" title={title}>
        <p className="mb-6 text-sm text-steel">{subtitle}</p>
        {children}
        <div className="mt-5 flex gap-3 text-sm text-steel">
          <a className="text-info hover:underline" href="/login">
            Login
          </a>
          <a className="text-info hover:underline" href="/register">
            Register
          </a>
        </div>
      </Card>
    </main>
  );
}
