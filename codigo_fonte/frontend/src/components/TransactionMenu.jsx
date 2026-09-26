import React from "react";
import {
  TrendingUp,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  FileText,
  Barcode,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Itens de criação de transações compartilhados entre o botão flutuante do
 * desktop e o botão central da Bottom Navigation Bar.
 */
function TransactionMenu({
  side = "bottom",
  align = "end",
  className,
  onAddDeposit,
  onAddExpense,
  onAddCreditExpense,
  onAddTransfer,
  onPayInvoice,
  onAddBoleto,
  onAddPaymentMethod,
  onAddRecurringExpense,
  onManageRecurringExpenses,
}) {
  return (
    <DropdownMenuContent side={side} align={align} className={cn("w-56", className)}>
      <DropdownMenuItem onClick={onAddDeposit} className="cursor-pointer gap-2 p-3">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <span>Novo Depósito (Entrada)</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddExpense} className="cursor-pointer gap-2 p-3">
        <Banknote className="h-4 w-4 text-green-500" />
        <span>Novo Débito</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddCreditExpense} className="cursor-pointer gap-2 p-3">
        <CreditCard className="h-4 w-4 text-blue-500" />
        <span>Novo Crédito</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddTransfer} className="cursor-pointer gap-2 p-3">
        <ArrowRightLeft className="h-4 w-4 text-orange-500" />
        <span>Transferência</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onPayInvoice} className="cursor-pointer gap-2 p-3">
        <FileText className="h-4 w-4 text-purple-500" />
        <span>Pagamento de Fatura</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddBoleto} className="cursor-pointer gap-2 p-3">
        <Barcode className="h-4 w-4 text-red-500" />
        <span>Pagar Boleto</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddRecurringExpense} className="cursor-pointer gap-2 p-3">
        <RefreshCw className="h-4 w-4 text-cyan-500" />
        <span>Nova Despesa Fixa</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onManageRecurringExpenses} className="cursor-pointer gap-2 border-t p-3">
        <Wallet className="h-4 w-4 text-indigo-500" />
        <span>Gerenciar Despesas Fixas</span>
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddPaymentMethod} className="cursor-pointer gap-2 border-t p-3">
        <Wallet className="h-4 w-4 text-orange-500" />
        <span>Novo Cartão/Conta</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export default TransactionMenu;
