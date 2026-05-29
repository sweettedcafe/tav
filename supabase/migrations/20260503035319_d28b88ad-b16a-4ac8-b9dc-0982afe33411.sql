-- Add try-it columns and lesson summary
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS try_it_sql text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS try_it_datasets text[] DEFAULT '{}'::text[];