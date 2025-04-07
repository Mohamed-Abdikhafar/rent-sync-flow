
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://icwxoqiqgpihlogdftvo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd3hvcWlxZ3BpaGxvZ2RmdHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDIxNTcsImV4cCI6MjA1OTUxODE1N30.msLVgv7Etaz6vtwHHzccWLeV8ImzaedmFNXYOsUMTwg';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
