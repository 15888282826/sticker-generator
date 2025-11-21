// 图片压缩工具函数

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const INITIAL_QUALITY = 0.8;

export interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
}

// 验证文件名是否只包含英文字母和数字
export function validateFileName(fileName: string): boolean {
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  return /^[a-zA-Z0-9_-]+$/.test(nameWithoutExt);
}

// 生成安全的文件名
export function generateSafeFileName(originalName: string): string {
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `sticker_${timestamp}_${random}${ext}`;
}

// 压缩图片
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (originalSize <= MAX_FILE_SIZE) {
    return {
      file,
      compressed: false,
      originalSize,
      finalSize: originalSize
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取canvas上下文'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          let quality = INITIAL_QUALITY;
          let blob: Blob | null = null;

          while (quality > 0.1) {
            blob = await new Promise<Blob | null>((res) => {
              canvas.toBlob((b) => res(b), 'image/webp', quality);
            });

            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            if (blob.size <= MAX_FILE_SIZE) {
              break;
            }

            quality -= 0.1;
          }

          if (!blob) {
            reject(new Error('图片压缩失败'));
            return;
          }

          const safeFileName = generateSafeFileName(file.name.replace(/\.[^/.]+$/, '.webp'));
          const compressedFile = new File([blob], safeFileName, {
            type: 'image/webp',
            lastModified: Date.now()
          });

          resolve({
            file: compressedFile,
            compressed: true,
            originalSize,
            finalSize: compressedFile.size
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

// 将文件转换为Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
