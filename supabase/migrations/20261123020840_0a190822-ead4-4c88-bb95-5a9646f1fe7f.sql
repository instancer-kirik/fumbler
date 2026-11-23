ALTER TABLE public.people ADD COLUMN IF NOT EXISTS phone_number text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'people_phone_number_length' AND conrelid = 'public.people'::regclass
  ) THEN
    ALTER TABLE public.people
      ADD CONSTRAINT people_phone_number_length CHECK (phone_number IS NULL OR char_length(phone_number) <= 40);
  END IF;
END
$$;