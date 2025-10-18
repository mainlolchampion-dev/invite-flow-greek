-- Fix the generate_slug function to avoid ambiguous column reference
DROP FUNCTION IF EXISTS public.generate_slug(text);

CREATE OR REPLACE FUNCTION public.generate_slug(base_text text)
RETURNS text AS $$
DECLARE
  generated_slug text;
  counter integer := 0;
BEGIN
  generated_slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  generated_slug := trim(both '-' from generated_slug);
  
  WHILE EXISTS (SELECT 1 FROM public.user_projects WHERE user_projects.slug = generated_slug) LOOP
    counter := counter + 1;
    generated_slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
  END LOOP;
  
  RETURN generated_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;