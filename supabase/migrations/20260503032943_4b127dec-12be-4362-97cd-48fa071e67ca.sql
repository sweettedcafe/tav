
-- Interview question bank
CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'sql', -- sql | python | statistics | behavioral | case
  difficulty TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  sample_answer TEXT,
  hints TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'curated', -- curated | admin
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View published interview questions"
  ON public.interview_questions FOR SELECT
  USING (is_published OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage interview questions"
  ON public.interview_questions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_interview_questions BEFORE UPDATE ON public.interview_questions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Mock interview sessions
CREATE TABLE public.mock_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Mock Interview',
  focus TEXT NOT NULL DEFAULT 'sql', -- sql | python | mixed | behavioral
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | submitted | reviewed
  overall_feedback TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or admin sessions"
  ON public.mock_interview_sessions FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Insert own sessions"
  ON public.mock_interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own sessions"
  ON public.mock_interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins update sessions"
  ON public.mock_interview_sessions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_mock_sessions BEFORE UPDATE ON public.mock_interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Mock interview responses (one per question per session)
CREATE TABLE public.mock_interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answer TEXT,
  self_rating INTEGER,
  admin_feedback TEXT,
  admin_score INTEGER,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_interview_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own or admin responses"
  ON public.mock_interview_responses FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Insert own responses"
  ON public.mock_interview_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own responses"
  ON public.mock_interview_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins update responses"
  ON public.mock_interview_responses FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_mock_responses BEFORE UPDATE ON public.mock_interview_responses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_mock_responses_session ON public.mock_interview_responses(session_id);
CREATE INDEX idx_interview_questions_cat ON public.interview_questions(category, difficulty);
