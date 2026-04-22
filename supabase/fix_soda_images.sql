-- Fix dirty soda image URLs so each photo matches the drink
-- Run this in the Supabase SQL editor

update recipes set image_url = 'https://images.unsplash.com/photo-6ztrgaqQzpQ?w=800&q=80'
where title = 'Classic Dirty Dr Pepper' and source = 'curated';
-- Coca-Cola glass with ice and soda

update recipes set image_url = 'https://images.unsplash.com/photo-CBwoyP69nAU?w=800&q=80'
where title = 'Raspberry Coconut Dirty Sprite' and source = 'curated';
-- Pink drink with straw

update recipes set image_url = 'https://images.unsplash.com/photo-Noqu6R1-aNs?w=800&q=80'
where title = 'Mango Habanero Dirty Lemonade' and source = 'curated';
-- Yellow drink in clear glass

update recipes set image_url = 'https://images.unsplash.com/photo-dXRRaiF_b_U?w=800&q=80'
where title = 'Peach Green Tea Dirty Soda' and source = 'curated';
-- Iced tea with straw, amber/golden colour

update recipes set image_url = 'https://images.unsplash.com/photo-vRDsrwOl_G4?w=800&q=80'
where title = 'Brown Sugar Vanilla Dirty Coke' and source = 'curated';
-- Coca-Cola bottle with straw
