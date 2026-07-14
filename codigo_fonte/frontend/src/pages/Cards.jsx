import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/Layout";
import EditPaymentMethodDialog from "@/components/EditPaymentMethodDialog";
import { api, getPaymentMethods, setCachedPaymentMethods } from "@/lib/api";

function Cards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [methods, setMethods] = useState([]);
  const [editing, setEditing] = useState(null);

  const loadMethods = useCallback(async () => {
    try {
      setMethods(await getPaymentMethods());
    } catch (error) {
      toast({ title: "Erro ao buscar cartões", description: error.message, variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const saveMethod = async (id, payload) => {
    try {
      const response = await api(`/payment-methods/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      const updatedMethods = methods.map((method) => {
        if (method.id === response.data.id) return response.data;
        return response.data.is_favorite ? { ...method, is_favorite: false } : method;
      });
      setMethods(updatedMethods);
      setCachedPaymentMethods(updatedMethods);
      setEditing(null);
      toast({ title: "Método atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Não foi possível atualizar", description: error.message, variant: "destructive" });
    }
  };

  const deactivateMethod = async (method) => {
    if (!window.confirm(`Desativar "${method.name}"? O histórico será preservado.`)) return;
    try {
      await api(`/payment-methods/${method.id}`, { method: "DELETE" });
      const updatedMethods = methods.filter((item) => item.id !== method.id);
      setMethods(updatedMethods);
      setCachedPaymentMethods(updatedMethods);
      toast({ title: "Método desativado." });
    } catch (error) {
      toast({ title: "Não foi possível desativar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/20 to-muted px-4 py-10">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <Button variant="ghost" onClick={() => navigate("/home")} className="gap-2">
            <ArrowLeft className="h-5 w-5" /> Voltar para home
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Cartões e contas</h1>
            <p className="text-sm text-muted-foreground">Defina um método favorito para agilizar novas transações.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {methods.map((method) => (
              <article key={method.id} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold">{method.name}</h2>
                    <p className="text-sm text-muted-foreground">Disponível para todas as transações</p>
                  </div>
                  {method.is_favorite && <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />}
                </div>
                <p className="my-5 text-2xl font-bold">R$ {Number(method.balance).toFixed(2)}</p>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => setEditing(method)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="destructive" onClick={() => deactivateMethod(method)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <EditPaymentMethodDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        paymentMethod={editing}
        onSave={saveMethod}
      />
    </Layout>
  );
}

export default Cards;
