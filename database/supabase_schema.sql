-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 10),
    total_collected INTEGER NOT NULL DEFAULT 0 CHECK (total_collected >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

-- Create point_history table
CREATE TABLE IF NOT EXISTS point_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    points_added INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    redeemed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (phone_number) REFERENCES customers(phone_number) ON DELETE CASCADE
);

-- Create index on phone_number and timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_history_phone ON point_history(phone_number);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON point_history(timestamp DESC);

-- Row Level Security (RLS) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated service role
CREATE POLICY "Service role full access" ON customers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access" ON point_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow anonymous reads (for customer lookup)
CREATE POLICY "Allow anonymous read customers" ON customers
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous read history" ON point_history
    FOR SELECT
    TO anon
    USING (true);

-- Allow anonymous inserts (for collecting points)
CREATE POLICY "Allow anonymous insert history" ON point_history
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE customers IS 'Stores customer loyalty program data';
COMMENT ON TABLE point_history IS 'Tracks all point transactions (earned and redeemed)';
COMMENT ON COLUMN customers.points IS 'Current points (0-10), max 10 before redemption required';
COMMENT ON COLUMN customers.total_collected IS 'Total number of free drinks redeemed';
