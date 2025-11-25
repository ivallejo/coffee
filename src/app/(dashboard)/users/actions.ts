'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        return { error: 'Error de configuración: Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Por favor agrégala a tu archivo .env.local' };
    }

    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const fullName = String(formData.get('fullName'));
    const role = String(formData.get('role'));

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Create user with auto-confirm
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });

    if (error) return { error: error.message };

    if (data.user) {
        // Give the trigger a moment to create the profile, or create it manually if needed.
        // Ideally, we update the profile that the trigger created.
        // We'll try to update immediately.

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ role, full_name: fullName })
            .eq('id', data.user.id);

        if (profileError) {
            console.error('Error updating profile role:', profileError);
            // If update failed, maybe profile doesn't exist yet? 
            // Let's try to upsert just in case trigger didn't fire or failed.
            await supabaseAdmin.from('profiles').upsert({
                id: data.user.id,
                email: email,
                full_name: fullName,
                role: role,
                is_active: true
            });
        }
    }

    revalidatePath('/users');
    return { success: true, message: 'Usuario creado exitosamente' };
}
