-- Add AutoPilot control to Fields table
ALTER TABLE public.fields
ADD COLUMN IF NOT EXISTS auto_pilot_enabled BOOLEAN DEFAULT false;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.fields.auto_pilot_enabled IS 'Indicates if the Twin 2.0 AI AutoPilot is active for this field';
