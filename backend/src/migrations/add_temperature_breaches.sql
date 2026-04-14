-- Migration: Add temperature_breaches column to batches table
-- Date: 2026-04-14
-- Purpose: Track the number of temperature violations for each batch

-- Add temperature_breaches column
ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS temperature_breaches INTEGER DEFAULT 0 CHECK (temperature_breaches >= 0);

-- Initialize breach count based on existing alerts
UPDATE batches b
SET temperature_breaches = (
    SELECT COUNT(*)
    FROM alerts a
    WHERE a.batch_id = b.batch_id
    AND a.type = 'temperature_breach'
)
WHERE b.temperature_breaches = 0;

-- Create a function to automatically increment breach counter
CREATE OR REPLACE FUNCTION track_temperature_breach()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if temperature has gone outside the target range
    IF (NEW.temperature < NEW.target_temp_min OR NEW.temperature > NEW.target_temp_max)
       AND (OLD.temperature IS NULL OR 
            (OLD.temperature >= OLD.target_temp_min AND OLD.temperature <= OLD.target_temp_max)) THEN
        -- Temperature just breached - increment counter
        NEW.temperature_breaches := OLD.temperature_breaches + 1;
        
        -- Also create an alert for this breach
        INSERT INTO alerts (batch_id, type, severity, message, details)
        VALUES (
            NEW.batch_id,
            'temperature_breach',
            (CASE 
                WHEN ABS(NEW.temperature - (NEW.target_temp_min + NEW.target_temp_max) / 2) > 5 THEN 'critical'
                WHEN ABS(NEW.temperature - (NEW.target_temp_min + NEW.target_temp_max) / 2) > 2 THEN 'high'
                ELSE 'medium'
            END)::alert_severity_enum,
            format('Temperature breach detected: %s°C (Target: %s°C - %s°C)', 
                   NEW.temperature, NEW.target_temp_min, NEW.target_temp_max),
            jsonb_build_object(
                'temperature', NEW.temperature,
                'target_min', NEW.target_temp_min,
                'target_max', NEW.target_temp_max,
                'breach_count', NEW.temperature_breaches
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS temperature_breach_tracker ON batches;

-- Create trigger to track temperature breaches
CREATE TRIGGER temperature_breach_tracker
    BEFORE UPDATE OF temperature ON batches
    FOR EACH ROW
    EXECUTE FUNCTION track_temperature_breach();

-- Add comment for documentation
COMMENT ON COLUMN batches.temperature_breaches IS 'Number of times this batch has experienced temperature excursions outside target range';
