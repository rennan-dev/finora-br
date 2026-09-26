import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import BottomNavigation from "./BottomNavigation";

function renderNavigation({ initialPath = "/home", ...props } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNavigation {...props} />
      <Routes>
        <Route path="/home" element={<div>Página de compras</div>} />
        <Route path="/invoices" element={<div>Página de faturas</div>} />
        <Route path="/charts" element={<div>Página de gráficos</div>} />
        <Route path="/profile" element={<div>Página de perfil</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("BottomNavigation", () => {
  it("exibe as abas na ordem Compras, Faturas, Nova transação, Gráficos e Perfil", () => {
    renderNavigation();

    const navigation = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(navigation).toBeInTheDocument();

    const labels = Array.from(navigation.querySelectorAll("button"))
      .map((button) => button.getAttribute("aria-label"))
      .filter((label) => label !== "Nova transação");

    expect(labels).toEqual(["Compras", "Faturas", "Gráficos", "Perfil"]);
    expect(screen.getByRole("button", { name: "Nova transação" })).toBeInTheDocument();
  });

  it("destaca a aba da rota atual", () => {
    renderNavigation({ initialPath: "/charts" });

    expect(screen.getByRole("button", { name: "Gráficos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Compras" })).not.toHaveAttribute("aria-current");
  });

  it("navega para outra página ao tocar na aba", async () => {
    const user = userEvent.setup();
    renderNavigation();

    await user.click(screen.getByRole("button", { name: "Faturas" }));

    expect(screen.getByText("Página de faturas")).toBeInTheDocument();
  });

  it("abre o menu de nova transação no botão central", async () => {
    const user = userEvent.setup();
    const onAddCreditExpense = vi.fn();
    renderNavigation({ onAddCreditExpense });

    await user.click(screen.getByRole("button", { name: "Nova transação" }));
    await user.click(await screen.findByText("Novo Crédito"));

    expect(onAddCreditExpense).toHaveBeenCalledTimes(1);
  });
});
