-- Add recall support without altering existing enum values
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE;

-- Ensure trigger logic does not overwrite recalled state
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    IF NEW.is_recalled = TRUE THEN
        RETURN NEW;
    END IF;

    IF NEW.trust_score < 50 THEN
        NEW.status = 'compromised';
    ELSIF NEW.current_stage = 'pharmacy' THEN
        NEW.status = 'delivered';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
