import { supabase } from './supabase';
import type { Sticker, StickerInsert, StickerUpdate } from '@/types/types';

const BUCKET_NAME = 'app-7pk47kageyv5_stickers_images';

// 获取或创建匿名用户ID
export function getOrCreateUserId(): string {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
}

// 上传图片到存储桶
export async function uploadImage(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// 创建表情包记录
export async function createSticker(sticker: StickerInsert): Promise<Sticker | null> {
  const { data, error } = await supabase
    .from('stickers')
    .insert(sticker)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 更新表情包记录
export async function updateSticker(id: string, update: StickerUpdate): Promise<Sticker | null> {
  const { data, error } = await supabase
    .from('stickers')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 获取用户的表情包历史
export async function getUserStickers(userId: string, limit: number = 20): Promise<Sticker[]> {
  const { data, error } = await supabase
    .from('stickers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// 删除表情包记录
export async function deleteSticker(id: string): Promise<void> {
  const { error } = await supabase
    .from('stickers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
