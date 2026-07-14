import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

function AddTransferDialog({ open, onOpenChange, onAddTransfer, paymentMethods }) {
  const [sourceMethod, setSourceMethod] = useState("");
  const [destMethod, setDestMethod] = useState("");
  const compatibleMethods = useMemo(
    () => paymentMethods,
    [paymentMethods]
  );
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    if (!open) return;

    const favorite = compatibleMethods.find((method) => method.is_favorite);
    setSourceMethod(favorite ? favorite.id.toString() : "");
    setDestMethod("");
  }, [open, compatibleMethods]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sourceMethod === destMethod) {
      alert("A conta de origem e destino não podem ser a mesma.");
      return;
    }

    const formData = new FormData(e.target);
    const transferData = {
      description: formData.get("description"),
      amount: parseFloat(formData.get("amount")),
      transaction_date: formData.get("transaction_date"),
      payment_method_id: Number(sourceMethod),
      destination_payment_method_id: Number(destMethod),
      type: "transfer",
    };

    onAddTransfer(transferData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferência entre Contas
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Opcional</Label>
            <Input id="description" name="description" placeholder="Ex: Guardar dinheiro" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="transaction_date" type="date" defaultValue={today} required />
          </div>

          <div className="space-y-2">
            <Label>Conta de Origem (Sai o dinheiro)</Label>
            <Select value={sourceMethod} onValueChange={setSourceMethod} required>
              <SelectTrigger><SelectValue placeholder="Selecione de onde sai" /></SelectTrigger>
              <SelectContent>
                {compatibleMethods.map((m) => (
                  <SelectItem key={`src-${m.id}`} value={m.id.toString()}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta de Destino (Entra o dinheiro)</Label>
            <Select value={destMethod} onValueChange={setDestMethod} required>
              <SelectTrigger><SelectValue placeholder="Selecione para onde vai" /></SelectTrigger>
              <SelectContent>
                {compatibleMethods.map((m) => (
                  <SelectItem key={`dst-${m.id}`} value={m.id.toString()}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">Realizar Transferência</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddTransferDialog;