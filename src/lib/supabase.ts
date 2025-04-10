
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://diqgzibwnkruowmyaonf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcWd6aWJ3bmtydW93bXlhb25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNDg4MzUsImV4cCI6MjA1OTgyNDgzNX0.zXj2KYqs4sz72aNhthx9L6FYtV8s9cfTNC4XCjGcyYc';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;
