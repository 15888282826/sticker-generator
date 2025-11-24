// Nano Banana API 调用工具

const API_URL = 'https://api-integrations.appmiaoda.com/app-7pk47kageyv5/api-Xa6JZ58oPMEa/v1beta/models/gemini-3-pro-image-preview:generateContent';
const APP_ID = import.meta.env.VITE_APP_ID;
const TIMEOUT = 300000; // 300秒超时

const DEFAULT_PROMPT = `Turn the people or pets in your photos into fun hand-drawn WeChat stickers. Style: Minimalist ugly-cute line drawing (doodle style). White background. Expression: Exaggerate the animal's expression to look extremely shocked/judgemental/lazy (based on photo). Accessories: Add cute little doodles like sweat drops, question marks, or sparkles around the head. Text: Add handwritten Chinese text at the bottom: '[搞快点 / 累了 / 暗中观察 / 咬牙切齿 / 哈哈哈哈哈 / 是心动的感觉 / 要命 / 比心 / 土狗贴贴 / 一切随缘]'. Ensure the text style is messy and funny.`;

export interface GenerateStickerRequest {
  imageBase64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  prompt?: string;
}

export interface GenerateStickerResponse {
  status: number;
  msg: string;
  candidates?: Array<{
    content: {
      role: string;
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: unknown[];
  }>;
}

// 从Markdown格式文本中提取Base64图片
export function extractBase64FromMarkdown(markdown: string): string | null {
  const regex = /!\[image\]\(data:image\/[^;]+;base64,([^)]+)\)/;
  const match = markdown.match(regex);
  return match ? match[1] : null;
}

// 调用Nano Banana API生成表情包
export async function generateSticker(request: GenerateStickerRequest): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': APP_ID
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: request.mimeType,
                  data: request.imageBase64
                }
              },
              {
                text: request.prompt || DEFAULT_PROMPT
              }
            ]
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data: GenerateStickerResponse = await response.json();

    if (data.status !== 0) {
      throw new Error(data.msg || 'API返回错误');
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('API未返回生成结果');
    }

    const candidate = data.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('图片内容不符合安全规范，请更换图片');
    }

    const markdownText = candidate.content.parts[0]?.text;
    if (!markdownText) {
      throw new Error('API返回数据格式错误');
    }

    const base64Image = extractBase64FromMarkdown(markdownText);
    if (!base64Image) {
      throw new Error('无法从API响应中提取图片');
    }

    return base64Image;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      throw error;
    }
    throw new Error('生成表情包失败');
  }
}

// 将Base64转换为Blob
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// 下载Base64图片
export function downloadBase64Image(base64: string, filename: string = 'sticker.png') {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
