
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qcbricecpeekqjmsexuf.supabase.co';
const supabaseAnonKey = 'sb_publishable_fuv32LFWYKUCQ-KNwlL8BQ_rN5w5V7w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
    console.log('Checking users in Supabase...');
    const { data, error } = await supabase
        .from('users')
        .select('id, name, role');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log('--- USERS IN CLOUD ---');
    data.forEach(u => {
        console.log(`[${u.id}] ${u.name} (${u.role})`);
    });
    console.log('----------------------');
}

checkUsers();
