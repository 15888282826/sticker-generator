/*
# 创建表情包生成器数据库结构

## 1. 新建表
- `stickers`
  - `id` (uuid, 主键, 默认生成)
  - `user_id` (text, 匿名用户UUID)
  - `original_image_url` (text, 原始图片URL)
  - `generated_image_url` (text, 生成的表情包URL)
  - `prompt` (text, 使用的提示词)
  - `created_at` (timestamptz, 默认当前时间)

## 2. 存储桶
- 创建 `app-7pk47kageyv5_stickers_images` 存储桶
- 设置为公开访问
- 最大文件大小: 1MB
- 允许的文件类型: image/jpeg, image/png, image/webp

## 3. 安全策略
- 表不启用RLS，所有用户可读写（匿名用户场景）
- 存储桶允许所有用户上传和读取
*/

-- 创建表情包记录表
CREATE TABLE IF NOT EXISTS stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  original_image_url text NOT NULL,
  generated_image_url text,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_stickers_user_id ON stickers(user_id);
CREATE INDEX idx_stickers_created_at ON stickers(created_at DESC);

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7pk47kageyv5_stickers_images',
  'app-7pk47kageyv5_stickers_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 存储桶策略：允许所有用户上传
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'app-7pk47kageyv5_stickers_images');

-- 存储桶策略：允许所有用户读取
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-7pk47kageyv5_stickers_images');

-- 存储桶策略：允许所有用户删除自己的文件
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'app-7pk47kageyv5_stickers_images');