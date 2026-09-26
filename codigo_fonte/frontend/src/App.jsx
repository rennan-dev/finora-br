import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import CreateAccount from "@/pages/CreateAccount";
import SendRecoveryEmail from "@/pages/SendRecoveryEmail";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import ProtectedRoutes from "@/components/ProtectedRoutes";

const Home = lazy(() => import("@/pages/Home"));
const Cards = lazy(() => import("@/pages/Cards"));
const CardDetails = lazy(() => import("./pages/CardDetails"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Charts = lazy(() => import("@/pages/Charts"));

function App() {
  return (
    <>
      <Suspense fallback={<div className="grid min-h-screen place-items-center">Carregando...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/recovery-email-sent" element={<SendRecoveryEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rotas protegidas: login obrigatório + TransactionProvider + Bottom Navigation Bar */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/cards/:id" element={<CardDetails />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/charts" element={<Charts />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
