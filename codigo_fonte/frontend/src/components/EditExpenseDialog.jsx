import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function EditExpenseDialog({ open, onOpenChange, onSave, paymentMethods, expense }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [invoiceReferenceMonth, setInvoiceReferenceMonth] = useState("");
  const [invoiceReferenceYear, setInvoiceReferenceYear] = useState("");

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || "");
      
      setAmount(expense.amount || "");

      if (expense.transaction_date) {
        try {
          setDate(expense.transaction_date);
        } catch (e) {
          console.error("Erro ao formatar data", e);
          setDate("");
        }
      }

      if (expense.payment_method_id) {
        setSelectedPaymentMethod(expense.payment_method_id.toString());
      }
      if (expense.type === "credit") {
        const reference = expense.invoice
          ? new Date(expense.invoice.reference_year, expense.invoice.reference_month - 1, 1)
          : new Date(`${expense.transaction_date}T00:00:00`);

        if (!expense.invoice) reference.setMonth(reference.getMonth() + 1);

        setInvoiceReferenceMonth(String(reference.getMonth() + 1));
        setInvoiceReferenceYear(String(reference.getFullYear()));
      }
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedExpense = {
      ...expense,
      description,
      amount: parseFloat(amount),
      transaction_date: date,
      payment_method_id: Number(selectedPaymentMethod),
      ...(expense.type === "credit" ? {
        invoice_reference_month: Number(invoiceReferenceMonth),
        invoice_reference_year: Number(invoiceReferenceYear),
      } : {})
    };

    onSave(updatedExpense);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Valor</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Data</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-paymentMethod">Método de Pagamento</Label>
            <Select
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {expense?.type === "credit" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-invoice-month">Mês da fatura</Label>
                <Select value={invoiceReferenceMonth} onValueChange={setInvoiceReferenceMonth}>
                  <SelectTrigger id="edit-invoice-month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-invoice-year">Ano da fatura</Label>
                <Input
                  id="edit-invoice-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={invoiceReferenceYear}
                  onChange={(event) => setInvoiceReferenceYear(event.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditExpenseDialog;