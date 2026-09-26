import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, BarChart3, CreditCard, Plus, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TransactionMenu from "@/components/TransactionMenu";
import { cn } from "@/lib/utils";

export const bottomNavigationTabs = [
  { label: "Compras", path: "/home", icon: ArrowLeftRight },
  { label: "Faturas", path: "/invoices", icon: CreditCard },
  { label: "Gráficos", path: "/charts", icon: BarChart3 },
  { label: "Perfil", path: "/profile", icon: UserCircle },
];

/**
 * Bottom Navigation Bar exibida apenas no mobile (até md).
 * Ordem: Compras | Faturas | Nova transação | Gráficos | Perfil
 */
function BottomNavigation({ onAddDeposit, onAddExpense, onAddCreditExpense, onAddTransfer, onPayInvoice, onAddBoleto, onAddPaymentMethod, onAddRecurringExpense, onManageRecurringExpenses }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const renderTab = (tab) => {
    const Icon = tab.icon;
    const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);

    return (
      <button
        key={tab.path}
        type="button"
        aria-label={tab.label}
        aria-current={isActive ? "page" : undefined}
        onClick={() => navigate(tab.path)}
        className={cn(
          "flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
        <span className="truncate">{tab.label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
        {renderTab(bottomNavigationTabs[0])}
        {renderTab(bottomNavigationTabs[1])}

        <div className="flex h-full items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Nova transação"
                className="-mt-9 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                <Plus className="h-7 w-7" />
              </button>
            </DropdownMenuTrigger>
            <TransactionMenu
              side="top"
              align="center"
              onAddDeposit={onAddDeposit}
              onAddExpense={onAddExpense}
              onAddCreditExpense={onAddCreditExpense}
              onAddTransfer={onAddTransfer}
              onPayInvoice={onPayInvoice}
              onAddBoleto={onAddBoleto}
              onAddPaymentMethod={onAddPaymentMethod}
              onAddRecurringExpense={onAddRecurringExpense}
              onManageRecurringExpenses={onManageRecurringExpenses}
            />
          </DropdownMenu>
        </div>

        {renderTab(bottomNavigationTabs[2])}
        {renderTab(bottomNavigationTabs[3])}
      </div>
    </nav>
  );
}

export default BottomNavigation;
