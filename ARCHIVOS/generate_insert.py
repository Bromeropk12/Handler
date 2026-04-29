import re, sys

MARKET_LINE_MAP = {
    'COSMETICA':   'Cosmética',
    'COSMÉTICA':   'Cosmética',
    'INDUSTRIAL':  'Industrial',
    'FARMA':       'Farmacéutica',
    'FARMACEUTICA':'Farmacéutica',
    'FARMACÉUTICA':'Farmacéutica',
}

SUPPLIER_MAP = {
    'BASF':                  'BASF',
    'JRS':                   'JRS',
    'THOR':                  'THOR',
    'MEGGLE':                'MEGGLE',
    'SUDEEP':                'SUDEEP',
    'GIVAUDAN':              'GIVAUDAN',
    'GIVAUDAN INTERNATIONAL':'GIVAUDAN',
    'K+S KALI':              None,
    'ESCO':                  None,
}

DANGER_CLASS_MAP = {
    'SIN RIESGO': 'Sin Riesgo',
    'INFLAMABLE':  'Inflamable',
    'CORROSIVO':   'Corrosivo',
    'TOXICO':      'Toxico',
    'TÓXICO':      'Toxico',
    'COMBURENTE':  'Comburente',
    'EXPLOSIVO':   'Explosivo',
}

PICTO_COLS = [
    'Explosivo','Inflamable','Comburente','Gas Bajo Presion',
    'Corrosivo','Toxicidad Aguda','Irritante','Toxicidad Cronica',
    'Toxico Medio Ambiente',
]

def parse_date(s):
    s = s.strip()
    if not s: return None
    parts = s.split('/')
    if len(parts) == 3:
        d, m, y = parts
        return f"{y}-{m.zfill(2)}-{d.zfill(2)}"
    return None

def esc(s):
    return s.replace("'", "''")

with open(r'C:\Users\Briann\Downloads\Handler\ARCHIVOS\insercion_de_Muetras.csv', encoding='utf-8-sig') as f:
    content = f.read()

content = content.replace('\r\n', '\n').replace('\r', '\n')
lines = [l for l in content.split('\n')[1:] if l.strip()]

out_lines = [
    "BEGIN;",
    "",
    "-- Asegurar proveedores K+S KALI y ESCO (usados en CSV pero no existentes) → mapear a BASF",
    "-- Nota: K+S KALI y ESCO no existen, se sustituyen por BASF en el script",
    "",
]

ok = 0
skipped = []

for i, line in enumerate(lines, start=2):
    parts = line.strip().split(';')
    if len(parts) < 17:
        skipped.append(f"-- SKIP fila {i}: pocas columnas")
        continue

    name           = parts[0].strip()
    lot            = parts[1].strip()
    supplier_csv   = parts[2].strip()
    danger_csv     = parts[3].strip().upper()
    signal_csv     = parts[4].strip().upper()

    pictos = []
    for idx in range(9):
        val = parts[5+idx].strip().upper() if (5+idx) < len(parts) else 'NO'
        if val in ('SI','SÍ','YES','TRUE','1'):
            pictos.append(PICTO_COLS[idx])

    weight_s    = parts[14].strip() if len(parts) > 14 else '1'
    date_mfg_s  = parts[15].strip() if len(parts) > 15 else ''
    date_exp_s  = parts[16].strip() if len(parts) > 16 else ''
    ml_csv      = parts[17].strip().upper() if len(parts) > 17 else ''

    ml_name = MARKET_LINE_MAP.get(ml_csv)
    if not ml_name:
        skipped.append(f"-- SKIP fila {i}: línea mercado desconocida '{ml_csv}': {name}")
        continue

    supplier_key = supplier_csv.strip().upper()
    supplier_db  = SUPPLIER_MAP.get(supplier_key, None)
    if supplier_db is None:
        if supplier_csv.upper() not in ('K+S KALI','ESCO'):
            supplier_db = supplier_csv   # pass-through
        else:
            supplier_db = 'BASF'         # fallback

    danger = DANGER_CLASS_MAP.get(danger_csv, 'Sin Riesgo')
    signal = 'PELIGRO' if 'PELIGRO' in signal_csv else 'ATENCION'

    try:
        w = float(weight_s.replace(',','.').replace(' ',''))
        if w <= 0: w = 1.0
    except:
        w = 1.0

    dmfg = parse_date(date_mfg_s)
    dexp = parse_date(date_exp_s)
    if not dmfg or not dexp:
        skipped.append(f"-- SKIP fila {i}: fechas inválidas '{date_mfg_s}'/'{date_exp_s}': {name}")
        continue
    if dmfg > dexp:
        dmfg, dexp = dexp, dmfg

    if pictos:
        pictos_sql = "ARRAY[" + ",".join(f"'{p}'" for p in pictos) + "]::text[]"
    else:
        pictos_sql = "ARRAY[]::text[]"

    sql = (
        f"INSERT INTO global_samples "
        f"(name,supplier_id,lot,expiration_date,manufacture_date,ghs_danger_class,market_line_id,dimensions,total_units,available_units,total_weight_grams,ghs_pictograms,signal_word)\n"
        f"SELECT '{esc(name)}',"
        f"(SELECT id FROM suppliers WHERE name='{esc(supplier_db)}' LIMIT 1),"
        f"'{esc(lot)}',"
        f"'{dexp}'::date,"
        f"'{dmfg}'::date,"
        f"'{danger}'::danger_class,"
        f"(SELECT id FROM market_lines WHERE name='{esc(ml_name)}' LIMIT 1),"
        f"'1x1x1'::dimensions,"
        f"0,0,{w},{pictos_sql},'{signal}'"
        f"\nWHERE NOT EXISTS (SELECT 1 FROM global_samples WHERE lot='{esc(lot)}' AND name='{esc(name)}');"
    )
    out_lines.append(sql)
    ok += 1

out_lines.extend(["", "COMMIT;", "", f"SELECT COUNT(*) as total_muestras FROM global_samples;"])

# Agregar warnings al inicio
warn_block = ["-- ADVERTENCIAS (filas omitidas):"] + skipped + [""]
final = out_lines[:1] + warn_block + out_lines[1:]

output_path = r'C:\Users\Briann\Downloads\Handler\database\insercion\seed_muestras_produccion.sql'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(final))

print(f"OK: {ok} filas válidas")
print(f"Omitidas: {len(skipped)}")
print(f"SQL generado en: {output_path}")
