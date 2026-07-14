import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("recharts", () => {
  const Container = ({ children }) => <div>{children}</div>;

  return {
    CartesianGrid: Container,
    Cell: () => null,
    Legend: Container,
    Line: () => null,
    LineChart: Container,
    Pie: Container,
    PieChart: Container,
    ResponsiveContainer: Container,
    Tooltip: Container,
    XAxis: () => null,
    YAxis: () => null,
  };
});

vi.mock("@/components/ExpenseList", () => ({
  default: ({ expenses }) => (
    <div data-testid="expenses">{expenses.map((expense) => expense.description).join(", ")}</div>
  ),
}));

vi.mock("@/components/MonthSelector", () => ({
  default: () => <div>Seletor de mês</div>,
}));

vi.mock("@/components/UpdateBalanceDialog", () => ({
  default: () => null,
}));

afterEach(() => vi.useRealTimers());

describe("Dashboard", () => {
  it("shows credit purchases in their transaction month and the next open invoice", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));

    render(
      <Dashboard
        expenses={[
          {
            id: 1,
            description: "Compra de julho",
            amount: 100,
            type: "credit",
            transaction_date: "2026-07-13",
            invoice: { reference_month: 8, reference_year: 2026 },
          },
        ]}
        invoices={[
          {
            id: 10,
            reference_month: 8,
            reference_year: 2026,
            status: "open",
            total_amount: 100,
          },
        ]}
        paymentMethods={[]}
        totalBalance={0}
        onUpdateBalance={vi.fn()}
        onEditExpense={vi.fn()}
        onDeleteExpense={vi.fn()}
      />
    );

    expect(screen.getByTestId("expenses")).toHaveTextContent("Compra de julho");
    expect(screen.getByText("Fatura aberta — 08/2026")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 100.00").length).toBeGreaterThan(0);
  });
});
