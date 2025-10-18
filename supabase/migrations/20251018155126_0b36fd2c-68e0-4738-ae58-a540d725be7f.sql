-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create templates table
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_el text NOT NULL,
  description_en text,
  description_el text,
  event_type text NOT NULL CHECK (event_type IN ('wedding', 'baptism', 'party')),
  thumbnail_url text,
  html_content text,
  asset_urls jsonb DEFAULT '[]'::jsonb,
  editable_fields jsonb DEFAULT '{}'::jsonb,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  has_countdown boolean DEFAULT false,
  has_location_map boolean DEFAULT false,
  has_rsvp boolean DEFAULT false,
  preview_images text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Anyone can view active templates"
  ON public.templates
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all templates"
  ON public.templates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create user_projects table
CREATE TABLE public.user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  project_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  modified_html text,
  custom_css text,
  is_published boolean DEFAULT false,
  published_url text,
  preferred_language text DEFAULT 'el' CHECK (preferred_language IN ('en', 'el')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_projects
CREATE POLICY "Users can view their own projects"
  ON public.user_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.user_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.user_projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.user_projects
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published projects"
  ON public.user_projects
  FOR SELECT
  USING (is_published = true);

-- Create user_invitations table
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.user_projects(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('wedding', 'baptism', 'party')),
  event_date timestamptz,
  event_time time,
  event_location jsonb DEFAULT '{}'::jsonb,
  custom_data jsonb DEFAULT '{}'::jsonb,
  rsvp_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
CREATE POLICY "Users can view their own invitations"
  ON public.user_invitations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own invitations"
  ON public.user_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invitations"
  ON public.user_invitations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invitations"
  ON public.user_invitations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create rsvp_responses table
CREATE TABLE public.rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid REFERENCES public.user_invitations(id) ON DELETE CASCADE NOT NULL,
  guest_name text NOT NULL,
  guest_email text,
  guest_phone text,
  attending boolean,
  guest_count integer DEFAULT 1,
  message text,
  responded_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rsvp_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rsvp_responses
CREATE POLICY "Anyone can submit RSVP"
  ON public.rsvp_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Invitation owners can view RSVPs"
  ON public.rsvp_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_invitations
      WHERE user_invitations.id = rsvp_responses.invitation_id
        AND user_invitations.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_slug(base_text text)
RETURNS text AS $$
DECLARE
  slug text;
  counter integer := 0;
BEGIN
  slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  slug := trim(both '-' from slug);
  
  WHILE EXISTS (SELECT 1 FROM public.user_projects WHERE user_projects.slug = slug) LOOP
    counter := counter + 1;
    slug := lower(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || counter;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;