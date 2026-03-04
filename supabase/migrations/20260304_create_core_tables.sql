-- 1. FIELDS
CREATE TABLE IF NOT EXISTS public.fields (
    id text PRIMARY KEY,
    name text,
    emoji text,
    crop text,
    area_ha numeric,
    yield_per_ha numeric,
    coordinates jsonb,
    polygon jsonb,
    irrigation_status boolean,
    humidity numeric,
    temp numeric,
    health_score numeric,
    harvest_window text,
    history jsonb,
    logs jsonb,
    sensors jsonb,
    missions jsonb,
    slope numeric,
    current_ndvi numeric,
    ndvi_history jsonb,
    auto_pilot_enabled boolean,
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS public.users (
    id text PRIMARY KEY,
    name text,
    role text,
    avatar text,
    username text,
    password text,
    specialty text,
    hourly_rate numeric,
    safety_status jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. MACHINES
CREATE TABLE IF NOT EXISTS public.machines (
    id text PRIMARY KEY,
    name text,
    brand text,
    model text,
    plate text,
    type text,
    engine_hours numeric,
    last_service_hours numeric,
    service_interval numeric,
    next_inspection_date text,
    status text,
    fuel_level numeric,
    stress_level numeric,
    image text,
    specs jsonb,
    logs jsonb,
    isobus_data jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. STOCKS
CREATE TABLE IF NOT EXISTS public.stocks (
    id text PRIMARY KEY,
    name text,
    category text,
    quantity numeric,
    unit text,
    min_stock numeric,
    price_per_unit numeric,
    supplier text,
    supplier_email text,
    daily_usage numeric,
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. ANIMALS
CREATE TABLE IF NOT EXISTS public.animals (
    id text PRIMARY KEY,
    tag_id text,
    name text,
    breed text,
    birth_date text,
    age text,
    weight numeric,
    status text,
    reproduction_status text,
    conception_date text,
    lineage jsonb,
    events jsonb,
    medical_history jsonb,
    withdrawal_end_date text,
    production_history jsonb,
    last_checkup text,
    notes text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. ANIMAL BATCHES
CREATE TABLE IF NOT EXISTS public.animal_batches (
    id text PRIMARY KEY,
    name text,
    species text,
    animal_count numeric,
    average_weight numeric,
    status text,
    production_history jsonb,
    history jsonb,
    medical_history jsonb,
    withdrawal_end_date text,
    last_checkup text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id text PRIMARY KEY,
    date text,
    type text,
    amount numeric,
    description text,
    category text,
    related_crop text,
    related_id text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 8. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id text PRIMARY KEY,
    title text,
    date text,
    type text,
    completed boolean,
    related_field_id text,
    related_stock_id text,
    planned_quantity numeric,
    resource_deducted boolean,
    assigned_to text,
    status text,
    proof_image text,
    feedback text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 9. HARVESTS
CREATE TABLE IF NOT EXISTS public.harvests (
    id text PRIMARY KEY, -- Dexie stores id optionally, SyncManager expects id
    batch_id text, 
    crop text,
    harvest_date text,
    origin text,
    coordinates jsonb,
    quantity numeric,
    unit text,
    stats jsonb,
    farmer_name text,
    image_url text,
    related_field_id text,
    field_logs jsonb,
    field_metadata jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id text PRIMARY KEY,
    title text,
    message text,
    type text,
    timestamp text,
    read boolean,
    action_link text,
    related_id text,
    updated_at timestamp with time zone DEFAULT now()
);

-- 11. FEED
CREATE TABLE IF NOT EXISTS public.feed (
    id text PRIMARY KEY,
    user_id text,
    user_name text,
    user_avatar text,
    type text,
    content text,
    media_url text,
    location jsonb,
    timestamp text,
    field_id text,
    updated_at timestamp with time zone DEFAULT now()
);
