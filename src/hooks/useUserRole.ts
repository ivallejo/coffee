import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'cashier' | 'supervisor';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    created_by: string | null;
}

export function useUserRole() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        // Get initial session securely
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user ?? null);
            if (user) {
                loadUserProfile(user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setProfile(null);
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setProfile(data);
            setRole(data.role as UserRole);
        } catch (error) {
            console.error('Error loading user profile:', error);
            setProfile(null);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = role === 'admin';
    const isCashier = role === 'cashier';
    const isSupervisor = role === 'supervisor';

    return {
        user,
        profile,
        role,
        isAdmin,
        isCashier,
        isSupervisor,
        loading,
        refetch: () => user && loadUserProfile(user.id),
    };
}

// Hook to get all users (admin only)
export function useUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return {
        users,
        loading,
        refetch: loadUsers,
    };
}

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole | null, requiredRole: UserRole): boolean {
    if (!userRole) return false;

    const roleHierarchy: Record<UserRole, number> = {
        admin: 3,
        supervisor: 2,
        cashier: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
