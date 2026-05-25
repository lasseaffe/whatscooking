-- Challenge Mode: populate structured rules / objective / target / strategy tip
-- for every seeded challenge. Matched on title (see 20260520000001_challenge_seed.sql).
-- Content is hand-written and challenge-specific (Apple 4.3 / anti-slop).

-- ── Handicap ────────────────────────────────────────────────────────────────
update challenge_definitions set
  objective    = 'Plate a full dish using only one arm.',
  rules         = array['Tie or tuck one arm behind your back before you start','That arm stays out of action the entire cook','No leaning the bowl on your body to cheat the grip','Snap proof of the tied arm and the finished plate'],
  strategy_tip  = 'Pick a recipe with few simultaneous steps — one-handed multitasking is brutal.'
where title = 'One Arm Bandit';

update challenge_definitions set
  objective    = 'Cook a full dish with zero taste-testing.',
  rules         = array['No tasting at any point — season by instinct alone','Treat every fumble as a "buzz": call it out loud','Trust your timings, not your tongue','Photograph the result before the first bite'],
  strategy_tip  = 'Measure seasoning precisely up front — you cannot adjust on the fly.'
where title = 'Shock Collar Cook';

update challenge_definitions set
  objective    = 'Prep every ingredient blindfolded, then cook normally.',
  rules         = array['Blindfold on for ALL prep: wash, peel, chop, measure','Only remove it once knives are down and prep is done','Keep fingers tucked — safety first, speed second','Proof: a photo of the blindfold and the prepped mise en place'],
  strategy_tip  = 'Lay tools out in a fixed order beforehand so you can find them by feel.'
where title = 'Blindfolded Prep';

update challenge_definitions set
  objective    = 'Complete the whole cook wearing oven mitts.',
  rules         = array['Both oven mitts stay on from first step to plating','No slipping one off "just for a second"','If you drop it, you pick it up — still mitted','Finish a complete, edible dish'],
  strategy_tip  = 'Avoid recipes with small, fiddly ingredients — mitts turn garlic into a boss fight.'
where title = 'Oven Mitts Only';

update challenge_definitions set
  objective    = 'Cook entirely with your non-dominant hand.',
  rules         = array['Dominant hand stays in your pocket or behind your back','Cut, stir, flip and plate with the weak hand only','No two-handed shortcuts','Plate something you would actually eat'],
  strategy_tip  = 'Go slow on the knife work — control beats speed when the wrong hand is steering.'
where title = 'Non-Dominant Hand';

-- ── Appliance ───────────────────────────────────────────────────────────────
update challenge_definitions set
  objective    = 'Make a full dinner using only the microwave.',
  rules         = array['The microwave is your ONLY heat source','No stove, oven, kettle, toaster or air fryer','Cold-assembly steps are fine; all cooking is microwave','Plate a hot, complete dinner'],
  strategy_tip  = 'Cover food and cook in short bursts, stirring between — even heat is the whole game.'
where title = 'Microwave Only';

update challenge_definitions set
  objective    = 'Cook a meal with the toaster as your only appliance.',
  rules         = array['Toaster only — no stove, no oven','Anything that needs heat goes through the toaster','Mind the crumbs and the fire risk — supervise it','Proof of the toaster + the finished dish required'],
  strategy_tip  = 'Thin, flat ingredients toast evenly; thick ones just burn outside and stay raw within.'
where title = 'Toaster Only';

update challenge_definitions set
  objective    = 'Cook the entire meal in a rice cooker.',
  rules         = array['Everything cooks in the rice cooker — start to finish','No transferring to a pan to "finish it off"','Layering ingredients by cook-time is allowed','Plate one complete meal from the pot'],
  strategy_tip  = 'Add quick-cooking items late by stacking them on top once the base is going.'
where title = 'Rice Cooker Only';

update challenge_definitions set
  objective    = 'Build a meal using only boiling water from a kettle.',
  rules         = array['A kettle of boiling water is your only heat','No stove, microwave or oven','Steeping, soaking and pouring-over are your techniques','Make it genuinely edible, not just survivable'],
  strategy_tip  = 'Pre-soak grains and thin-slice everything — boiling water cooks by patience, not power.'
where title = 'Kettle Only';

update challenge_definitions set
  objective    = 'Spin for one random appliance — that is your only tool.',
  rules         = array['Spin assigns ONE appliance: that is your only heat source','No swapping, no "just the kettle for water" exceptions','Plate a complete, hot dish using it alone','Snap proof of the appliance and the finished plate'],
  strategy_tip  = 'Whatever you draw, lean into its one strength instead of fighting its limits.'
where title = 'Appliance Roulette';

-- ── Speedrun (target_seconds set) ─────────────────────────────────────────────
update challenge_definitions set
  objective     = 'Get a full plate on the table in 15 minutes.',
  rules         = array['Timer starts the moment you accept','A complete plate must be served before 15:00','Pre-chopped or shortcut ingredients are fair play','Stop the clock when the dish hits the table'],
  target_seconds = 900,
  strategy_tip   = 'Read the whole recipe first — lost seconds come from surprises, not slow hands.'
where title = '15-Min Meal';

update challenge_definitions set
  objective     = 'Serve breakfast in 5 minutes flat.',
  rules         = array['Five minutes, breakfast, plated — go','Clock starts on accept','Any breakfast counts if it is hot or assembled','Beat 5:00 to win'],
  target_seconds = 300,
  strategy_tip   = 'Eggs and toast in parallel beats anything cooked in sequence.'
