import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MovementsSection from "./MovementsSection";

vi.mock("@/components/ExpenseList", () => ({
  expenseLabels: {
    credit: "Crédito",
    debit: "Débito",
    deposit: "Depósito",
    transfer: "Transferência",
    boleto: "Boleto",
    fixed_expense: "Despesa Fixa",
    invoice_payment: "Pagamento de fatura",
  },
  default: ({ expenses }) => (
    <div data-testid="expenses">{expenses.map((expense) => expense.description).join(", ")}</div>
  ),
}));

describe("MovementsSection", () => {
  it("lista as movimentações do mês selecionado", () => {
    render(
      <MovementsSection
        expenses={[
          { id: 1, description: "Compra de julho", type: "credit", payment_method: { id: 1 } },
          { id: 2, description: "Débito de julho", type: "debit", payment_method: { id: 2 } },
        ]}
        paymentMethods={[
          { id: 1, name: "Conta principal" },
          { id: 2, name: "Carteira" },
        ]}
        selectedMonth={new Date(2026, 6, 15)}
        onMonthChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMarkAsPaid={vi.fn()}
      />
    );

    expect(screen.getByTestId("expenses")).toHaveTextContent("Compra de julho, Débito de julho");
    expect(screen.getAllByText("julho de 2026").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Exportar PDF/ })).toBeInTheDocument();
  });

  it("mostra o total filtrado no botão de filtros", () => {
    render(
      <MovementsSection
        expenses={[
          { id: 1, description: "Compra de julho", type: "credit", payment_method: { id: 1 } },
        ]}
        paymentMethods={[{ id: 1, name: "Conta principal" }]}
        selectedMonth={new Date(2026, 6, 15)}
        onMonthChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onMarkAsPaid={vi.fn()}
      />
    );

    expect(screen.getAllByRole("button", { name: "(1)" }).length).toBeGreaterThan(0);
  });
});
