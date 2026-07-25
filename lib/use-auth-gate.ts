"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

/**
 * Padrão repetido em toda a app: uma acção que chama uma API protegida
 * deve pedir login (AuthModal) em vez de deixar a API devolver
 * "Autenticação necessária." sem explicação. `withAuth` verifica a sessão
 * antes de correr a acção; se não houver sessão, guarda a acção, mostra o
 * AuthModal, e corre-a assim que o login tiver sucesso.
 */
export function useAuthGate() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const withAuth = useCallback((acao: () => void) => {
    if (!user) { setPendingAction(() => acao); setShowAuth(true); return; }
    acao();
  }, [user]);

  const onAuthSuccess = useCallback(() => {
    setShowAuth(false);
    setPendingAction((prev) => {
      if (prev) prev();
      return null;
    });
  }, []);

  const onAuthClose = useCallback(() => {
    setShowAuth(false);
    setPendingAction(null);
  }, []);

  return { user, withAuth, showAuth, onAuthSuccess, onAuthClose };
}
