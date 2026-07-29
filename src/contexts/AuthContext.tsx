"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, type Profile } from "@/lib/supabase/profile";
import type { User } from "@supabase/supabase-js";

export interface Company {
  id: number;
  name: string;
  rubro: string | null;
  culture: string | null;
  description: string | null;
  country: string | null;
  website: string | null;
  logo: string | null;
  size: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: string, company?: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isAuthenticated: boolean;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchCompany = async (): Promise<Company | null> => {
  try {
    const res = await fetch("/api/company");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCompany = useCallback(async () => {
    const c = await fetchCompany();
    setCompany(c);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        getProfile(user.id).then(setProfile).catch(() => setProfile(null));
        fetchCompany().then(setCompany);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setUser(user);
        if (user) {
          getProfile(user.id).then(setProfile).catch(() => setProfile(null));
          fetchCompany().then(setCompany);
        } else {
          setProfile(null);
          setCompany(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, name: string, role = "growth_manager", company = "") => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role, company },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updatePassword = async (password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  return (
      <AuthContext.Provider
        value={{
          user,
          profile,
          company,
          isLoading,
          login,
          signup,
          logout,
          updatePassword,
          isAuthenticated: !!user,
          refreshCompany,
        }}
      >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
