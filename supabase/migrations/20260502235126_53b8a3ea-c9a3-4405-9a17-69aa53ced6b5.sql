
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'learner');
CREATE TYPE public.track_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'needs_revision');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  handle TEXT UNIQUE,
  email TEXT,
  bio TEXT,
  headline TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_handle TEXT;
BEGIN
  new_handle := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), '[^a-z0-9]+', '-', 'gi'));
  new_handle := new_handle || '-' || substr(NEW.id::text, 1, 6);
  INSERT INTO public.profiles (id, full_name, email, handle)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, new_handle);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CURRICULUM ============
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  level public.track_level NOT NULL DEFAULT 'beginner',
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View published tracks" ON public.tracks FOR SELECT USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tracks" ON public.tracks FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (track_id, slug)
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View published modules" ON public.modules FOR SELECT USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug)
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own progress" ON public.lesson_progress FOR DELETE USING (auth.uid() = user_id);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pass_threshold INT NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Datasets
CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  schema_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View datasets" ON public.datasets FOR SELECT USING (true);
CREATE POLICY "Admins manage datasets" ON public.datasets FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  starter_sql TEXT,
  expected_sql TEXT,
  dataset_ids UUID[] NOT NULL DEFAULT '{}',
  order_matters BOOLEAN NOT NULL DEFAULT false,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View exercises" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Admins manage exercises" ON public.exercises FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sql_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  result_preview JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own submissions" ON public.exercise_submissions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert own submissions" ON public.exercise_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects (capstone briefs)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  scenario TEXT NOT NULL,
  deliverables TEXT,
  rubric JSONB,
  dataset_ids UUID[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View published projects" ON public.projects FOR SELECT USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  writeup TEXT,
  code TEXT,
  dashboard_url TEXT,
  file_path TEXT,
  status public.submission_status NOT NULL DEFAULT 'draft',
  score INT,
  feedback TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER touch_project_subs BEFORE UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "View own project submissions" ON public.project_submissions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR status = 'approved');
CREATE POLICY "Insert own project submissions" ON public.project_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own project submissions" ON public.project_submissions FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'needs_revision'));
CREATE POLICY "Admins update any submission" ON public.project_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_code TEXT UNIQUE NOT NULL,
  issued_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_path TEXT,
  recipient_name TEXT NOT NULL,
  program_name TEXT NOT NULL DEFAULT 'The Analytics Vanguard',
  revoked_at TIMESTAMPTZ,
  UNIQUE (user_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('datasets', 'datasets', true),
  ('avatars', 'avatars', true),
  ('certificates', 'certificates', true),
  ('submissions', 'submissions', false);

-- Storage policies
CREATE POLICY "Public read datasets" ON storage.objects FOR SELECT USING (bucket_id = 'datasets');
CREATE POLICY "Admins write datasets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'datasets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update datasets" ON storage.objects FOR UPDATE USING (bucket_id = 'datasets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete datasets" ON storage.objects FOR DELETE USING (bucket_id = 'datasets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Admins write certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own submissions" ON storage.objects FOR SELECT USING (bucket_id = 'submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users upload own submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
