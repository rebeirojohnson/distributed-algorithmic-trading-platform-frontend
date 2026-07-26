import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { OrderTicket } from '@/orders/OrderTicket';

describe('order ticket', () => {
  it('requires limit price for limit orders', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OrderTicket />
      </QueryClientProvider>,
    );
    await userEvent.selectOptions(screen.getByLabelText(/order type/i), 'LIMIT');
    await userEvent.click(screen.getByRole('button', { name: /submit order/i }));
    expect(await screen.findByText(/price is required/i)).toBeInTheDocument();
  });
});
