import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: 'admin' | 'lp';
  is_approved: boolean;
}

interface AuthState {
  user: Profile | null;
  loading: boolean;
  setUser: (user: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<Profile>;
  signUp: (email: string, password: string, data: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  checkAdmin: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  
  signIn: async (email, password) => {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id);
    
    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      throw new Error('Profile not found');
    }

    const profile = profiles[0];
    set({ user: profile });
    return profile;
  },

  signUp: async (email, password, data) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...data,
          is_approved: data.role === 'admin',
        },
      },
    });
    if (signUpError) throw signUpError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        ...data,
        is_approved: data.role === 'admin',
      }]);

    if (profileError) throw profileError;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },

  checkAdmin: (code) => code === 'sert5656',
}));