where title = '5-Min Breakfast';

update challenge_definitions set
  objective     = 'Cook a proper dinner in 10 minutes — no shortcuts.',
  rules         = array['Ten minutes for a real, balanced dinner','No instant meals or pre-cooked mains','Protein + a side, both hot','Plate before the clock hits 10:00'],
  target_seconds = 600,
  strategy_tip   = 'Get your pan screaming hot before the timer — thin cuts cook in minutes.'
where title = '10-Min Dinner';

update challenge_definitions set
  objective     = 'Starter, main and dessert in 20 minutes total.',
  rules         = array['Three courses, one 20-minute clock','Each course must be distinct and edible','Run them in parallel — sequential will not fit','All three plated before 20:00'],
  target_seconds = 1200,
  strategy_tip   = 'Start the dessert that needs to set first, then work backwards to the starter.'
where title = '3-Course in 20';

update challenge_definitions set
  objective     = 'Five dishes in thirty minutes — feed the whole table.',
  rules         = array['Five separate dishes in 30 minutes','Everything must be ready to serve together','Use every burner and surface you have','All five done before 30:00'],
  target_seconds = 1800,
  strategy_tip   = 'Batch the prep for all five up front, then cook on a staggered timeline.'
where title = '30-Min Feast';

-- ── Wildcard ──────────────────────────────────────────────────────────────────
update challenge_definitions set
  objective    = 'Obey a random rule drawn from any category.',
  rules         = array['Draw one rule blind — no preview, no re-draw','Whatever it says, that is now law for this cook','Combine it with whatever you were already making','Document the rule and the result'],
  strategy_tip  = 'Keep your dish simple so a curveball rule does not capsize the whole plan.'
where title = 'Mystery Box';

update challenge_definitions set
  objective    = 'Fuse two random cuisines into one dish.',
  rules         = array['Pick (or draw) two distinct cuisines','Both must be recognisable in the final dish','No "they share an ingredient" cop-outs','Name your fusion dish when you finish'],
  strategy_tip  = 'Bridge the two with a shared technique — a taco and a curry both love a warm flatbread.'
where title = 'Fusion Chaos';

update challenge_definitions set
  objective    = 'Flip a flavour: savoury made sweet, or sweet made savoury.',
  rules         = array['Choose a dish and invert its core flavour profile','The swap must be deliberate, not accidental','It still has to be genuinely edible','Explain the flip in your completion note'],
  strategy_tip  = 'Salt and fat make sweet things work savoury — and vice versa with a little acid.'
where title = 'Opposite Day';

update challenge_definitions set
  objective    = 'Cook using only what is already in your kitchen.',
  rules         = array['Zero shopping — pantry, fridge and freezer only','No borrowing from a neighbour either','Use up something close to expiring if you can','Plate a real meal from what you have'],
  strategy_tip  = 'Build around your most perishable ingredient and let the pantry fill the gaps.'
where title = 'Pantry Purge';

update challenge_definitions set
  objective    = 'Take on two challenges at the same time.',
  rules         = array['Spin twice — both rules apply simultaneously','No tackling them one after the other','If they conflict, find a creative compromise','Proof must show both constraints honoured'],
  strategy_tip  = 'Look for a single dish that satisfies both rules at once instead of merging two cooks.'
where title = 'Double Dare';

-- ── Dare ────────────────────────────────────────────────────────────────────
update challenge_definitions set
  objective    = 'Narrate every single action out loud.',
  rules         = array['Commentate your cook like a live broadcast','No silent stretches — if your hands move, talk','Announce every ingredient and every step','Bonus points for a dramatic sign-off'],
  strategy_tip  = 'Pretend a beginner is following along — narrate the WHY, not just the what.'
where title = 'Narrate Everything';

update challenge_definitions set
  objective    = 'Cook the whole meal in full costume.',
  rules         = array['Pick a costume — the sillier the better','Stay in it from first step to plating','No removing pieces because they get in the way','Photos of the costume + the dish are required'],
  strategy_tip  = 'Choose a costume that leaves your hands free — capes and oil are not friends.'
where title = 'Cook in Costume';

update challenge_definitions set
  objective    = 'Cook in total silence — pure focus.',
  rules         = array['No talking, no music, no TV','Silence timer alarms — watch the clock instead','Communicate by gesture only if others are around','Hold the silence until the dish is plated'],
  strategy_tip  = 'Without audio cues, rely on sight and smell — watch for colour and listen with your nose.'
where title = 'Silent Kitchen';

update challenge_definitions set
  objective    = 'Critique every ingredient and step, out loud, in character.',
  rules         = array['Channel your inner shouty chef the entire time','Every ingredient gets a verdict — no mercy','Critique your own technique as you go','Deliver one big finale review of the finished plate'],
  strategy_tip  = 'The best roasts are specific — attack the wilted herb, not just "everything".'
where title = 'Gordon Mode';

update challenge_definitions set
  objective    = 'Cook the first 5 minutes with your eyes closed.',
  rules         = array['Eyes shut for the opening 5 minutes of the cook','A partner may watch for safety but must NOT help','Open them only after the 5-minute mark','Proof: the timer and the dish you ended up with'],
  strategy_tip  = 'Do your sharpest, riskiest knife work AFTER the 5 minutes — keep blind steps gentle.'
where title = 'Closed Eyes 5 Min';
