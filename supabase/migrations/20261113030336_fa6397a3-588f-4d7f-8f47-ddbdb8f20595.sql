-- Broaden the quiz for artists, entrepreneurs, and independent creatives.
UPDATE public.quiz_questions
SET prompt = 'After a long stretch of making, building, or dealing with life, you are most likely to…'
WHERE position = 1
  AND prompt = 'Friday night after a long work week. You''re most likely to…';

WITH new_questions(position, framework, prompt) AS (
  VALUES
    (41, 'creative', 'When a new idea grabs you, what happens first?'),
    (42, 'creative', 'Which creative medium feels most like home right now?'),
    (43, 'projects', 'What kind of creative company helps you most?'),
    (44, 'projects', 'Which part of a project would you gladly own?'),
    (45, 'projects', 'What would make a stalled project possible again?'),
    (46, 'projects', 'What would you be excited to start or join?'),
    (47, 'projects', 'What does success with a project actually mean to you?'),
    (48, 'creative', 'How would you like someone you date to relate to your creative life?')
)
INSERT INTO public.quiz_questions(position, framework, prompt)
SELECT n.position, n.framework, n.prompt
FROM new_questions n
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions q WHERE q.prompt = n.prompt);

WITH option_rows(question_prompt, position, label, effects) AS (
  VALUES
    ('When a new idea grabs you, what happens first?', 1, 'Make a rough version while the spark is still hot.', '{"s":{"creative.maker":2,"project.starter":1},"a":{"archetypes":[{"name":"The Maker","definition":"Turns sparks into tangible drafts before the feeling evaporates."}],"offering.roles":["Prototyping partner"],"qualities":["Hands-on"]}}'::jsonb),
    ('When a new idea grabs you, what happens first?', 2, 'Gather references and start building its world.', '{"s":{"creative.worldbuilder":2},"a":{"archetypes":[{"name":"The Worldbuilder","definition":"Finds the atmosphere, rules, and hidden connections inside an idea."}],"offering.roles":["Worldbuilding partner"],"qualities":["Imaginative"]}}'::jsonb),
    ('When a new idea grabs you, what happens first?', 3, 'Find someone to riff with until it gets stranger and better.', '{"s":{"creative.collaborator":2,"project.duo":1},"a":{"offering.roles":["Brainstorming partner"],"collaborations":[{"kind":"Creative project","role":"Co-creator","lookingFor":"Someone to riff with and make the idea tangible","notes":"Quiz suggestion—edit freely."}],"qualities":["Collaborative"]}}'::jsonb),
    ('When a new idea grabs you, what happens first?', 4, 'Shape it into something other people can use or experience.', '{"s":{"creative.director":2,"project.builder":1},"a":{"archetypes":[{"name":"The Creative Director","definition":"Connects an idea to the experience it could give other people."}],"offering.roles":["Creative direction"],"qualities":["Purposeful"]}}'::jsonb),
    ('Which creative medium feels most like home right now?', 1, 'Visual art, design, photography, or video.', '{"s":{"creative.maker":1},"a":{"skills":[{"name":"Visual or design practice","level":"working","intent":"practice","note":"Self-selected in the quiz; adjust the details."}]}}'::jsonb),
    ('Which creative medium feels most like home right now?', 2, 'Music, sound, voice, or performance.', '{"s":{"creative.collaborator":1},"a":{"skills":[{"name":"Music, sound, or performance","level":"working","intent":"practice","note":"Self-selected in the quiz; adjust the details."}]}}'::jsonb),
    ('Which creative medium feels most like home right now?', 3, 'Writing, narrative, characters, or worldbuilding.', '{"s":{"creative.worldbuilder":1},"a":{"skills":[{"name":"Writing or narrative","level":"working","intent":"practice","note":"Self-selected in the quiz; adjust the details."}]}}'::jsonb),
    ('Which creative medium feels most like home right now?', 4, 'Making physical things, code, tools, or inventions.', '{"s":{"creative.maker":1,"project.builder":1},"a":{"skills":[{"name":"Making or technical problem-solving","level":"working","intent":"practice","note":"Self-selected in the quiz; adjust the details."}]}}'::jsonb),
    ('What kind of creative company helps you most?', 1, 'Quiet parallel work, with a low-pressure check-in later.', '{"s":{"project.solo":2},"a":{"offering.roles":["Parallel-work partner"],"collaborations":[{"kind":"Creative practice","role":"Parallel-work partner","lookingFor":"Quiet company and low-pressure check-ins","notes":"Quiz suggestion—edit freely."}]}}'::jsonb),
    ('What kind of creative company helps you most?', 2, 'One trusted co-conspirator who gets the weird parts.', '{"s":{"project.duo":2},"a":{"offering.roles":["Creative duo partner"],"collaborations":[{"kind":"Creative duo","role":"Co-creator","lookingFor":"One trusted person for an ongoing creative exchange","notes":"Quiz suggestion—edit freely."}]}}'::jsonb),
    ('What kind of creative company helps you most?', 3, 'A small crew with different strengths and shared ownership.', '{"s":{"project.crew":2},"a":{"offering.roles":["Small-crew collaborator"],"collaborations":[{"kind":"Creative crew","role":"Collaborator","lookingFor":"A small crew with complementary strengths and shared ownership","notes":"Quiz suggestion—edit freely."}]}}'::jsonb),
    ('What kind of creative company helps you most?', 4, 'A loose network I can drift through, contribute to, and leave.', '{"s":{"project.network":2},"a":{"offering.roles":["Creative community connector"],"collaborations":[{"kind":"Creative network","role":"Contributor","lookingFor":"A loose network for low-pressure exchanges and occasional projects","notes":"Quiz suggestion—edit freely."}]}}'::jsonb),
    ('Which part of a project would you gladly own?', 1, 'Starting: naming possibilities and making the first move.', '{"s":{"project.starter":2},"a":{"offering.roles":["Idea starter"]}}'::jsonb),
    ('Which part of a project would you gladly own?', 2, 'Building: turning the idea into a plan or prototype.', '{"s":{"project.builder":2},"a":{"offering.roles":["Prototype builder"]}}'::jsonb),
    ('Which part of a project would you gladly own?', 3, 'Finishing: editing, polishing, and getting it out the door.', '{"s":{"project.finisher":2},"a":{"offering.roles":["Finishing partner"]}}'::jsonb),
    ('Which part of a project would you gladly own?', 4, 'Connecting: sharing it and finding its people.', '{"s":{"project.connector":2},"a":{"offering.roles":["Release or audience partner"]}}'::jsonb),
    ('What would make a stalled project possible again?', 1, 'Materials, space, tools, or practical help.', '{"a":{"collaborations":[{"kind":"Project support","role":"Creative practitioner","lookingFor":"Materials, space, tools, or practical help without taking over the vision","notes":"Quiz suggestion—edit freely."}],"values":["Resourcefulness"]}}'::jsonb),
    ('What would make a stalled project possible again?', 2, 'Honest feedback and a gentle next milestone.', '{"a":{"collaborations":[{"kind":"Creative accountability","role":"Creative practitioner","lookingFor":"Honest feedback and gentle, mutually chosen milestones","notes":"Quiz suggestion—edit freely."}],"qualities":["Reflective"]}}'::jsonb),
    ('What would make a stalled project possible again?', 3, 'Someone whose strengths fill the gaps in mine.', '{"s":{"project.duo":1},"a":{"collaborations":[{"kind":"Complementary collaboration","role":"Co-creator","lookingFor":"Someone with complementary skills and clear expectations","notes":"Quiz suggestion—edit freely."}],"values":["Complementarity"]}}'::jsonb),
    ('What would make a stalled project possible again?', 4, 'Funding, an audience, or a believable path to sustainability.', '{"s":{"project.connector":1},"a":{"collaborations":[{"kind":"Creative sustainability","role":"Project owner","lookingFor":"Funding, audience, or a practical path toward sustaining the work","notes":"Quiz suggestion—edit freely."}],"aspirations":["Build sustainable support for my creative work"]}}'::jsonb),
    ('What would you be excited to start or join?', 1, 'A band, recording project, or performance.', '{"a":{"offering.roles":["Bandmate or performance partner"],"collaborations":[{"kind":"Band or performance project","role":"Open role","lookingFor":"People who want to write, rehearse, record, or perform together","notes":"Quiz suggestion—edit freely."}],"aspirations":["Make music or performance work with other people"]}}'::jsonb),
    ('What would you be excited to start or join?', 2, 'An art, zine, film, or narrative project.', '{"a":{"offering.roles":["Art or narrative collaborator"],"collaborations":[{"kind":"Art, zine, film, or narrative project","role":"Open role","lookingFor":"People who want to make an expressive work together","notes":"Quiz suggestion—edit freely."}],"aspirations":["Make an expressive project with other people"]}}'::jsonb),
    ('What would you be excited to start or join?', 3, 'A tool, game, invention, or delightfully weird build.', '{"s":{"project.builder":1},"a":{"offering.roles":["Build or invention partner"],"collaborations":[{"kind":"Tool, game, or invention","role":"Open role","lookingFor":"People who want to prototype and test an unusual build","notes":"Quiz suggestion—edit freely."}],"aspirations":["Build a tool, game, or invention with other people"]}}'::jsonb),
    ('What would you be excited to start or join?', 4, 'A small venture, event, space, or community experiment.', '{"s":{"project.connector":1},"a":{"offering.roles":["Venture or community co-founder"],"collaborations":[{"kind":"Small venture or community experiment","role":"Open role","lookingFor":"People who want to create a useful venture, event, space, or community","notes":"Quiz suggestion—edit freely."}],"aspirations":["Grow an independent venture or community project"]}}'::jsonb),
    ('What does success with a project actually mean to you?', 1, 'I made something true to the vision, even if it stayed small.', '{"a":{"values":["Creative integrity"],"aspirations":["Finish work that feels true to my vision"]}}'::jsonb),
    ('What does success with a project actually mean to you?', 2, 'It reached people who genuinely connected with it.', '{"a":{"values":["Connection"],"aspirations":["Share work with people who genuinely connect with it"]}}'::jsonb),
    ('What does success with a project actually mean to you?', 3, 'It helps support my life without consuming the rest of it.', '{"a":{"values":["Sustainability"],"aspirations":["Build a creative life that supports me without consuming me"]}}'::jsonb),
    ('What does success with a project actually mean to you?', 4, 'It opened the door to the next collaboration or adventure.', '{"a":{"values":["Curiosity"],"aspirations":["Let each project lead to new people and adventures"]}}'::jsonb),
    ('How would you like someone you date to relate to your creative life?', 1, 'Join in sometimes, as play rather than unpaid labor.', '{"a":{"offering.roles":["Creative playmate"],"desires.relational":["Share parts of my creative life without making every date a work session"]}}'::jsonb),
    ('How would you like someone you date to relate to your creative life?', 2, 'Have their own practice too, so we can trade discoveries.', '{"s":{"project.duo":1},"a":{"desires.relational":["Mutual curiosity about each other’s work, with room for separate practices"]}}'::jsonb),
    ('How would you like someone you date to relate to your creative life?', 3, 'Respect my solitary time and celebrate what emerges afterward.', '{"s":{"project.solo":1},"a":{"desires.relational":["Respect for solitary creative time and genuine celebration afterward"]}}'::jsonb),
    ('How would you like someone you date to relate to your creative life?', 4, 'Build a shared world, project, or venture with me over time.', '{"s":{"creative.collaborator":1,"project.duo":1},"a":{"collaborations":[{"kind":"Shared creative life","role":"Co-creator","lookingFor":"A partner interested in building something meaningful together over time","notes":"Quiz suggestion—edit freely."}],"desires.relational":["Build something meaningful together over time"]}}'::jsonb)
)
INSERT INTO public.quiz_options(question_id, position, label, effects)
SELECT q.id, o.position, o.label, o.effects
FROM option_rows o
JOIN public.quiz_questions q ON q.prompt = o.question_prompt
WHERE NOT EXISTS (
  SELECT 1 FROM public.quiz_options existing
  WHERE existing.question_id = q.id AND existing.label = o.label
);