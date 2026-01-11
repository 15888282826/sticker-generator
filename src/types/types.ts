// 数据库表类型定义

export interface Sticker {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string | null;
  prompt: string;
  user_description: string | null;
  optimized_prompt: string | null;
  created_at: string;
}

export interface StickerInsert {
  user_id: string;
  original_image_url: string;
  generated_image_url?: string | null;
  prompt: string;
  user_description?: string | null;
  optimized_prompt?: string | null;
}

export interface StickerUpdate {
  generated_image_url?: string;
  optimized_prompt?: string;
}
