// 数据库表类型定义

export interface Sticker {
  id: string;
  user_id: string;
  original_image_url: string;
  generated_image_url: string | null;
  prompt: string;
  created_at: string;
}

export interface StickerInsert {
  user_id: string;
  original_image_url: string;
  generated_image_url?: string | null;
  prompt: string;
}

export interface StickerUpdate {
  generated_image_url?: string;
}
