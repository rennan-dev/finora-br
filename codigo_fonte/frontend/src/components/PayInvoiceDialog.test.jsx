import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PayInvoiceDialog from "./PayInvoiceDialog";

const paymentMethods = [
  { id: 1, name: "Conta principal", balance: 1000, is_favorite: true },
];

const invoices = [
  {
    id: 10,
    status: "open",
    reference_month: 8,
    reference_year: 2026,
    total_amount: 120,
    payment_method: { id: 1, name: "Conta principal" },
  },
];

describe("PayInvoiceDialog", () => {
  it("preserves the selected invoice when methods refresh", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PayInvoiceDialog
        open
        onOpenChange={vi.fn()}
        paymentMethods={paymentMethods}
        invoices={invoices}
        onConfirmPayment={vi.fn()}
      />
    );

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(screen.getByText("Conta principal — 08/2026"));
    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("Conta principal — 08/2026");

    rerender(
      <PayInvoiceDialog
        open
        onOpenChange={vi.fn()}
        paymentMethods={[...paymentMethods]}
        invoices={invoices}
        onConfirmPayment={vi.fn()}
      />
    );

    expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("Conta principal — 08/2026");
  });

  it("waits for a successful payment before closing", async () => {
    const user = userEvent.setup();
    let resolvePayment;
    const onConfirmPayment = vi.fn(() => new Promise((resolve) => {
      resolvePayment = resolve;
    }));
    const onOpenChange = vi.fn();

    render(
      <PayInvoiceDialog
        open
        onOpenChange={onOpenChange}
        paymentMethods={paymentMethods}
        invoices={invoices}
        onConfirmPayment={onConfirmPayment}
      />
    );

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(screen.getByText("Conta principal — 08/2026"));
    await user.click(screen.getByRole("button", { name: "Confirmar Pagamento" }));

    expect(screen.getByRole("button", { name: "Pagando..." })).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();

    resolvePayment(true);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
