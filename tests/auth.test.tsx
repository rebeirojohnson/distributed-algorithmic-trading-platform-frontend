import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/auth/session';
import { LoginPage } from '@/auth/AuthPages';

describe('login form', () => {
  it('shows validation feedback before submitting credentials', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </QueryClientProvider>,
    );
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
