-- Fix broken Unsplash image URLs (short-hash format no longer works)
-- Run this once in the correct Supabase project

update recipes set image_url = 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80'
where title = 'Classic Dirty Dr Pepper';

update recipes set image_url = 'https://images.unsplash.com/photo-1536935338788-294dc5a6e5b6?w=800&q=80'
where title = 'Raspberry Coconut Dirty Sprite';

update recipes set image_url = 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&q=80'
where title = 'Mango Habanero Dirty Lemonade';

update recipes set image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80'
where title = 'Peach Green Tea Dirty Soda';

update recipes set image_url = 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&q=80'
where title = 'Brown Sugar Vanilla Dirty Coke';
