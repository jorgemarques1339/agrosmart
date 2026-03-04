-- MOCK USERS
INSERT INTO public.users (id, name, role, avatar, username, password, specialty, hourly_rate, safety_status)
VALUES 
('u1', 'Carlos (Admin)', 'admin', 'CD', NULL, NULL, 'Administrador', 25.0, '{"status": "safe", "batteryLevel": 85}'::jsonb),
('u2', 'João Tratorista', 'mechanic', 'JT', NULL, NULL, 'Mecânico', 15.0, '{"status": "warning", "batteryLevel": 12}'::jsonb),
('u3', 'Sílvia Vet', 'vet', 'SV', NULL, NULL, 'Veterinária', 18.5, '{"status": "safe", "batteryLevel": 92}'::jsonb),
('u4', 'Ricardo Horta', 'farmer', 'RH', NULL, NULL, 'Agricultor', 14.0, '{"status": "safe", "batteryLevel": 78}'::jsonb),
('u5', 'Jorge Marques (Master)', 'admin', 'JM', 'jorge_marques', 'Cax1nasCity', 'Administrador Geral', 35.0, '{"status": "safe", "batteryLevel": 100}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- MOCK TRANSACTIONS
INSERT INTO public.transactions (id, date, type, amount, description, category, related_crop)
VALUES 
('tx1', '2023-10-01', 'income', 15000, 'Venda: Milho Silagem (40 Ton)', 'Vendas', 'Milho Silagem'),
('tx2', '2023-10-05', 'expense', 450, 'Reparação: Trator Principal', 'Manutenção', NULL),
('tx3', '2023-10-10', 'income', 8500, 'Venda: Uva Alvarinho (12 Ton)', 'Vendas', 'Uva Alvarinho'),
('tx4', '2023-10-12', 'expense', 1200, 'Stock: Fertilizante NPK', 'Stock', NULL),
('tx5', '2023-10-15', 'expense', 350, 'Stock: Ração Gado', 'Stock', NULL),
('tx6', '2023-10-20', 'income', 2000, 'Venda: Novilho PT-45921', 'Vendas', 'Pecuária')
ON CONFLICT (id) DO NOTHING;

-- MOCK BATCHES
INSERT INTO public.animal_batches (id, name, species, animal_count, average_weight, status, production_history, history, medical_history, last_checkup)
VALUES 
('b1', 'Lote 01 - Ovelhas Campaniças', 'Ovinos', 45, 52, 'healthy', '[{"date": "2023-10-01", "value": 50, "type": "weight"}, {"date": "2023-10-15", "value": 52, "type": "weight"}]'::jsonb, '[{"id": "h1", "date": "2023-10-10", "type": "treatment", "description": "Vacinação em Massa: Febre Aftosa"}]'::jsonb, '[{"id": "m1", "date": "2023-10-10", "type": "vaccine", "description": "Vacinação em Massa: Febre Aftosa", "drugName": "BioVax", "dosage": "2ml", "administeredBy": "Dra. Sílvia"}]'::jsonb, '2023-10-15')
ON CONFLICT (id) DO NOTHING;

-- MOCK ANIMALS
INSERT INTO public.animals (id, tag_id, name, breed, birth_date, age, weight, status, reproduction_status, conception_date, lineage, production_history, last_checkup, medical_history)
VALUES 
('a1', 'PT-45921', 'Mimosa', 'Holstein-Frísia', '2019-03-12', '4 Anos', 650, 'healthy', 'pregnant', '2023-01-01T00:00:00.000Z', '{"motherName": "Estrela", "fatherName": "Touro X200", "notes": "Gestante de: Touro X200"}'::jsonb, '[{"date": "2023-10-20", "value": 28, "type": "milk"}]'::jsonb, '2023-10-01', '[]'::jsonb),
('a2', 'PT-99100', 'Estrela', 'Alentejana', '2020-05-15', '3 Anos', 580, 'sick', 'empty', NULL, '{"fatherName": "Touro Y100"}'::jsonb, '[{"date": "2023-10-20", "value": 15, "type": "milk"}]'::jsonb, '2023-10-24', '[{"id": "v1", "date": "2023-10-24", "type": "treatment", "description": "Mastite clínica no quarto posterior esquerdo", "drugName": "MastiStop", "dosage": "1 seringa", "withdrawalDays": 5, "withdrawalEndDate": "2023-10-29", "administeredBy": "Dra. Sílvia"}]'::jsonb),
('a3', 'PT-10293', 'Bravia', 'Angus', '2021-02-10', '2 Anos', 710, 'healthy', 'heat', NULL, '{"motherName": "Mimosa", "fatherName": "Touro Z50"}'::jsonb, '[{"date": "2023-09-01", "value": 680, "type": "weight"}]'::jsonb, '2023-09-15', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- MOCK FIELDS
INSERT INTO public.fields (id, name, emoji, crop, area_ha, yield_per_ha, coordinates, polygon, irrigation_status, humidity, temp, health_score, harvest_window, history, logs)
VALUES 
('f1', 'Parcela Norte', '🌽', 'Milho Silagem', 12.5, 45, '[41.442, -8.723]'::jsonb, '[]'::jsonb, true, 48, 18, 92, '15 dias', '[]'::jsonb, '[{"id": "log1", "date": "2023-09-15", "type": "fertilization", "description": "Aplicação NPK", "cost": 850}, {"id": "log2", "date": "2023-10-01", "type": "labor", "description": "Trabalhos de sementeira", "cost": 320}]'::jsonb),
('f2', 'Vinha Velha', '🍇', 'Uva Alvarinho', 5.2, 8, '[41.445, -8.725]'::jsonb, '[]'::jsonb, false, 35, 20, 88, 'Concluída', '[]'::jsonb, '[{"id": "log3", "date": "2023-09-10", "type": "treatment", "description": "Tratamento anti-míldio", "cost": 420}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- MOCK STOCKS
INSERT INTO public.stocks (id, name, category, quantity, unit, min_stock, price_per_unit, supplier, supplier_email, daily_usage)
VALUES 
('s1', 'NPK 10-10-10', 'Fertilizante', 1500, 'kg', 500, 1.20, 'FertPlus S.A.', 'vendas@fertplus.pt', NULL),
('s2', 'Semente Milho Bayer', 'Semente', 8, 'sacos', 10, 85.00, NULL, NULL, NULL),
('s3', 'Gasóleo Agrícola', 'Combustível', 240, 'L', 100, 1.15, 'AgroComb, Lda', NULL, 50),
('s4', 'Ração Engorda Bovinos', 'Ração', 120, 'kg', 100, 0.45, 'Raçōes do Norte, S.A.', 'encomendas@racoesdonorte.pt', 35),
('s-mock-oliva', 'Oliva (Azeitona)', 'Colheita', 5000, 'kg', 0, 3.84, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- MOCK MACHINES
INSERT INTO public.machines (id, name, brand, model, plate, type, engine_hours, last_service_hours, service_interval, next_inspection_date, status, fuel_level, stress_level, specs, logs, isobus_data)
VALUES 
('m1', 'Trator Principal', 'John Deere', '6120M', '92-VX-12', 'tractor', 4230, 4000, 500, '2024-05-15', 'active', 65, 15, '{"powerHp": 120, "fuelCapacity": 250, "maxSpeed": 40}'::jsonb, '[{"id": "l1", "date": "2023-08-10", "type": "oil_change", "description": "Revisão das 4000h (Óleo + Filtros)", "cost": 450, "engineHoursAtLog": 4000}]'::jsonb, '{"engineRpm": 1850, "groundSpeed": 8.4, "fuelRate": 12.5, "ptoSpeed": 540, "hydraulicPressure": 185, "engineLoad": 68, "coolantTemp": 92, "adBlueLevel": 85, "implementDepth": 12, "dtc": []}'::jsonb),
('m2', 'Carrinha da Quinta', 'Toyota', 'Hilux', 'AA-00-BB', 'vehicle', 150000, 145000, 10000, '2023-11-01', 'active', 40, 0, '{"powerHp": 150, "fuelCapacity": 80, "maxSpeed": 160}'::jsonb, '[]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;
