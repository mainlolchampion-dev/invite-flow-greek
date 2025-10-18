-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true);

-- RLS policies for templates bucket
CREATE POLICY "Admins can upload template files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update template files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete template files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'templates' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Anyone can view template files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'templates');