import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { TransactionProvider } from "@/components/TransactionProvider";

/**
 * Agrupa as rotas autenticadas. Fica acima das páginas para que o
 * TransactionProvider (dados globais, diálogos e Bottom Navigation Bar)
 * envolva todas elas.
 */
function ProtectedRoutes() {
  return (
    <RequireAuth>
      <TransactionProvider>
        <Suspense fallback={<div className="grid min-h-screen place-items-center">Carregando...</div>}>
          <Outlet />
        </Suspense>
      </TransactionProvider>
    </RequireAuth>
  );
}

export default ProtectedRoutes;
