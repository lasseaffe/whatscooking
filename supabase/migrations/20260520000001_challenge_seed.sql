insert into challenge_definitions (title, description, emoji, category, difficulty, requires_proof) values
-- Handicap
('One Arm Bandit',     'Tie one arm behind your back. Cook anything.',                                   '🦾', 'handicap', 'hard',   true),
('Shock Collar Cook',  'Every mistake = buzz. No taste testing allowed.',                                '😵‍💫', 'handicap', 'insane', true),
('Blindfolded Prep',   'Prep all ingredients blindfolded. Cook normally.',                               '🙈', 'handicap', 'hard',   true),
('Oven Mitts Only',    'Wear oven mitts the entire time. No removing them.',                             '🧤', 'handicap', 'medium', false),
('Non-Dominant Hand',  'Cook exclusively with your non-dominant hand.',                                  '✋', 'handicap', 'medium', false),
-- Appliance
('Microwave Only',     'Full dinner. Microwave is your only heat source.',                               '📦', 'appliance', 'medium', false),
('Toaster Only',       'No stove, no oven. The toaster is your chef.',                                  '🍞', 'appliance', 'hard',   true),
('Rice Cooker Only',   'Cook the entire meal in a rice cooker.',                                         '🍚', 'appliance', 'medium', false),
('Kettle Only',        'Boiling water is your only heat. Make it work.',                                 '🫖', 'appliance', 'insane', true),
('Appliance Roulette', 'Spin for a random appliance. That is your only tool.',                           '🎰', 'appliance', 'insane', true),
-- Speedrun
('15-Min Meal',        'Full plate. 15 minutes. Timer starts on accept.',                                '⚡', 'speedrun', 'easy',   false),
('5-Min Breakfast',    'Breakfast on the table in 5 minutes flat.',                                      '🏃', 'speedrun', 'easy',   false),
('10-Min Dinner',      'A proper dinner. 10 minutes. No shortcuts.',                                     '⏱️', 'speedrun', 'medium', false),
('3-Course in 20',     'Starter, main, dessert. 20 minutes total.',                                      '💀', 'speedrun', 'insane', true),
('30-Min Feast',       'Five dishes. Thirty minutes. Feed everyone.',                                    '🏆', 'speedrun', 'hard',   false),
-- Wildcard
('Mystery Box',        'Random rules drawn from all categories. No preview.',                            '🎁', 'wildcard', 'insane', true),
('Fusion Chaos',       'Combine two random cuisines in one dish.',                                       '🌍', 'wildcard', 'medium', false),
('Opposite Day',       'Make a savoury dish sweet, or a sweet dish savoury.',                            '🔄', 'wildcard', 'medium', false),
('Pantry Purge',       'Use only what is already in your pantry. No shopping.',                         '🗄️', 'wildcard', 'easy',   false),
('Double Dare',        'Spin twice. Complete both challenges simultaneously.',                           '🎲', 'wildcard', 'insane', true),
-- Dare
('Narrate Everything', 'Out-loud commentary on every action. No silence.',                               '🎙️', 'dare', 'easy',   false),
('Cook in Costume',    'Full costume. Your choice. Photos required.',                                    '🎭', 'dare', 'medium', true),
('Silent Kitchen',     'No talking, no music, no timer sounds. Pure focus.',                             '🤫', 'dare', 'easy',   false),
('Gordon Mode',        'Criticise every ingredient and every step out loud.',                            '👨‍🍳', 'dare', 'easy',   false),
('Closed Eyes 5 Min',  'Eyes closed for the first 5 minutes of cooking. Partner must not help.',        '👁️', 'dare', 'hard',   true);
