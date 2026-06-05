-- Disable Row Level Security (RLS) on local environment for simplicity
-- since authentication and authorization are handled in application code
ALTER TABLE users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_lines      DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE shelves           DISABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_suppliers   DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_samples    DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispensed_samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE movements         DISABLE ROW LEVEL SECURITY;
