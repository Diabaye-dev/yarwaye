/* ============================================================================
 *  FICHIER : src/context/AuthContext.tsx
 *  LANGAGE : TypeScript + JSX (React)
 *  RÔLE    : Gestion de l'AUTHENTIFICATION et de la SESSION utilisateur.
 *
 *  Un "Context" React, c'est un distributeur automatique de données :
 *  au lieu de passer l'utilisateur connecté en paramètre de composant en
 *  composant, n'importe quel composant peut l'utiliser avec useAuth().
 *
 *  Fonctions principales :
 *    - fetchUsers()     → récupère la liste du personnel depuis /api/auth
 *    - loginAs(userId)  → change d'utilisateur (propriétaire / caissier...)
 *    - registerUser()   → ajoute un nouveau membre au personnel
 *    - logout()         → se déconnecte
 *
 *  L'identifiant de l'utilisateur connecté est conservé dans le localStorage
 *  du navigateur pour rester connecté même après un rafraîchissement.
 * ==========================================================================*/

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  usersList: User[];
  isLoading: boolean;
  loginAs: (userId: number) => Promise<void>;
  logout: () => void;
  registerUser: (data: { name: string; email: string; role: string; phone?: string }) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);

        // Load saved session from localStorage or default to Yarwaye (Owner)
        const savedUserId = localStorage.getItem("yarwaye_user_id");
        if (savedUserId) {
          const found = data.users?.find((u: User) => u.id === Number(savedUserId));
          if (found) {
            setUser(found);
            return;
          }
        }

        // Default to Yarwaye (owner) or first user
        if (data.users && data.users.length > 0) {
          const owner = data.users.find((u: User) => u.role === "owner") || data.users[0];
          setUser(owner);
          localStorage.setItem("yarwaye_user_id", String(owner.id));
        }
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const loginAs = async (userId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("yarwaye_user_id", String(data.user.id));
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("yarwaye_user_id");
  };

  const registerUser = async (data: { name: string; email: string; role: string; phone?: string }) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "register" }),
      });
      if (res.ok) {
        const json = await res.json();
        await fetchUsers();
        setUser(json.user);
        localStorage.setItem("yarwaye_user_id", String(json.user.id));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        usersList,
        isLoading,
        loginAs,
        logout,
        registerUser,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
