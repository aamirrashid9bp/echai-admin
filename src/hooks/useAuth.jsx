import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

const MOCK_ADMIN_USER = {
  id: 'admin_usr_01',
  email: 'admin@echaii.com',
  full_name: 'Super Admin',
  role: 'admin',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('echaii_auth_user');
      return saved ? JSON.parse(saved) : MOCK_ADMIN_USER;
    } catch {
      return MOCK_ADMIN_USER;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check active Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user);
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchSupabaseProfile(session.user);
        } else {
          // If no session and was using Supabase auth
        }
      });

      return () => {
        listener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const fetchSupabaseProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (!error && data) {
        const fullProfile = {
          id: authUser.id,
          email: authUser.email,
          full_name: data.full_name || authUser.email.split('@')[0],
          role: data.role || 'staff',
        };
        setUser(fullProfile);
        localStorage.setItem('echaii_auth_user', JSON.stringify(fullProfile));
      } else {
        const fallback = {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.email.split('@')[0],
          role: 'staff',
        };
        setUser(fallback);
        localStorage.setItem('echaii_auth_user', JSON.stringify(fallback));
      }
    } catch {
      // fallback
    }
  };

  const login = async (email, password, roleChoice = 'admin') => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data?.user) {
          await fetchSupabaseProfile(data.user);
        }
        return { success: true };
      }

      // Local / Offline authentication simulation
      const loggedUser = {
        id: 'usr_' + Date.now(),
        email: email || 'admin@echaii.com',
        full_name: email ? email.split('@')[0] : 'Admin User',
        role: roleChoice || 'admin',
      };
      setUser(loggedUser);
      localStorage.setItem('echaii_auth_user', JSON.stringify(loggedUser));
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem('echaii_auth_user', JSON.stringify(updated));
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('echaii_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'staff',
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager' || user?.role === 'admin',
        isStaff: Boolean(user),
        isAuthenticated: Boolean(user),
        login,
        logout,
        switchRole,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
