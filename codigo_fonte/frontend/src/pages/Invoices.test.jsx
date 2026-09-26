import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Invoices from "./Invoices";
import { useTransactions } from "@/components/TransactionProvider";

vi.mock("@/components/Layout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/InvoiceDetailsDialog", () => ({
  default: () => null,
}));

vi.mock("@/components/TransactionProvider", () => ({
  useTransactions: vi.fn(),
}));

const openInvoicePayment = vi.fn();
const openEditExpense = vi.fn();
const deleteExpense = vi.fn();

function mockTransactions(invoices) {
  useTransactions.mockReturnValue({
    invoices,
    openInvoicePayment,
    openEditExpense,
    deleteExpense,
  });
}

const openInvoice = {
  id: 10,
  status: "open",
  reference_month: 8,
  reference_year: 2026,
  cycle: 1,
  total_amount: 120,
  payment_method: { id: 1, name: "Conta principal" },
};

const paidInvoice = {
  id: 9,
  status: "paid",
  reference_month: 7,
  reference_year: 2026,
  cycle: 1,
  total_amount: 80,
  paid_at: "2026-08-10T12:00:00.000000Z",
  payment_method: { id: 1, name: "Conta principal" },
  paid_from_payment_method: { id: 1, name: "Conta principal" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Invoices", () => {
  it("separa faturas abertas das fechadas", () => {
    mockTransactions([openInvoice, paidInvoice]);

    render(<Invoices />);

    expect(screen.getByText("Faturas abertas")).toBeInTheDocument();
    expect(screen.getByText("Faturas fechadas")).toBeInTheDocument();

    expect(screen.getByText("Total: R$ 120.00")).toBeInTheDocument();
    expect(screen.getByText("08/2026")).toBeInTheDocument();
    expect(screen.getByText("07/2026")).toBeInTheDocument();
    expect(screen.getByText(/Paga em 10\/08\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Pago com Conta principal/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Ver compras/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Pagar fatura/ })).toHaveLength(1);
  });

  it("permite pagar uma fatura aberta específica", async () => {
    const user = userEvent.setup();
    mockTransactions([openInvoice]);

    render(<Invoices />);

    await user.click(screen.getByRole("button", { name: /Pagar fatura/ }));

    expect(openInvoicePayment).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
  });

  it("avisa quando não há faturas", () => {
    mockTransactions([]);

    render(<Invoices />);

    expect(screen.getByText("Nenhuma fatura aberta no momento.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma fatura fechada até agora.")).toBeInTheDocument();
  });
});
