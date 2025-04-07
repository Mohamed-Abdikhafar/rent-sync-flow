
# RentalSync Supabase Setup

This document contains instructions on how to properly set up your Supabase project for RentalSync.

## Steps to Connect and Initialize Your Supabase Project

1. **Log in to your Supabase Dashboard**
   - Go to https://supabase.com and log in to your account

2. **Create a New Project (if you haven't already)**
   - Click "New Project"
   - Enter a name (e.g., "RentalSync")
   - Set a secure database password
   - Choose a region close to your users
   - Click "Create new project"

3. **Run the SQL Setup Script**
   - In your Supabase dashboard, navigate to the "SQL Editor" tab
   - Copy and paste the entire contents of the `supabase_setup.sql` file
   - Click "Run" to execute the SQL script

4. **Set Up Authentication**
   - In the Supabase dashboard, go to "Authentication" → "Providers"
   - Make sure "Email" is enabled
   - Configure any other authentication providers you want to use

5. **Create a Service Role Key (for Admin Functions)**
   - Go to "Project Settings" → "API"
   - Under "Project API keys", find the "service_role" secret key
   - Store this securely as it gives full access to your database

6. **Verify Configuration in Your App**
   - The Supabase URL and anon key are already configured in `src/lib/supabase.ts`
   - If you created your project in a different region, you may need to update the URL

## Important Notes

- **Row Level Security (RLS)**: The setup script configures basic RLS policies. You may need to adjust these based on your specific security requirements.
- **Admin Functions**: Some features require the service_role key to function (like creating users). For production, these should be implemented as secure Edge Functions.
- **Initial Admin User**: You'll need to create an initial admin user via the registration page, then manually verify their account in the Supabase dashboard.

## Testing the Connection

After running the setup, you should be able to:

1. Register as an admin through the app
2. Log in with your admin credentials
3. Create properties and units
4. Add tenants who will receive invitation codes

If you encounter any issues, check the browser console for errors and verify that your Supabase URL and anon key are correct.
