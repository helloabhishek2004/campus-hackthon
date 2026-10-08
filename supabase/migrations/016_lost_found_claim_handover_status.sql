-- The application records handover as a distinct claim lifecycle state.
ALTER TYPE lost_found_claim_status ADD VALUE IF NOT EXISTS 'handover';
