-- 0010: Add 'ai' scan profile for Harizeon AI-Armor
ALTER TYPE scan_profile ADD VALUE IF NOT EXISTS 'ai';

-- Entitlement: Enable 'ai' scan profile across all tiers (free, starter, growth, scale, enterprise)
-- Acts as a viral acquisition wedge so any developer can run a 30s AI security check on their asset.
UPDATE plans 
SET limits = jsonb_set(limits, '{profiles}', limits->'profiles' || '["ai"]'::jsonb)
WHERE NOT (limits->'profiles' @> '["ai"]'::jsonb);
