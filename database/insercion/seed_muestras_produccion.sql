BEGIN;
-- ADVERTENCIAS (filas omitidas):


-- Asegurar proveedores K+S KALI y ESCO (usados en CSV pero no existentes) → mapear a BASF
-- Nota: K+S KALI y ESCO no existen, se sustituyen por BASF en el script

INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE 45',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-248194-2608','2026-08-15'::date,'2024-08-15'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY['Corrosivo','Toxicidad Aguda','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-248194-2608' AND name='ACTICIDE 45');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE BW 20',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-263741-2711','2027-11-14'::date,'2025-11-14'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-263741-2711' AND name='ACTICIDE BW 20');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE CBM2',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-257218-2602','2026-02-07'::date,'2025-05-07'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-257218-2602' AND name='ACTICIDE CBM2');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE CBM2',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-261857-2606','2026-06-15'::date,'2025-09-15'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2800.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-261857-2606' AND name='ACTICIDE CBM2');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE EPW',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-261127-2608','2026-08-27'::date,'2025-08-27'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Corrosivo','Irritante','Toxicidad Cronica','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-261127-2608' AND name='ACTICIDE EPW');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE HF',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-241628-2508','2026-02-22'::date,'2024-02-19'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2100.0,ARRAY['Corrosivo','Irritante','Toxicidad Cronica','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-241628-2508' AND name='ACTICIDE HF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE HF',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-257851-2611','2026-11-20'::date,'2024-11-20'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Corrosivo','Irritante','Toxicidad Cronica','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-257851-2611' AND name='ACTICIDE HF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE IPS 20',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-250986-2606','2026-06-23'::date,'2025-06-23'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-250986-2606' AND name='ACTICIDE IPS 20');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE LA 1206',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-245898-2512','2025-12-20'::date,'2024-06-20'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1700.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-245898-2512' AND name='ACTICIDE LA 1206');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE LA 1206',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-256456-2610','2026-10-08'::date,'2025-04-08'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-256456-2610' AND name='ACTICIDE LA 1206');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE LA 1206',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'257810-2611','2026-11-22'::date,'2025-05-22'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='257810-2611' AND name='ACTICIDE LA 1206');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE LA 1206',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-262978-2704','2027-04-22'::date,'2025-10-22'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-262978-2704' AND name='ACTICIDE LA 1206');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE LV 706',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'RP-0157023003-2510','2025-10-25'::date,'2024-05-03'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='RP-0157023003-2510' AND name='ACTICIDE LV 706');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE MBS',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-252316-2512','2025-12-05'::date,'2024-12-05'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-252316-2512' AND name='ACTICIDE MBS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE MV',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-256423-2610','2026-10-10'::date,'2025-04-10'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-256423-2610' AND name='ACTICIDE MV');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE OF 1',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-256426-2604','2026-04-07'::date,'2025-04-07'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-256426-2604' AND name='ACTICIDE OF 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE RS',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-257785-2705','2027-05-19'::date,'2025-05-19'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-257785-2705' AND name='ACTICIDE RS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTICIDE ZPD1',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'RP-0183081002-2601','2026-01-13'::date,'2025-01-13'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='RP-0183081002-2601' AND name='ACTICIDE ZPD1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ACTIWHITE LS 9808',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27430998','2025-12-13'::date,'2023-12-13'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,450.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27430998' AND name='ACTIWHITE LS 9808');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ADVANCED MOISTURE COMLEX NP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28031712','2026-07-04'::date,'2024-07-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,575.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28031712' AND name='ADVANCED MOISTURE COMLEX NP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'AGNIQUE AMD 3L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29283701','2027-11-19'::date,'2025-11-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29283701' AND name='AGNIQUE AMD 3L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'AH CARE L 65',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29153277','2027-04-16'::date,'2025-10-23'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,350.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29153277' AND name='AH CARE L 65');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ANASENSYL LS 9322',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28491109','2026-07-11'::date,'2024-07-11'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,50.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28491109' AND name='ANASENSYL LS 9322');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ARBOCEL M 80',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'72813230809','2026-08-01'::date,'2023-08-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='72813230809' AND name='ARBOCEL M 80');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ARLYPON F',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28338228','2026-05-22'::date,'2024-05-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28338228' AND name='ARLYPON F');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ARLYPON TT',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29641145','2027-02-17'::date,'2025-08-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29641145' AND name='ARLYPON TT');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ASCORBIL FOSFATO DE SODIO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24182107','2026-05-03'::date,'2024-05-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24182107' AND name='ASCORBIL FOSFATO DE SODIO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ASEBIOL LS 2539 BT 2',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27750061','2024-11-12'::date,'2023-11-13'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,425.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27750061' AND name='ASEBIOL LS 2539 BT 2');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'BICARBONATO DE SODIO',(SELECT id FROM suppliers WHERE name='SUDEEP' LIMIT 1),'25CSBIF015','2030-02-01'::date,'2025-03-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25CSBIF015' AND name='BICARBONATO DE SODIO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'BIOPHYTEX LS 9832',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28017683','2026-08-19'::date,'2024-08-20'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,25.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28017683' AND name='BIOPHYTEX LS 9832');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'BISABOLOL RAC.',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'32326047G0','2027-08-18'::date,'2025-02-17'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,775.0,ARRAY['Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='32326047G0' AND name='BISABOLOL RAC.');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CAFFEINE POWDER',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'22042027','2027-01-24'::date,'2022-01-25'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,250.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='22042027' AND name='CAFFEINE POWDER');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CALCIUM STEARATE',(SELECT id FROM suppliers WHERE name='SUDEEP' LIMIT 1),'24JCSTD003','2026-08-01'::date,'2024-09-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24JCSTD003' AND name='CALCIUM STEARATE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CEGESOFT C 24',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27639290','2025-10-01'::date,'2023-10-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27639290' AND name='CEGESOFT C 24');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CELLACTOSE 80',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L100460525','2028-01-23'::date,'2025-02-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,3000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L100460525' AND name='CELLACTOSE 80');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CELLACTOSE 80',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L100464625','2028-11-05'::date,'2025-11-16'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,3000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L100464625' AND name='CELLACTOSE 80');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL 868',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'26556684','2023-10-08'::date,'2022-10-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26556684' AND name='CETIOL 868');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL AB',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'P29743D181','2026-09-12'::date,'2025-03-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='P29743D181' AND name='CETIOL AB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL ABV',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28134935','2025-09-07'::date,'2024-03-16'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28134935' AND name='CETIOL ABV');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL B',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29731177','2027-04-04'::date,'2025-10-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29731177' AND name='CETIOL B');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL C 5',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27850893','2025-06-05'::date,'2023-12-13'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2250.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27850893' AND name='CETIOL C 5');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL CC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'0029185223 RSPO','2027-02-17'::date,'2025-02-17'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='0029185223 RSPO' AND name='CETIOL CC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL EXTREME',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28559372','2027-01-28'::date,'2025-02-12'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28559372' AND name='CETIOL EXTREME');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL HE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28700434','2026-04-29'::date,'2024-11-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28700434' AND name='CETIOL HE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL J 600',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29005773','2026-05-08'::date,'2025-05-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29005773' AND name='CETIOL J 600');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL MM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29204819','2027-02-24'::date,'2025-02-24'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29204819' AND name='CETIOL MM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL OE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28242271','2026-04-18'::date,'2024-04-18'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28242271' AND name='CETIOL OE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL OE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29212411','2027-02-26'::date,'2025-02-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29212411' AND name='CETIOL OE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL RLF',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24465958','2023-05-07'::date,'2021-05-07'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24465958' AND name='CETIOL RLF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL RLF',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25734157','2025-01-05'::date,'2023-01-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25734157' AND name='CETIOL RLF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL SB 45',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'2905431','2026-06-19'::date,'2024-12-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2905431' AND name='CETIOL SB 45');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL SENSOFT',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27851906','2025-12-13'::date,'2023-12-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27851906' AND name='CETIOL SENSOFT');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL SOFTFEEL',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24729146','2023-07-14'::date,'2021-06-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24729146' AND name='CETIOL SOFTFEEL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL ULTIMATE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29147404','2026-07-29'::date,'2025-02-04'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Toxicidad Cronica']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29147404' AND name='CETIOL ULTIMATE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CETIOL V',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27851673','2025-03-12'::date,'2024-03-13'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27851673' AND name='CETIOL V');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CLORURO DE POTASIO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'3424000504','2027-07-29'::date,'2024-07-29'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='3424000504' AND name='CLORURO DE POTASIO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CLORURO DE SODIO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'7 24500','2028-06-12'::date,'2025-06-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='7 24500' AND name='CLORURO DE SODIO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CLORURO DE SODIO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'6 25500','2028-06-19'::date,'2025-06-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='6 25500' AND name='CLORURO DE SODIO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CLORURO DE SODIO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'3 26500','2028-06-23'::date,'2025-06-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='3 26500' AND name='CLORURO DE SODIO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COMBILAC',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L100064925','2027-11-26'::date,'2025-12-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,3000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L100064925' AND name='COMBILAC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COMPERLAN 100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25333655','2023-11-16'::date,'2021-11-16'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25333655' AND name='COMPERLAN 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COMPERLAN 100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28152340','2026-03-21'::date,'2024-03-21'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,750.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28152340' AND name='COMPERLAN 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COMPERLAN 100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28815062','2026-10-23'::date,'2024-10-23'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,550.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28815062' AND name='COMPERLAN 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COMPERLAN KD',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28087467','2026-03-03'::date,'2024-03-03'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28087467' AND name='COMPERLAN KD');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COSMEDIA A 91',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'CR51134894','2026-04-23'::date,'2025-04-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='CR51134894' AND name='COSMEDIA A 91');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COSMEDIA DC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28665862','2026-09-10'::date,'2024-09-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28665862' AND name='COSMEDIA DC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'COSMEDIA TRIPLE C',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28691174','2026-03-12'::date,'2024-09-18'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28691174' AND name='COSMEDIA TRIPLE C');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CREMOPHOR RH 40',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'3,01E+07','2026-06-06'::date,'2024-06-06'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,150.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='3,01E+07' AND name='CREMOPHOR RH 40');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CUTINA AGS',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29152653','2027-02-05'::date,'2025-02-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29152653' AND name='CUTINA AGS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CUTINA CP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28642411','2026-09-02'::date,'2024-09-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28642411' AND name='CUTINA CP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CUTINA GMS V',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28642377','2025-09-02'::date,'2024-09-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28642377' AND name='CUTINA GMS V');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CUTINA PES',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27757592','2025-11-12'::date,'2023-03-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27757592' AND name='CUTINA PES');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CUTINA PES',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28379630','2026-06-05'::date,'2024-06-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28379630' AND name='CUTINA PES');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'CUTINA SHINE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29328365','2027-04-15'::date,'2025-04-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29328365' AND name='CUTINA SHINE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'D PANTENOL CARE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'93318288Q0','2027-03-01'::date,'2024-03-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='93318288Q0' AND name='D PANTENOL CARE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYDOL LT 7',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24H20490H0','2026-08-21'::date,'2024-08-21'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24H20490H0' AND name='DEHYDOL LT 7');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYMULS PGPH',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27445320','2025-12-14'::date,'2023-12-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,150.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27445320' AND name='DEHYMULS PGPH');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYPON  LT  104',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'01235329U0','2027-01-10'::date,'2025-01-10'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY['Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='01235329U0' AND name='DEHYPON  LT  104');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYQUART C 4046',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29347333','2026-04-23'::date,'2025-04-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29347333' AND name='DEHYQUART C 4046');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYQUART C 4046',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29618204','2026-08-18'::date,'2025-08-18'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29618204' AND name='DEHYQUART C 4046');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYQUART F 75 T',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29239979','2026-03-09'::date,'2025-03-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,550.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29239979' AND name='DEHYQUART F 75 T');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYQUART GUAR N',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'250625951C','2027-06-25'::date,'2025-06-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='250625951C' AND name='DEHYQUART GUAR N');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYQUART H 81',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28265267','2025-04-25'::date,'2024-04-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28265267' AND name='DEHYQUART H 81');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYQUART L 80 T',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'30012447','2027-02-17'::date,'2026-02-17'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='30012447' AND name='DEHYQUART L 80 T');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYTON K',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29294281','2026-04-01'::date,'2025-04-01'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29294281' AND name='DEHYTON K');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DEHYTON MC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29174101','2026-02-13'::date,'2025-02-13'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29174101' AND name='DEHYTON MC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DERIPHAT 160C',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'DER20094R','2023-12-07'::date,'2020-12-07'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='DER20094R' AND name='DERIPHAT 160C');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DL ALPHA TOCOPHEROL',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'4,45E+07','2028-06-22'::date,'2025-06-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='4,45E+07' AND name='DL ALPHA TOCOPHEROL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DRY VITAMINA A PALMITATO 250 MS CWD',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25976235','2024-04-25'::date,'2022-04-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25976235' AND name='DRY VITAMINA A PALMITATO 250 MS CWD');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DRY VITAMINA D3 100 GFP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25595548','2024-01-23'::date,'2022-01-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1450.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25595548' AND name='DRY VITAMINA D3 100 GFP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DULCEMIN PW BIO LS 9903',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'23369163','2022-09-14'::date,'2020-09-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,30.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='23369163' AND name='DULCEMIN PW BIO LS 9903');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'DURALAC H',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'LC 033-24-805','2027-08-16'::date,'2024-08-12'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,5000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='LC 033-24-805' AND name='DURALAC H');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ECHINACEA PURPUREA AERIAL PART PE 4% - EA834410',(SELECT id FROM suppliers WHERE name='GIVAUDAN' LIMIT 1),'AG00004242','2024-03-15'::date,'2021-03-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='AG00004242' AND name='ECHINACEA PURPUREA AERIAL PART PE 4% - EA834410');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EDETA BD',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'76659047G0','2027-03-06'::date,'2024-03-06'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Irritante','Toxicidad Cronica']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='76659047G0' AND name='EDETA BD');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ELESTAB HP 100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28456285','2027-11-20'::date,'2024-11-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,175.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28456285' AND name='ELESTAB HP 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMCOMPRESS',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'1048707','2026-05-16'::date,'2024-05-16'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='1048707' AND name='EMCOMPRESS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULAN OC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'33682936W0','2027-04-09'::date,'2025-04-09'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY['Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='33682936W0' AND name='EMULAN OC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULGADE 1000 NI',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29263461','2027-03-19'::date,'2025-03-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29263461' AND name='EMULGADE 1000 NI');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULGADE CM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29478757','2026-06-20'::date,'2025-06-20'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29478757' AND name='EMULGADE CM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULGADE F',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29088203','2027-01-10'::date,'2025-01-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29088203' AND name='EMULGADE F');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULGADE PL 68/50',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27934511','2026-01-15'::date,'2024-01-16'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27934511' AND name='EMULGADE PL 68/50');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULGADE SE-PF',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29222546','2026-08-25'::date,'2025-03-03'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29222546' AND name='EMULGADE SE-PF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EMULGADE VERDE 10 MS',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'20241022','2026-10-22'::date,'2024-10-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='20241022' AND name='EMULGADE VERDE 10 MS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EPISPOT BC10208',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27313342','2025-03-30'::date,'2023-03-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,60.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27313342' AND name='EPISPOT BC10208');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN B1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'26930613','2025-05-08'::date,'2023-05-09'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2400.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26930613' AND name='EUMULGIN B1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN B2',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27997996','2026-02-04'::date,'2024-02-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27997996' AND name='EUMULGIN B2');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN B2',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'0028611093 RSPO','2026-08-22'::date,'2024-08-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='0028611093 RSPO' AND name='EUMULGIN B2');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN B3',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27879182','2025-12-25'::date,'2023-12-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27879182' AND name='EUMULGIN B3');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN B3',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28758244','2026-10-09'::date,'2024-10-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28758244' AND name='EUMULGIN B3');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN B3',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29295918','2027-04-01'::date,'2025-04-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29295918' AND name='EUMULGIN B3');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN CO 40',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28062965','2026-04-03'::date,'2024-04-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28062965' AND name='EUMULGIN CO 40');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN HPS',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29033488','2026-12-16'::date,'2024-12-16'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29033488' AND name='EUMULGIN HPS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28624685','2025-08-27'::date,'2024-08-27'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28624685' AND name='EUMULGIN L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN O5',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29096201','2026-07-08'::date,'2025-01-14'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,360.0,ARRAY['Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29096201' AND name='EUMULGIN O5');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN PRISMA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25534069','2027-02-07'::date,'2023-02-08'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25534069' AND name='EUMULGIN PRISMA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN PRISMA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29533247','2029-07-13'::date,'2025-07-14'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29533247' AND name='EUMULGIN PRISMA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN SG',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28562280','2026-01-27'::date,'2024-08-05'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28562280' AND name='EUMULGIN SG');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN SG',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29222533','2026-08-25'::date,'2025-03-03'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29222533' AND name='EUMULGIN SG');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN VL 75',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28936700','2025-11-27'::date,'2024-11-27'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28936700' AND name='EUMULGIN VL 75');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUMULGIN VL 75',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29734730','2026-10-17'::date,'2025-10-17'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29734730' AND name='EUMULGIN VL 75');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUPERLAN HCO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29710346','2027-03-24'::date,'2025-09-25'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29710346' AND name='EUPERLAN HCO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUPERLAN PK 3000 AM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27063122','2024-03-12'::date,'2023-03-13'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27063122' AND name='EUPERLAN PK 3000 AM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUPERLAN PK 4000',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29004983','2026-09-09'::date,'2025-09-09'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1900.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29004983' AND name='EUPERLAN PK 4000');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUPERLAN PK 771 BENZ',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29749584','2026-10-13'::date,'2025-10-13'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29749584' AND name='EUPERLAN PK 771 BENZ');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EUTANOL G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29346202','2026-06-03'::date,'2025-06-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29346202' AND name='EUTANOL G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'EXPLOTAB',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'61123090188','2027-09-01'::date,'2023-09-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='61123090188' AND name='EXPLOTAB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'FERROUS SULPHATE HEPTAHYDRATE',(SELECT id FROM suppliers WHERE name='SUDEEP' LIMIT 1),'25AFSH001','2027-12-01'::date,'2024-01-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25AFSH001' AND name='FERROUS SULPHATE HEPTAHYDRATE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'FLOWLAC 100',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L101500126','2027-12-24'::date,'2026-01-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L101500126' AND name='FLOWLAC 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GLUCOPON 225 DK',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28682584','2026-09-15'::date,'2024-09-15'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28682584' AND name='GLUCOPON 225 DK');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GLUCOPON 420 UP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29236002','2027-03-14'::date,'2025-03-14'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29236002' AND name='GLUCOPON 420 UP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GLUCOPON 425 N/HH',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'K24817J081','2026-08-17'::date,'2024-08-17'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='K24817J081' AND name='GLUCOPON 425 N/HH');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GLUCOPON 600 CSUP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27341279','2026-06-18'::date,'2024-06-19'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1600.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27341279' AND name='GLUCOPON 600 CSUP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GRANULAC 140',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L101803124','2027-07-25'::date,'2024-07-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,3000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L101803124' AND name='GRANULAC 140');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GRANULAC 200',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'LC 017-23-801','2026-04-20'::date,'2023-04-24'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,3000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='LC 017-23-801' AND name='GRANULAC 200');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'GRANULAC 200',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L101850825','2028-02-13'::date,'2025-02-17'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L101850825' AND name='GRANULAC 200');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HEWETEN 112',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'46112240103','2027-01-01'::date,'2024-01-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='46112240103' AND name='HEWETEN 112');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HEWETEN 200',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'46200182546','2023-11-30'::date,'2018-11-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='46200182546' AND name='HEWETEN 200');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HEWETEN 200',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'26200240301','2029-01-01'::date,'2025-04-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26200240301' AND name='HEWETEN 200');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HEWETEN 200',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'26200240818','2029-05-01'::date,'2024-05-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,4500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26200240818' AND name='HEWETEN 200');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HYALUROSMOOTH LS 8998',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'26930654','2025-02-08'::date,'2023-02-09'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,30.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26930654' AND name='HYALUROSMOOTH LS 8998');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HYALUROSMOOTH LS 8998',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27856923','2025-12-19'::date,'2023-12-20'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,30.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27856923' AND name='HYALUROSMOOTH LS 8998');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HYDAGEN AQUAPORIN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28059566','2026-11-12'::date,'2024-11-13'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,450.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28059566' AND name='HYDAGEN AQUAPORIN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HYDRASENSYL GLUCAN GREEN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28980662','2026-03-01'::date,'2024-12-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,480.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28980662' AND name='HYDRASENSYL GLUCAN GREEN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'HYDRASENSYL GLUCAN GREEN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28865268','2026-05-04'::date,'2024-11-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,60.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28865268' AND name='HYDRASENSYL GLUCAN GREEN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'JORDAPON SCI POWDER',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'PAC2411572','2024-12-13'::date,'2022-12-13'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='PAC2411572' AND name='JORDAPON SCI POWDER');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KERASYLIUM BC 10195',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28366724','2026-06-07'::date,'2024-06-07'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,10.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28366724' AND name='KERASYLIUM BC 10195');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT MAE 30 DP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'17514675L0','2026-05-26'::date,'2024-05-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='17514675L0' AND name='KOLLICOAT MAE 30 DP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT MAE 30 DP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'88073216K0','2026-09-01'::date,'2024-09-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='88073216K0' AND name='KOLLICOAT MAE 30 DP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT PROTECT',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'54414636W0','2025-06-08'::date,'2022-06-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='54414636W0' AND name='KOLLICOAT PROTECT');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT SMARTSEAL 30D',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'08005647G0','2024-01-07'::date,'2022-04-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='08005647G0' AND name='KOLLICOAT SMARTSEAL 30D');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT SMARTSEAL 30D',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'10099275L0','2026-01-06'::date,'2022-04-27'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='10099275L0' AND name='KOLLICOAT SMARTSEAL 30D');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT SR 30 D',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'89514016K0','2025-07-18'::date,'2024-01-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='89514016K0' AND name='KOLLICOAT SR 30 D');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICOAT SR 30 D',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'99809175L0','2025-07-20'::date,'2024-01-27'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='99809175L0' AND name='KOLLICOAT SR 30 D');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM 3 C',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28161715','2026-03-23'::date,'2024-03-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28161715' AND name='KOLLICREAM 3 C');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM 3 C',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29368327','2027-05-02'::date,'2025-05-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29368327' AND name='KOLLICREAM 3 C');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM CP 15',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27461190','2025-07-26'::date,'2023-07-27'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27461190' AND name='KOLLICREAM CP 15');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM DO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27467168','2025-07-29'::date,'2023-07-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27467168' AND name='KOLLICREAM DO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM DO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27467169','2025-07-29'::date,'2023-07-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27467169' AND name='KOLLICREAM DO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM IPM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27485791','2025-08-05'::date,'2023-08-06'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27485791' AND name='KOLLICREAM IPM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM OA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28395514','2025-06-10'::date,'2024-06-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28395514' AND name='KOLLICREAM OA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLICREAM OD',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28107452','2026-03-08'::date,'2024-03-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28107452' AND name='KOLLICREAM OD');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIDON 12 PF',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'21259536W0','2027-01-14'::date,'2024-01-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='21259536W0' AND name='KOLLIDON 12 PF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIDON 25',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'92018356P0','2027-08-31'::date,'2023-09-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='92018356P0' AND name='KOLLIDON 25');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIDON CL-SF',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'34338377L0','2027-04-22'::date,'2024-04-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2750.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='34338377L0' AND name='KOLLIDON CL-SF');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIDON CLM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24362051','2027-09-30'::date,'2024-09-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24362051' AND name='KOLLIDON CLM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIDON VA 64 FINE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'04071416K0','2028-12-25'::date,'2024-12-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,250.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='04071416K0' AND name='KOLLIDON VA 64 FINE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR CS 12',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29276178','2027-03-24'::date,'2025-03-24'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29276178' AND name='KOLLIPHOR CS 12');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR CSL',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27517816','2025-08-17'::date,'2023-08-18'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27517816' AND name='KOLLIPHOR CSL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR CSS',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27696289','2025-10-22'::date,'2023-10-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27696289' AND name='KOLLIPHOR CSS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR EL',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'89669924U0','2027-02-03'::date,'2025-02-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='89669924U0' AND name='KOLLIPHOR EL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR HS 15',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'68313056P0','2026-08-26'::date,'2024-08-26'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='68313056P0' AND name='KOLLIPHOR HS 15');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR P 188 MICRO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNH07521WT','2026-03-15'::date,'2023-03-16'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNH07521WT' AND name='KOLLIPHOR P 188 MICRO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR P 338',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNG19321C','2025-07-11'::date,'2022-07-12'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNG19321C' AND name='KOLLIPHOR P 338');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR P 407',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNJ11621B','2028-04-25'::date,'2025-04-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNJ11621B' AND name='KOLLIPHOR P 407');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR PS 20',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28310598','2027-05-09'::date,'2024-05-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28310598' AND name='KOLLIPHOR PS 20');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR PS 60',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27775389','2026-11-18'::date,'2023-11-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27775389' AND name='KOLLIPHOR PS 60');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR PS 80',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27540058','2026-08-25'::date,'2023-08-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27540058' AND name='KOLLIPHOR PS 80');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR RH 40',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'53725456P0','2027-06-30'::date,'2025-06-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='53725456P0' AND name='KOLLIPHOR RH 40');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIPHOR SLS FINE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29840693','2027-11-25'::date,'2025-11-25'::date,'Inflamable'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,250.0,ARRAY['Inflamable','Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29840693' AND name='KOLLIPHOR SLS FINE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV GTA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27625060','2025-09-25'::date,'2023-09-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27625060' AND name='KOLLISOLV GTA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV P 124 GEISMAR',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNI16322B','2027-06-11'::date,'2024-06-11'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNI16322B' AND name='KOLLISOLV P 124 GEISMAR');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 300 G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'87544136W0','2025-04-11'::date,'2023-04-11'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='87544136W0' AND name='KOLLISOLV PEG 300 G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 300 G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'33622736W0','2026-01-28'::date,'2024-01-29'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='33622736W0' AND name='KOLLISOLV PEG 300 G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 400',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'16337256P0','2026-03-13'::date,'2024-03-13'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='16337256P0' AND name='KOLLISOLV PEG 400');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 400',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'87300636W0','2026-11-15'::date,'2024-11-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='87300636W0' AND name='KOLLISOLV PEG 400');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 400',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'9,56E+07','2027-05-26'::date,'2025-05-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='9,56E+07' AND name='KOLLISOLV PEG 400');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 8000',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNI05723C','2026-02-25'::date,'2024-02-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,750.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNI05723C' AND name='KOLLISOLV PEG 8000');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLISOLV PEG 8000',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNI19021B','2026-07-08'::date,'2024-07-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNI19021B' AND name='KOLLISOLV PEG 8000');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLITAB DC 87 L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'65831836W0','2026-01-08'::date,'2023-01-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,5000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='65831836W0' AND name='KOLLITAB DC 87 L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX CA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'56501147G0','2027-07-15'::date,'2024-07-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='56501147G0' AND name='KOLLIWAX CA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX CSA 50',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27830069','2025-12-06'::date,'2023-12-07'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27830069' AND name='KOLLIWAX CSA 50');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX HCO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'00731809T0','2025-11-13'::date,'2023-11-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='00731809T0' AND name='KOLLIWAX HCO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX HCO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'09553216K0','2026-07-08'::date,'2024-03-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='09553216K0' AND name='KOLLIWAX HCO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX S',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27714529','2025-10-29'::date,'2023-10-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27714529' AND name='KOLLIWAX S');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX S FINE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28521713','2026-07-22'::date,'2024-07-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28521713' AND name='KOLLIWAX S FINE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX SA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28032952','2026-02-14'::date,'2024-02-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28032952' AND name='KOLLIWAX SA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'KOLLIWAX SA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28373876','2026-06-04'::date,'2024-06-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28373876' AND name='KOLLIWAX SA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAMEFORM TGI',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27067420','2025-08-08'::date,'2023-08-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27067420' AND name='LAMEFORM TGI');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAMEFORM TGI',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28628419','2026-08-27'::date,'2024-08-27'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28628419' AND name='LAMEFORM TGI');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAMESOFT PO 65',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29509628','2026-07-03'::date,'2025-07-03'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29509628' AND name='LAMESOFT PO 65');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAMESOFT TM BENZ',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29368467','2026-05-02'::date,'2025-05-02'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29368467' AND name='LAMESOFT TM BENZ');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LANETTE O',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29085277','2027-01-09'::date,'2025-01-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29085277' AND name='LANETTE O');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LANETTE SX',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25409807','2023-12-02'::date,'2021-12-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25409807' AND name='LANETTE SX');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LARICYL LS 8865',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27434428','2026-01-11'::date,'2023-07-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,95.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27434428' AND name='LARICYL LS 8865');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAVERGY A STAR 100 L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'72477247G0','2026-04-02'::date,'2024-10-09'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Toxicidad Cronica']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='72477247G0' AND name='LAVERGY A STAR 100 L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAVERGY C BRIGHT 100L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'82957656P0','2027-02-14'::date,'2024-08-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='82957656P0' AND name='LAVERGY C BRIGHT 100L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAVERGY C CARE 100 L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'86395856P0','2026-10-16'::date,'2025-04-19'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY['Toxicidad Cronica']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='86395856P0' AND name='LAVERGY C CARE 100 L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAVERGY M ACE 100 L',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'31247147G0','2026-01-31'::date,'2023-11-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='31247147G0' AND name='LAVERGY M ACE 100 L');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAVERGY PRO 114 LS',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'59903888Q0','2026-07-11'::date,'2025-07-29'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='59903888Q0' AND name='LAVERGY PRO 114 LS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LAVERGY PRO 114 LS',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'01774706D0','2026-10-06'::date,'2025-04-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='01774706D0' AND name='LAVERGY PRO 114 LS');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LIPOFRUCTYL ARGAN LS 9779',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24155982','2024-10-13'::date,'2022-10-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,225.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24155982' AND name='LIPOFRUCTYL ARGAN LS 9779');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LITCHIDERM LS 9704',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28115553','2026-03-15'::date,'2024-03-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,125.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28115553' AND name='LITCHIDERM LS 9704');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LOROL C 16',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28152874','2026-03-21'::date,'2024-03-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28152874' AND name='LOROL C 16');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LOROL C 18',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27640929','2025-11-08'::date,'2023-11-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27640929' AND name='LOROL C 18');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LOROL C 18 SAC PAST',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29141052','2027-01-31'::date,'2025-01-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29141052' AND name='LOROL C 18 SAC PAST');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUBRI-PREZ',(SELECT id FROM suppliers WHERE name='SUDEEP' LIMIT 1),'25AMSTD015','2029-12-30'::date,'2025-01-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25AMSTD015' AND name='LUBRI-PREZ');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUBRITAB',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'2301000233','2025-01-11'::date,'2023-01-11'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2301000233' AND name='LUBRITAB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUDIFLASH',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'62709247G0','2027-01-24'::date,'2024-01-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,4000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='62709247G0' AND name='LUDIFLASH');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTENSOL AO 7',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'23H04190H0','2025-08-07'::date,'2023-08-08'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='23H04190H0' AND name='LUTENSOL AO 7');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTENSOL M 7',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24L05490H0','2026-12-05'::date,'2024-12-05'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1800.0,ARRAY['Irritante','Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24L05490H0' AND name='LUTENSOL M 7');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTENSOL M79',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28509620','2026-07-19'::date,'2024-07-19'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28509620' AND name='LUTENSOL M79');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTENSOL NE 9',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'K25307C932','2027-03-07'::date,'2025-03-07'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1400.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='K25307C932' AND name='LUTENSOL NE 9');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTENSOL TO8',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25E26590H0','2027-05-26'::date,'2025-05-26'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25E26590H0' AND name='LUTENSOL TO8');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTENSOL XL 100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'21339788Q0','2026-10-07'::date,'2024-10-07'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2400.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='21339788Q0' AND name='LUTENSOL XL 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUTROPUR MSA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'82994824U0','2029-02-28'::date,'2025-02-18'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1600.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='82994824U0' AND name='LUTROPUR MSA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVIQUAT HM 552',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'00738788Q0','2027-01-17'::date,'2025-01-17'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='00738788Q0' AND name='LUVIQUAT HM 552');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVIQUAT HOLD AT 3',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29612956P0','2027-01-23'::date,'2025-01-24'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29612956P0' AND name='LUVIQUAT HOLD AT 3');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVIQUAT SUPREME AT 1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'68110675L0','2027-05-10'::date,'2025-05-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='68110675L0' AND name='LUVIQUAT SUPREME AT 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVIQUAT ULTRACARE AT 1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'91406624U0','2026-06-07'::date,'2024-06-07'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,840.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='91406624U0' AND name='LUVIQUAT ULTRACARE AT 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVISET 360',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29309937','2026-10-08'::date,'2025-04-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29309937' AND name='LUVISET 360');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVISET CLEAR AT 3',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'89976856P0','2026-02-28'::date,'2024-02-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='89976856P0' AND name='LUVISET CLEAR AT 3');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVISET CLEAR AT 3',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'81416088Q0','2026-03-12'::date,'2024-03-12'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='81416088Q0' AND name='LUVISET CLEAR AT 3');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVISKOL VA 64 POWDER',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'81812988Q0','2027-08-22'::date,'2025-08-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='81812988Q0' AND name='LUVISKOL VA 64 POWDER');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVISKOL VA 64 W',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25380424U0','2027-07-17'::date,'2025-07-17'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25380424U0' AND name='LUVISKOL VA 64 W');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LUVITOL LITE EM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'50353075L0','2026-05-15'::date,'2024-05-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='50353075L0' AND name='LUVITOL LITE EM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'LYCOVIT DISPERSION 10%',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'94246588Q0','2026-11-15'::date,'2022-11-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='94246588Q0' AND name='LYCOVIT DISPERSION 10%');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MARANIL DB50',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27969492','2026-01-25'::date,'2024-01-06'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2600.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27969492' AND name='MARANIL DB50');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MAT-XS CLINICAL A00098',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25375195','2023-05-19'::date,'2021-11-25'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,115.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25375195' AND name='MAT-XS CLINICAL A00098');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MELANEVEN BC10046',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28362578','2025-11-29'::date,'2024-06-07'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,40.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28362578' AND name='MELANEVEN BC10046');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MELANEVEN BC10046',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29204497','2027-02-26'::date,'2025-02-26'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,120.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29204497' AND name='MELANEVEN BC10046');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE AMIDE BHAM',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-218402-2505','2025-05-31'::date,'2023-06-20'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,4000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-218402-2505' AND name='MICROCARE AMIDE BHAM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE CB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-235600-2507','2025-07-27'::date,'2023-07-27'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-235600-2507' AND name='MICROCARE CB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE DB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-306208-2504','2025-04-30'::date,'2023-10-25'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-306208-2504' AND name='MICROCARE DB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE EMOLIENTE DCP',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-406192-2611','2026-11-30'::date,'2024-11-12'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,350.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-406192-2611' AND name='MICROCARE EMOLIENTE DCP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE EMOLLIENT GTC',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-258750-2703','2027-03-15'::date,'2025-03-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-258750-2703' AND name='MICROCARE EMOLLIENT GTC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE EMOLLIENT IPP',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-258751-2701','2027-01-15'::date,'2025-01-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-258751-2701' AND name='MICROCARE EMOLLIENT IPP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE ITO',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-245361-2606','2026-06-04'::date,'2024-06-04'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-245361-2606' AND name='MICROCARE ITO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE MHB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-402945-2612','2026-12-31'::date,'2024-05-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-402945-2612' AND name='MICROCARE MHB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE NBCG',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'LX-1906 MICROCARE NBCG','2020-02-28'::date,'2018-02-28'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,450.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='LX-1906 MICROCARE NBCG' AND name='MICROCARE NBCG');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE OHB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-260193-2608','2026-08-15'::date,'2023-08-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-260193-2608' AND name='MICROCARE OHB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE PEHG',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-502729-2611','2026-11-30'::date,'2025-05-14'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2500.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-502729-2611' AND name='MICROCARE PEHG');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE PHDG',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-252550-2612','2026-12-11'::date,'2024-12-11'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-252550-2612' AND name='MICROCARE PHDG');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE PO',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-500536-2608','2026-08-30'::date,'2025-01-30'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-500536-2608' AND name='MICROCARE PO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE QUAT EQG',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-405698-2610','2026-10-31'::date,'2024-10-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-405698-2610' AND name='MICROCARE QUAT EQG');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE SB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'C-404160-2601','2026-01-31'::date,'2024-07-22'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,250.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='C-404160-2601' AND name='MICROCARE SB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE SB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-252756-2603','2026-03-15'::date,'2024-09-15'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,150.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-252756-2603' AND name='MICROCARE SB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCARE SBB',(SELECT id FROM suppliers WHERE name='THOR' LIMIT 1),'MX-256708-2610','2026-10-23'::date,'2025-04-23'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='MX-256708-2610' AND name='MICROCARE SBB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCELAC 100',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L103154523','2025-05-04'::date,'2023-11-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L103154523' AND name='MICROCELAC 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MICROCELAC 100',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L103151725','2026-10-18'::date,'2025-04-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L103151725' AND name='MICROCELAC 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MIRISTATO DE ISOPROPILO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28592748','2026-08-15'::date,'2024-08-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28592748' AND name='MIRISTATO DE ISOPROPILO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MYRITOL 318',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29148308','2026-07-29'::date,'2025-02-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29148308' AND name='MYRITOL 318');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'MYRITOL 331 N',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28077127','2025-08-21'::date,'2024-02-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28077127' AND name='MYRITOL 331 N');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'NEUTROL TE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'80466588Q0','2025-11-06'::date,'2023-11-06'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,980.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='80466588Q0' AND name='NEUTROL TE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'NOVATA B PH',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27703826','2025-10-24'::date,'2023-10-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27703826' AND name='NOVATA B PH');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PALMITATO DE ISOPROPILO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28327912','2026-05-20'::date,'2024-05-20'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28327912' AND name='PALMITATO DE ISOPROPILO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PATCH2O A00297',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29264800','2027-03-20'::date,'2025-03-20'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29264800' AND name='PATCH2O A00297');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PEPTALDE 4.0 BC 10129',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24796231','2024-11-22'::date,'2022-11-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,180.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24796231' AND name='PEPTALDE 4.0 BC 10129');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PILISOFT LS 9760',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28639460','2026-05-31'::date,'2024-05-31'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,60.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28639460' AND name='PILISOFT LS 9760');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAPON LC 7',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29791879','2026-11-01'::date,'2025-11-01'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1800.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29791879' AND name='PLANTAPON LC 7');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAPON LGC SORB',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29123424','2026-07-18'::date,'2025-01-24'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29123424' AND name='PLANTAPON LGC SORB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAPON LGC SORB',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29361771','2026-10-21'::date,'2025-04-29'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29361771' AND name='PLANTAPON LGC SORB');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAPON SF-N',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28571936','2026-01-27'::date,'2024-08-05'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1750.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28571936' AND name='PLANTAPON SF-N');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAPON WW 1000',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27986039','2025-07-08'::date,'2024-07-09'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27986039' AND name='PLANTAPON WW 1000');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAPON WW 1000',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29355841','2026-04-15'::date,'2025-04-15'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1500.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29355841' AND name='PLANTAPON WW 1000');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAREN 1200 N',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29171175','2027-02-21'::date,'2025-02-21'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29171175' AND name='PLANTAREN 1200 N');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAREN 1200 N',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29301677','2027-04-10'::date,'2025-04-10'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29301677' AND name='PLANTAREN 1200 N');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAREN 2000 N UP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29265946','2027-03-29'::date,'2025-03-29'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29265946' AND name='PLANTAREN 2000 N UP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTAREN 818 UP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28474409','2026-07-18'::date,'2024-07-18'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28474409' AND name='PLANTAREN 818 UP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTATEX HCC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'14755337 PLANTATEX HCC','2023-12-30'::date,'2021-12-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='14755337 PLANTATEX HCC' AND name='PLANTATEX HCC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLANTATEX LLE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29135368','2026-06-12'::date,'2025-06-12'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29135368' AND name='PLANTATEX LLE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURACARE F 127 NF PRILL SURFACTANT',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'GNJ00422B','2028-01-04'::date,'2025-01-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='GNJ00422B' AND name='PLURACARE F 127 NF PRILL SURFACTANT');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURAFAC D250',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28184410','2026-06-22'::date,'2024-06-22'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28184410' AND name='PLURAFAC D250');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURAFAC LF 1300',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'67595556P0','2025-04-10'::date,'2023-04-21'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='67595556P0' AND name='PLURAFAC LF 1300');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURAFAC LF 221',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'01014475L0','2028-01-26'::date,'2026-01-26'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='01014475L0' AND name='PLURAFAC LF 221');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURAFAC LF 401',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'74545888Q0','2026-12-06'::date,'2024-12-06'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='74545888Q0' AND name='PLURAFAC LF 401');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURAFAC LF 500',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29371524U0','2026-02-26'::date,'2024-02-27'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,780.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29371524U0' AND name='PLURAFAC LF 500');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURONIC L43',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28272893','2026-06-14'::date,'2024-06-24'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28272893' AND name='PLURONIC L43');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURONIC L64',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27022729','2025-06-22'::date,'2023-04-11'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27022729' AND name='PLURONIC L64');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PLURONIC PE 6100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'58622188Q0','2027-03-26'::date,'2025-03-27'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='58622188Q0' AND name='PLURONIC PE 6100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLIGEN MA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28584753','2026-06-08'::date,'2025-06-10'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28584753' AND name='POLIGEN MA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLIGEN MV 850',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29709229','2026-09-21'::date,'2025-09-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29709229' AND name='POLIGEN MV 850');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLIGEN WE 1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'92368724U0','2026-08-05'::date,'2025-08-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='92368724U0' AND name='POLIGEN WE 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLYQUART 149 A',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29245072','2026-09-07'::date,'2025-03-11'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29245072' AND name='POLYQUART 149 A');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLYQUART ECOCLEAN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'20587311','2024-03-17'::date,'2019-03-18'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='20587311' AND name='POLYQUART ECOCLEAN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLYQUART ECOCLEAN MAX A',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'14437456P0','2024-11-02'::date,'2022-11-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='14437456P0' AND name='POLYQUART ECOCLEAN MAX A');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POLYQUART PN 60',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'23751216K0','2026-07-11'::date,'2024-07-11'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='23751216K0' AND name='POLYQUART PN 60');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'POSTBIOLIFT PW BC 10152',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'26003381','2024-05-02'::date,'2022-05-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,180.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26003381' AND name='POSTBIOLIFT PW BC 10152');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROPYLENCARBONATE S',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'23039116K0','2026-11-11'::date,'2024-11-11'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='23039116K0' AND name='PROPYLENCARBONATE S');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV 730',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'A7C25E56','2027-05-19'::date,'2025-05-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='A7C25E56' AND name='PROSOLV 730');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV RX 90',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'68091242421','2027-05-30'::date,'2024-05-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='68091242421' AND name='PROSOLV RX 90');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV SMCC 50',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'P5S3209','2028-11-26'::date,'2023-11-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='P5S3209' AND name='PROSOLV SMCC 50');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV SMCC 50 LD',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'M5S0013','2025-03-15'::date,'2020-03-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='M5S0013' AND name='PROSOLV SMCC 50 LD');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV SMCC 90',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'P9S0635','2025-04-01'::date,'2020-04-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='P9S0635' AND name='PROSOLV SMCC 90');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV SMCC 90 LM',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'LP9F5080','2027-02-10'::date,'2025-02-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='LP9F5080' AND name='PROSOLV SMCC 90 LM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV SMCC HD 90',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'D9B20A15','2025-01-31'::date,'2020-01-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='D9B20A15' AND name='PROSOLV SMCC HD 90');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROSOLV SMCC HD 90',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'D9B21H95','2026-08-13'::date,'2021-08-13'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,6000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='D9B21H95' AND name='PROSOLV SMCC HD 90');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROTEASYL TP LS 8657',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27831811','2025-04-24'::date,'2024-04-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,75.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27831811' AND name='PROTEASYL TP LS 8657');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROTEASYL TP POE LS 9818',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28389097','2025-06-12'::date,'2024-06-12'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,90.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28389097' AND name='PROTEASYL TP POE LS 9818');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROTEASYL TP POE LS 9818',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29800307','2026-11-17'::date,'2025-11-17'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,270.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29800307' AND name='PROTEASYL TP POE LS 9818');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PROTECTOL PE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'90058656P0','2025-08-31'::date,'2023-09-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='90058656P0' AND name='PROTECTOL PE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'PURISOFT PW PSE LS 9836',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24094260','2022-10-02'::date,'2020-10-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,120.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24094260' AND name='PURISOFT PW PSE LS 9836');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RADIANSKIN PW 9918',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24566517','2023-05-27'::date,'2021-05-27'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,75.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24566517' AND name='RADIANSKIN PW 9918');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RAMBUVITAL BC 10059',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'24330777','2023-04-01'::date,'2021-04-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,25.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='24330777' AND name='RAMBUVITAL BC 10059');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RELIPIDIUM BC 10096',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27128540','2025-01-12'::date,'2024-01-12'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,60.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27128540' AND name='RELIPIDIUM BC 10096');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RETALAC',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L104394500246349','2027-05-03'::date,'2025-05-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L104394500246349' AND name='RETALAC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RETALAC',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L104394500262256','2027-10-22'::date,'2025-10-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L104394500262256' AND name='RETALAC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RHEOVIS AT 120',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'17695624U0','2026-05-17'::date,'2025-05-17'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,250.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='17695624U0' AND name='RHEOVIS AT 120');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'RIBOFLAVIN FINE POWDER',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'RIB3872FP','2028-11-19'::date,'2024-11-20'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,50.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='RIB3872FP' AND name='RIBOFLAVIN FINE POWDER');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SALCARE SC 96',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'CR50271707','2026-07-27'::date,'2025-01-27'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='CR50271707' AND name='SALCARE SC 96');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SALCARE SUPER 7 AT 1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28102462','2026-03-10'::date,'2024-03-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28102462' AND name='SALCARE SUPER 7 AT 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SEANACTIV BC 10113',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28712099','2026-07-25'::date,'2024-02-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,60.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28712099' AND name='SEANACTIV BC 10113');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SHADOWNYL',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27318879','2024-06-13'::date,'2023-06-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,475.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27318879' AND name='SHADOWNYL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SLIM EXCESS A00073',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'18576329 SLIM EXCESS','2019-10-08'::date,'2017-10-08'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,675.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='18576329 SLIM EXCESS' AND name='SLIM EXCESS A00073');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SMARTVECTOR UVCE C00013',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27260566','2025-12-06'::date,'2024-06-12'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,475.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27260566' AND name='SMARTVECTOR UVCE C00013');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOKALAN CP 88',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'008A241025','2026-10-07'::date,'2024-10-07'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='008A241025' AND name='SOKALAN CP 88');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOKALAN HP 20',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'07214616K0','2023-05-15'::date,'2021-05-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='07214616K0' AND name='SOKALAN HP 20');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOKALAN HP 96',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'45483575L0','2026-03-19'::date,'2024-03-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='45483575L0' AND name='SOKALAN HP 96');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOKALAN K 30 P',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'36951109T0','2025-02-28'::date,'2022-02-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,650.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='36951109T0' AND name='SOKALAN K 30 P');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOKALAN PA 25 CL GRANULADO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'50564036W0','2025-06-16'::date,'2023-12-15'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='50564036W0' AND name='SOKALAN PA 25 CL GRANULADO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOLUPRAT DISHES PREMIUM',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28843643','2026-04-25'::date,'2024-11-01'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28843643' AND name='SOLUPRAT DISHES PREMIUM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOLUPRAT JABON LIQUIDO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'25266154','2023-03-22'::date,'2022-03-22'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25266154' AND name='SOLUPRAT JABON LIQUIDO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SOLUPRAT SULFATE FREE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28757763','2026-04-12'::date,'2024-10-11'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28757763' AND name='SOLUPRAT SULFATE FREE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SORBOLAC 400',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L103841025','2028-02-27'::date,'2025-03-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L103841025' AND name='SORBOLAC 400');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SPHINGOCERYL VEG LS 9948',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28626669','2025-08-28'::date,'2024-08-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28626669' AND name='SPHINGOCERYL VEG LS 9948');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'STARLAC',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L104260824','2027-02-14'::date,'2024-02-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,3000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L104260824' AND name='STARLAC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'SULFOPON 1216 G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28348798','2026-05-25'::date,'2024-05-25'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28348798' AND name='SULFOPON 1216 G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TABLETOSE 100',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L104291825','2027-04-19'::date,'2025-04-28'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,4000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L104291825' AND name='TABLETOSE 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TABLETOSE 70',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L104051325','2028-03-19'::date,'2025-03-24'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,2000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L104051325' AND name='TABLETOSE 70');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TABLETOSE 80',(SELECT id FROM suppliers WHERE name='MEGGLE' LIMIT 1),'L104311724','2027-04-12'::date,'2024-04-22'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='L104311724' AND name='TABLETOSE 80');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TETRONIC 901',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28273083','2026-07-08'::date,'2024-07-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28273083' AND name='TETRONIC 901');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TEXAPON K 12 G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'23739948','2022-12-14'::date,'2020-12-14'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,720.0,ARRAY['Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='23739948' AND name='TEXAPON K 12 G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TEXAPON K 12 P',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29264728','2027-03-19'::date,'2025-03-19'::date,'Inflamable'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY['Inflamable','Corrosivo','Irritante']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29264728' AND name='TEXAPON K 12 P');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TEXAPON SB 3 KC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29767703','2026-04-22'::date,'2025-10-21'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,900.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29767703' AND name='TEXAPON SB 3 KC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TEXAPON V 95 G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'26838544','2025-01-09'::date,'2023-01-10'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Corrosivo']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='26838544' AND name='TEXAPON V 95 G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOGARD Q',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29124575','2026-08-12'::date,'2025-02-18'::date,'Inflamable'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,950.0,ARRAY['Inflamable']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29124575' AND name='TINOGARD Q');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOGARD TT',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29120883','2030-01-15'::date,'2025-02-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29120883' AND name='TINOGARD TT');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOMAX CC',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'01242629U0','2025-01-29'::date,'2023-01-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,490.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='01242629U0' AND name='TINOMAX CC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOPAL CBS-X',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27187295','2028-04-04'::date,'2023-05-01'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27187295' AND name='TINOPAL CBS-X');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOPAL CBS-X',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27367380','2028-05-31'::date,'2023-06-27'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,40.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27367380' AND name='TINOPAL CBS-X');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSAN HP 100',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'SHDC15825','2027-05-21'::date,'2025-05-31'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1300.0,ARRAY['Corrosivo','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='SHDC15825' AND name='TINOSAN HP 100');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSORB A2B',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'42379197V0','2025-10-25'::date,'2023-10-25'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,450.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='42379197V0' AND name='TINOSORB A2B');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSORB A2B',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'47064124U0','2026-09-04'::date,'2024-09-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='47064124U0' AND name='TINOSORB A2B');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSORB M',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28444056','2026-07-09'::date,'2024-07-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28444056' AND name='TINOSORB M');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSORB S',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28408516','2029-06-13'::date,'2024-06-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28408516' AND name='TINOSORB S');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSORB S',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29112439','2030-01-22'::date,'2025-01-23'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29112439' AND name='TINOSORB S');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOSORB S AQUA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27023098','2025-03-01'::date,'2023-03-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27023098' AND name='TINOSORB S AQUA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TINOVIS GTC UP',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28549280','2026-02-04'::date,'2024-08-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28549280' AND name='TINOVIS GTC UP');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRICHOGEN VEG BC 10164',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29017301','2026-12-12'::date,'2024-12-12'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,150.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29017301' AND name='TRICHOGEN VEG BC 10164');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRICHOGEN VEG LS 8960',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28785490','2026-10-15'::date,'2024-10-15'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Irritante']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28785490' AND name='TRICHOGEN VEG LS 8960');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRICHOLASTYL LS 9912',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'27199146','2025-05-02'::date,'2023-05-03'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='27199146' AND name='TRICHOLASTYL LS 9912');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRILON B POLVO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'2,26E+07','2026-06-09'::date,'2024-12-11'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1400.0,ARRAY['Corrosivo','Irritante','Toxicidad Cronica']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2,26E+07' AND name='TRILON B POLVO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRILON BS POWDER',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'00361F1731','2026-06-17'::date,'2023-06-18'::date,'Toxico'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Irritante','Toxicidad Cronica']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='00361F1731' AND name='TRILON BS POWDER');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRILON G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'2419934HOC','2026-12-07'::date,'2023-12-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2419934HOC' AND name='TRILON G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRILON M GRANULADO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'95198936W0','2025-01-25'::date,'2021-07-26'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='95198936W0' AND name='TRILON M GRANULADO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRILON M MAX BIOBASED G',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'12178375L0','2028-03-05'::date,'2025-03-06'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='12178375L0' AND name='TRILON M MAX BIOBASED G');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TRILON M POLVO',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'80852175L0','2023-04-04'::date,'2022-04-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Industrial' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='80852175L0' AND name='TRILON M POLVO');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TURMERIC RHIZOME PE 95% CURCUMINOIDS HPLC',(SELECT id FROM suppliers WHERE name='GIVAUDAN' LIMIT 1),'HS00015374','2025-10-09'::date,'2023-10-12'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,15.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='HS00015374' AND name='TURMERIC RHIZOME PE 95% CURCUMINOIDS HPLC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'TURMERIC RHIZOME PE 95% CURCUMINOIDS HPLC',(SELECT id FROM suppliers WHERE name='GIVAUDAN' LIMIT 1),'HS00016241','2025-12-01'::date,'2023-12-04'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,15.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='HS00016241' AND name='TURMERIC RHIZOME PE 95% CURCUMINOIDS HPLC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ULTRA FILLING SPHERES',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'28638217','2027-01-04'::date,'2025-07-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,75.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='28638217' AND name='ULTRA FILLING SPHERES');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL A PLUS B',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'51393488Q0','2026-01-31'::date,'2023-01-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='51393488Q0' AND name='UVINUL A PLUS B');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL A PLUS GRANULAR',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'67170116K0','2027-02-18'::date,'2024-02-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='67170116K0' AND name='UVINUL A PLUS GRANULAR');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL A PLUS GRANULAR',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'K25213U011','2028-02-13'::date,'2025-02-13'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='K25213U011' AND name='UVINUL A PLUS GRANULAR');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL A PLUS GRANULAR',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'K25214U011','2028-02-14'::date,'2025-02-14'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='K25214U011' AND name='UVINUL A PLUS GRANULAR');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL MC 80',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'40961516K0','2026-09-30'::date,'2023-09-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='40961516K0' AND name='UVINUL MC 80');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL T 150',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'235068P050','2026-10-31'::date,'2023-10-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='235068P050' AND name='UVINUL T 150');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'UVINUL T 150',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'245042P050','2027-02-05'::date,'2024-02-06'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='245042P050' AND name='UVINUL T 150');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE ALGINATE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'29859447G0','2023-03-29'::date,'2022-03-29'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,90.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='29859447G0' AND name='VERDESSENCE ALGINATE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE GLUCOMANNAN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'2102991209','2025-02-10'::date,'2022-02-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,30.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2102991209' AND name='VERDESSENCE GLUCOMANNAN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE GLUCOMANNAN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'2022070901','2025-07-08'::date,'2022-07-09'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,470.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2022070901' AND name='VERDESSENCE GLUCOMANNAN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE GLUCOMANNAN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'92982188Q0','2026-09-09'::date,'2025-03-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,970.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='92982188Q0' AND name='VERDESSENCE GLUCOMANNAN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE RICE TOUCH',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'2306193170','2026-06-18'::date,'2023-06-19'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2306193170' AND name='VERDESSENCE RICE TOUCH');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE TARA',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'9405301025','2027-05-01'::date,'2025-10-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,770.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='9405301025' AND name='VERDESSENCE TARA');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VERDESSENCE XANTHAN',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'01052429U0','2026-04-09'::date,'2023-04-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,1160.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='01052429U0' AND name='VERDESSENCE XANTHAN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VITACEL CS 20 FC',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'71287230302','2028-03-30'::date,'2023-03-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='71287230302' AND name='VITACEL CS 20 FC');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VITACEL CS 30 OAT',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'7848230115','2028-01-31'::date,'2023-01-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='7848230115' AND name='VITACEL CS 30 OAT');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VITACEL CS 5 APPLE',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'7828181019 VITACEL CS 5 APPLE','2020-10-01'::date,'2018-10-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,700.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='7828181019 VITACEL CS 5 APPLE' AND name='VITACEL CS 5 APPLE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VITAMINA E ACETATO CARE',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'99582624U0','2026-06-05'::date,'2024-06-05'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,650.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='99582624U0' AND name='VITAMINA E ACETATO CARE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPHARM HPMC E 5',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'81005234042','2026-10-01'::date,'2023-10-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='81005234042' AND name='VIVAPHARM HPMC E 5');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPHARM HPMC E 50',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'21834/25','2028-04-01'::date,'2025-04-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='21834/25' AND name='VIVAPHARM HPMC E 50');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPHARM PVA 05 FINE',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'20PX04 X','2024-04-30'::date,'2021-05-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='20PX04 X' AND name='VIVAPHARM PVA 05 FINE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPHARM PVA 05 FINE',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'23O104','2028-01-01'::date,'2023-01-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='23O104' AND name='VIVAPHARM PVA 05 FINE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPHARM PVPP XL',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'50821006','2024-08-30'::date,'2021-08-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='50821006' AND name='VIVAPHARM PVPP XL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 101',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'66101230201','2028-01-30'::date,'2023-01-31'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='66101230201' AND name='VIVAPUR 101');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 105',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'6610518081 VIVAPUR 105','2023-05-30'::date,'2021-05-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='6610518081 VIVAPUR 105' AND name='VIVAPUR 105');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 105',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'7995250903','2030-09-30'::date,'2025-09-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='7995250903' AND name='VIVAPUR 105');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 112',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'56112240405','2027-01-01'::date,'2024-01-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='56112240405' AND name='VIVAPUR 112');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 14',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'66014230337','2026-09-01'::date,'2023-09-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='66014230337' AND name='VIVAPUR 14');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 200',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'56200191848','2024-11-30'::date,'2019-11-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1600.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='56200191848' AND name='VIVAPUR 200');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR 302',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'56302210329','2026-07-01'::date,'2021-07-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,400.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='56302210329' AND name='VIVAPUR 302');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR CS 150 CHARCOAL',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'54150210116','2026-04-30'::date,'2021-04-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='54150210116' AND name='VIVAPUR CS 150 CHARCOAL');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR CS 9 FM',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'32101240410','2029-04-10'::date,'2024-04-10'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='32101240410' AND name='VIVAPUR CS 9 FM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR CS 9 FM',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'32101250303','2030-03-30'::date,'2025-03-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='32101250303' AND name='VIVAPUR CS 9 FM');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR CS SENSORY 15 S',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'32440021032','2025-11-30'::date,'2020-11-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,25.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='32440021032' AND name='VIVAPUR CS SENSORY 15 S');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR CS TEX SUN',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'39026031801','2027-11-30'::date,'2023-11-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='39026031801' AND name='VIVAPUR CS TEX SUN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR CS TEX SUN',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'39026031801','2027-11-30'::date,'2023-11-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,575.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='39026031801' AND name='VIVAPUR CS TEX SUN');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR MCG 591 P',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'38591250624','2028-06-01'::date,'2025-06-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1200.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='38591250624' AND name='VIVAPUR MCG 591 P');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR MCG 611 P',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'38611221120','2025-11-01'::date,'2022-11-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='38611221120' AND name='VIVAPUR MCG 611 P');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVAPUR MCG 811 P',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'33811240117','2028-01-01'::date,'2024-01-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,800.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='33811240117' AND name='VIVAPUR MCG 811 P');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVASTAR CS 302 SV',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'2344554002 VIVASTAR CS 302 SV','2025-11-30'::date,'2023-11-30'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,250.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2344554002 VIVASTAR CS 302 SV' AND name='VIVASTAR CS 302 SV');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'VIVASTAR CS 352 SV',(SELECT id FROM suppliers WHERE name='JRS' LIMIT 1),'2131571006 VIVASTAR CS 352 SV','2027-03-01'::date,'2025-03-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,90.0,ARRAY[]::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='2131571006 VIVASTAR CS 352 SV' AND name='VIVASTAR CS 352 SV');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'Z COTE HP 1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'CNVL0802','2025-12-07'::date,'2022-12-08'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,100.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='CNVL0802' AND name='Z COTE HP 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'Z COTE HP 1',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'CNWD2002','2026-04-19'::date,'2023-04-20'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,500.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='CNWD2002' AND name='Z COTE HP 1');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'Z COTE SHEER',(SELECT id FROM suppliers WHERE name='BASF' LIMIT 1),'RTVL0981','2026-07-02'::date,'2024-08-02'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Cosmética' LIMIT 1),'1x1x1'::dimensions,0,0,300.0,ARRAY['Toxico Medio Ambiente']::text[],'ATENCION'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='RTVL0981' AND name='Z COTE SHEER');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ZINC OXIDE',(SELECT id FROM suppliers WHERE name='SUDEEP' LIMIT 1),'25AZOXF004','2027-12-01'::date,'2025-01-01'::date,'Sin Riesgo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,1000.0,ARRAY['Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25AZOXF004' AND name='ZINC OXIDE');
INSERT INTO global_samples (name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)
SELECT 'ZINC SULPHATE MONOHYDRATE',(SELECT id FROM suppliers WHERE name='SUDEEP' LIMIT 1),'25AZSMF001','2029-12-01'::date,'2025-01-03'::date,'Corrosivo'::danger_class,(SELECT id FROM market_lines WHERE name='Farmacéutica' LIMIT 1),'1x1x1'::dimensions,0,0,200.0,ARRAY['Corrosivo','Irritante','Toxico Medio Ambiente']::text[],'PELIGRO'
WHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='25AZSMF001' AND name='ZINC SULPHATE MONOHYDRATE');

COMMIT;

SELECT COUNT(*) as total_muestras FROM global_samples;