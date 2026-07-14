import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/Login";
import CreateAccount from "@/pages/CreateAccount";
import SendRecoveryEmail from "@/pages/SendRecoveryEmail";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import { RequireAuth } from "@/components/RequireAuth";

const Home = lazy(() => import("@/pages/Home"));
const Cards = lazy(() => import("@/pages/Cards"));
const CardDetails = lazy(() => import("./pages/CardDetails"));

function App() {
  return (
    <>
      <Suspense fallback={<div className="grid min-h-screen place-items-center">Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/recovery-email-sent" element={<SendRecoveryEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Rotas protegidas */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route
          path="/cards"
          element={
            <RequireAuth>
              <Cards />
            </RequireAuth>
          }
        />

        <Route
          path="/cards/:id"
          element={
            <RequireAuth>
              <CardDetails />
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;