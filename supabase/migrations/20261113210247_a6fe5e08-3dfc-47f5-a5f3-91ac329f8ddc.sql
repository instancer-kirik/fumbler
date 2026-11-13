INSERT INTO public.quiz_options (question_id, position, label, effects)
SELECT q.id, v.position, v.label, v.effects::jsonb
FROM public.quiz_questions q
JOIN (VALUES
  (28, 10, 'A greenhouse city with solar panels', '{"s":{"core.solarpunk":2}}'),
  (28, 11, 'A candlelit library with handwritten notes', '{"s":{"core.dark_academia":2}}'),
  (28, 12, 'A neon sunset over a digital grid', '{"s":{"core.vaporwave":2}}'),
  (29, 10, 'A mossy clearing with tiny lights', '{"s":{"core.fairycore":2}}'),
  (29, 11, 'A rooftop server den above the city', '{"s":{"core.cybercore":2}}'),
  (29, 12, 'A garage show with borrowed amps', '{"s":{"core.grunge":2}}'),
  (30, 10, 'Rain against library windows', '{"s":{"core.dark_academia":2}}'),
  (30, 11, 'A warped cassette in an empty mall', '{"s":{"core.vaporwave":2}}'),
  (30, 12, 'A distorted guitar through a cheap amp', '{"s":{"core.grunge":2}}'),
  (31, 10, 'I want to build a greener corner of it', '{"s":{"core.solarpunk":2}}'),
  (32, 10, 'Iridescent layers that belong in the woods', '{"s":{"core.fairycore":2}}'),
  (32, 11, 'Reflective hardware and black mesh', '{"s":{"core.cybercore":2}}')
) AS v(question_position, position, label, effects) ON q.position = v.question_position AND q.framework = 'internet' AND q.active = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.quiz_options existing
  WHERE existing.question_id = q.id AND existing.label = v.label
);