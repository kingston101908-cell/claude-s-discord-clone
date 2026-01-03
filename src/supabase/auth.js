import { supabase } from './client';

// Sign up with email and password
export async function signUpWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { data: null, error: error.message };
    }
}

// Sign in with email and password
export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { data: null, error: error.message };
    }
}

// Sign out
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { error: error.message };
    }
}

// Subscribe to auth state changes
export function subscribeToAuthChanges(callback) {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        callback(session?.user || null);
    });

    // Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            callback(session?.user || null);
        }
    );

    return () => subscription.unsubscribe();
}

// Get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
