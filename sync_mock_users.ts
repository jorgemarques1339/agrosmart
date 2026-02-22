
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qcbricecpeekqjmsexuf.supabase.co';
const supabaseAnonKey = 'sb_publishable_fuv32LFWYKUCQ-KNwlL8BQ_rN5w5V7w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MOCK_USERS = [
    {
        id: 'u1', name: 'Carlos (Admin)', role: 'admin', avatar: 'CD', specialty: 'Administrador',
        safety_status: { status: 'safe', batteryLevel: 85 }
    },
    {
        id: 'u2', name: 'João Tratorista', role: 'mechanic', avatar: 'JT', specialty: 'Mecânico',
        safety_status: {
            status: 'warning',
            location: [41.442, -8.723],
            batteryLevel: 12
        }
    },
    {
        id: 'u3', name: 'Sílvia Vet', role: 'vet', avatar: 'SV', specialty: 'Veterinária',
        safety_status: { status: 'safe', batteryLevel: 92 }
    },
    {
        id: 'u4', name: 'Ricardo Horta', role: 'farmer', avatar: 'RH', specialty: 'Agricultor',
        safety_status: { status: 'safe', batteryLevel: 78 }
    }
];

async function syncUsers() {
    console.log('Syncing mock users to Supabase...');

    // Note: safety_status needs to be JSON, which it is here.
    const { data, error } = await supabase
        .from('users')
        .upsert(MOCK_USERS, { onConflict: 'id' });

    if (error) {
        console.error('Error syncing users:', error);
        return;
    }

    console.log('Successfully synced mock users!');

    // Verify again
    const { data: users, error: selectError } = await supabase
        .from('users')
        .select('id, name');

    console.log('--- ALL USERS IN CLOUD ---');
    users?.forEach(u => console.log(`[${u.id}] ${u.name}`));
}

syncUsers();
