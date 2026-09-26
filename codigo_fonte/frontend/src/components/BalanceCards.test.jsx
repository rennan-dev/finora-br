import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BalanceCards from "./BalanceCards";

describe("BalanceCards", () => {
  it("mostra os cartões com o dinheiro disponível e a próxima fatura aberta", () => {
    render(
      <BalanceCards
        dashboard={{
          balance: 150,
          payment_methods: [
            { id: 1, name: "Conta principal", balance: 100 },
            { id: 2, name: "Carteira", balance: 50 },
          ],
          invoices: [
            { id: 10, reference_month: 8, reference_year: 2026, status: "open", total_amount: 100 },
            { id: 9, reference_month: 7, reference_year: 2026, status: "open", total_amount: 999 },
            { id: 8, reference_month: 8, reference_year: 2026, status: "paid", total_amount: 500 },
          ],
        }}
        summary={{ credit: 0, debit: 30, deposit: 200 }}
        selectedMonth={new Date(2026, 6, 15)}
        onSelectMethod={vi.fn()}
      />
    );

    expect(screen.getByText("Conta principal")).toBeInTheDocument();
    expect(screen.getByText("Carteira")).toBeInTheDocument();
    expect(screen.getByText("R$ 150.00")).toBeInTheDocument();

    expect(screen.getByText("Fatura aberta — 08/2026")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 100.00").length).toBeGreaterThan(0);

    expect(screen.getByText("Débito e boletos")).toBeInTheDocument();
    expect(screen.getByText("R$ 30.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 200.00")).toBeInTheDocument();

    expect(screen.queryByText("R$ 999.00")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 500.00")).not.toBeInTheDocument();
  });

  it("avisa quando não há cartões cadastrados", () => {
    render(
      <BalanceCards
        dashboard={{ balance: 0, payment_methods: [], invoices: [] }}
        summary={{ credit: 0, debit: 0, deposit: 0 }}
        selectedMonth={new Date(2026, 6, 15)}
        onSelectMethod={vi.fn()}
      />
    );

    expect(screen.getByText(/Nenhum cartão ou conta cadastrado/)).toBeInTheDocument();
  });
});
