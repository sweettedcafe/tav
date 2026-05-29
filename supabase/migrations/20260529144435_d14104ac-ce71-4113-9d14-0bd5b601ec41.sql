
-- 1) PROFILES: hide email from public; only authenticated can read raw table.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO authenticated;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, handle, bio, headline, avatar_url, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2) CERTIFICATES: remove public SELECT; expose verification through SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "View certificates" ON public.certificates;

CREATE POLICY "Owners view own certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.certificates FROM anon;
GRANT SELECT ON public.certificates TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE (
  certificate_code text,
  recipient_name text,
  program_name text,
  issued_at timestamptz,
  revoked_at timestamptz,
  handle text,
  full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.certificate_code, c.recipient_name, c.program_name, c.issued_at, c.revoked_at,
         p.handle, p.full_name
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  WHERE c.certificate_code = _code
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 3) QUIZ QUESTIONS: hide correct_index/explanation; expose grading RPC.
DROP POLICY IF EXISTS "View questions" ON public.quiz_questions;

CREATE POLICY "Admins view questions"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT ON public.quiz_questions TO service_role;

CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker = on) AS
SELECT id, quiz_id, question, options, sort_order
FROM public.quiz_questions;

GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.grade_quiz(_quiz_id uuid, _answers jsonb)
RETURNS TABLE (
  score integer,
  passed boolean,
  pass_threshold integer,
  per_question jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_correct int := 0;
  v_per_question jsonb := '[]'::jsonb;
  v_pass_threshold int;
  q record;
  user_answer int;
  is_correct boolean;
BEGIN
  SELECT pass_threshold INTO v_pass_threshold FROM public.quizzes WHERE id = _quiz_id;
  IF v_pass_threshold IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  SELECT count(*) INTO v_total FROM public.quiz_questions WHERE quiz_id = _quiz_id;

  FOR q IN SELECT id, correct_index, explanation FROM public.quiz_questions WHERE quiz_id = _quiz_id LOOP
    user_answer := NULLIF(_answers->>q.id::text, '')::int;
    is_correct := user_answer IS NOT NULL AND user_answer = q.correct_index;
    IF is_correct THEN v_correct := v_correct + 1; END IF;
    v_per_question := v_per_question || jsonb_build_object(
      'question_id', q.id,
      'correct_index', q.correct_index,
      'is_correct', is_correct,
      'explanation', q.explanation
    );
  END LOOP;

  score := CASE WHEN v_total = 0 THEN 0 ELSE round(100.0 * v_correct / v_total)::int END;
  passed := score >= v_pass_threshold;
  pass_threshold := v_pass_threshold;
  per_question := v_per_question;

  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.quiz_attempts (user_id, quiz_id, score, passed, answers)
    VALUES (auth.uid(), _quiz_id, score, passed, _answers);
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grade_quiz(uuid, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.grade_quiz(uuid, jsonb) TO authenticated;

-- 4) EXERCISES: hide expected_sql; add expected_result snapshot + grading RPC.
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS expected_result_json jsonb;

DROP POLICY IF EXISTS "View exercises" ON public.exercises;

CREATE POLICY "Admins view exercises"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.exercises FROM anon, authenticated;
GRANT SELECT ON public.exercises TO service_role;

CREATE OR REPLACE VIEW public.exercises_public
WITH (security_invoker = on) AS
SELECT id, lesson_id, title, prompt, difficulty, starter_sql, dataset_ids, order_matters, created_at,
       (expected_result_json IS NOT NULL) AS gradable
FROM public.exercises;

GRANT SELECT ON public.exercises_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.grade_exercise(_exercise_id uuid, _submitted jsonb, _sql_text text)
RETURNS TABLE (is_correct boolean, gradable boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected jsonb;
  v_order_matters boolean;
  v_norm_sub jsonb;
  v_norm_exp jsonb;
BEGIN
  SELECT expected_result_json, order_matters INTO v_expected, v_order_matters
  FROM public.exercises WHERE id = _exercise_id;

  gradable := v_expected IS NOT NULL;
  is_correct := false;

  IF gradable THEN
    IF v_order_matters THEN
      is_correct := _submitted = v_expected;
    ELSE
      SELECT jsonb_agg(elem ORDER BY elem::text) INTO v_norm_sub FROM jsonb_array_elements(_submitted) elem;
      SELECT jsonb_agg(elem ORDER BY elem::text) INTO v_norm_exp FROM jsonb_array_elements(v_expected) elem;
      is_correct := coalesce(v_norm_sub, '[]'::jsonb) = coalesce(v_norm_exp, '[]'::jsonb);
    END IF;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.exercise_submissions (user_id, exercise_id, sql_text, is_correct, result_preview)
    VALUES (auth.uid(), _exercise_id,
            coalesce(_sql_text, ''),
            is_correct,
            (SELECT jsonb_agg(e) FROM (SELECT e FROM jsonb_array_elements(_submitted) e LIMIT 20) sub));
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.grade_exercise(uuid, jsonb, text) TO authenticated;

-- 5) STORAGE: tighten certificate bucket to owner-only reads (path is "<user_id>/...").
DROP POLICY IF EXISTS "Auth read certificates" ON storage.objects;

CREATE POLICY "Owners read own certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- 6) Lock down has_role execute — keep available to the roles used by RLS (anon needs it for OR has_role(...) branches in published-content policies).
-- Already SECURITY DEFINER; nothing to revoke without breaking public catalog reads.
