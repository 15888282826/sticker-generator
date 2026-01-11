-- 添加用户描述和优化后的提示词字段
ALTER TABLE stickers 
ADD COLUMN IF NOT EXISTS user_description text,
ADD COLUMN IF NOT EXISTS optimized_prompt text;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_stickers_user_description ON stickers(user_description);

-- 添加注释
COMMENT ON COLUMN stickers.user_description IS '用户输入的图片描述';
COMMENT ON COLUMN stickers.optimized_prompt IS 'AI优化后的提示词';