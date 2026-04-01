import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dsxmuhrnngoypklipvqx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeG11aHJubmdveXBrbGlwdnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzU5NzAsImV4cCI6MjA5MDA1MTk3MH0.8cl_DF38WP4I5kt0XwOwj8H30_ekeK8SgWrDwBW0XNw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);