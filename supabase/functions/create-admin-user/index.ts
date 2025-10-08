import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Creating admin user...');

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Error checking existing users:', checkError);
      throw checkError;
    }

    const adminEmail = 'info@almanaturalbeauty.it';
    const userExists = existingUser.users.some(user => user.email === adminEmail);

    if (userExists) {
      console.log('Admin user already exists');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Utente admin già esistente. Puoi accedere direttamente.',
          alreadyExists: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create the admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: 'adminutente11@',
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      throw createError;
    }

    console.log('Admin user created successfully:', newUser.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Utente admin creato con successo! Ora puoi accedere.',
        userId: newUser.user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-admin-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
