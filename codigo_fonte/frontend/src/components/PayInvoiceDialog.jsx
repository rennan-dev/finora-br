import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PayInvoiceDialog({ open, onOpenChange, paymentMethods, invoices, onConfirmPayment }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [payingMethodId, setPayingMethodId] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const initializedForCurrentOpen = useRef(false);
  const payableMethods = useMemo(
    () => paymentMethods,
    [paymentMethods]
  );
  const openInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "open"),
    [invoices]
  );
  const selectedInvoice = openInvoices.find((invoice) => invoice.id.toString() === invoiceId);
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    if (!open) {
      initializedForCurrentOpen.current = false;
      setIsPaying(false);
      return;
    }

    if (!initializedForCurrentOpen.current) {
      const favorite = payableMethods.find((method) => method.is_favorite);
      setPayingMethodId(favorite ? favorite.id.toString() : "");
      setInvoiceId("");
      initializedForCurrentOpen.current = true;
    }
  }, [open, payableMethods]);

  const handlePayment = async () => {
    if (!payingMethodId || !selectedInvoice || selectedInvoice.total_amount <= 0) return;

    setIsPaying(true);
    const paid = await onConfirmPayment(selectedInvoice.id, {
      payment_method_id: Number(payingMethodId),
      transaction_date: today,
    });

    setIsPaying(false);
    if (paid) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagar Fatura de Cartão</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label>Fatura em aberto</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId} disabled={isPaying}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fatura..." />
              </SelectTrigger>
              <SelectContent>
                {openInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id.toString()}>
                    {invoice.payment_method?.name} — {String(invoice.reference_month).padStart(2, "0")}/{invoice.reference_year}
                    {invoice.cycle > 1 && ` · Ciclo ${invoice.cycle}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
             <span className="text-sm font-medium">Total da Fatura:</span>
             <span className="text-xl font-bold text-primary">
               R$ {Number(selectedInvoice?.total_amount || 0).toFixed(2)}
             </span>
          </div>

          {/* Conta para Pagamento */}
          <div className="grid gap-2">
            <Label>Pagar usando saldo de:</Label>
            <Select value={payingMethodId} onValueChange={setPayingMethodId} disabled={isPaying}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {payableMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name} (R$ {parseFloat(method.balance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPaying}>Cancelar</Button>
          <Button onClick={handlePayment} disabled={isPaying || !selectedInvoice || selectedInvoice.total_amount <= 0 || !payingMethodId}>
            {isPaying ? "Pagando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}