-- يُنفَّذ مرة واحدة في Supabase SQL Editor عند تفعيل جولات الموتوسيكلات في الإنتاج.
-- يفترض تنفيذ add-mountain-safari.sql أولاً. Mock لا يحتاجه؛ البيانات في الذاكرة فقط.

ALTER TYPE "ExperienceCategory" ADD VALUE IF NOT EXISTS 'MOTORCYCLE_TOUR';
