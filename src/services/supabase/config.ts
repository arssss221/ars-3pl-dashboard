import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://swscllflkezvhlxdrwon.supabase.co';
const supabaseKey = 'sb_publishable_4fLIihkkWBEPLNIBcPa6SQ_A5PhtydJ';

export const supabase = createClient(supabaseUrl, supabaseKey);
