import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import ProtectedRoutes from "@/components/ProtectedRoutes";
import Home from "./Home";

vi.mock("@/lib/api", () => ({
  api: vi.fn((path) => {
    if (path.startsWith("/dashboard/summary")) {
      return Promise.resolve({ data: { credit: 0, debit: 0, deposit: 0 } });
    }
    if (path.startsWith("/dashboard/evolution")) {
      return Promise.resolve({ data: { monthly: [], daily: [] } });
    }
    if (path.startsWith("/dashboard")) {
      return Promise.resolve({ data: { balance: 0, payment_methods: [], invoices: [] } });
    }
    return Promise.resolve({ data: [] });
  }),
  isAuthenticated: () => true,
  getStoredUser: () => ({ username: "rennan" }),
  clearSession: vi.fn(),
  saveSession: vi.fn(),
  getPaymentMethods: vi.fn(() => Promise.resolve([])),
  setCachedPaymentMethods: vi.fn(),
}));

function renderHome() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route element={<ProtectedRoutes />}>
            <Route path="/home" element={<Home />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Home (aba Compras)", () => {
  it("renderiza dentro do TransactionProvider, junto com a Bottom Navigation", async () => {
    renderHome();

    expect(await screen.findByRole("heading", { name: "Compras" })).toBeInTheDocument();
    expect(screen.getByText("Saldo disponível")).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(navigation).getByRole("button", { name: "Nova transação" })).toBeInTheDocument();
    expect(within(navigation).getByRole("button", { name: "Faturas" })).toBeInTheDocument();
  });
});
