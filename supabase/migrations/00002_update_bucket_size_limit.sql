/*
# 更新存储桶文件大小限制

## 修改内容
- 将 `app-7pk47kageyv5_stickers_images` 存储桶的最大文件大小从 1MB 更新为 5MB

## 说明
- 新的文件大小限制: 5242880 字节 (5MB)
*/

-- 更新存储桶的文件大小限制
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'app-7pk47kageyv5_stickers_images';