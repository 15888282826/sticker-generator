import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { compressImage, formatFileSize, generateSafeFileName } from '@/utils/imageCompression';
import { uploadImage } from '@/db/api';

interface ImageUploaderProps {
  onImageUploaded: (url: string, file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageUploaded, disabled }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: '文件格式错误',
        description: '请上传图片文件（JPG、PNG、WEBP）',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setProgress(30);

      const compressionResult = await compressImage(file);
      setProgress(60);

      if (compressionResult.compressed) {
        toast({
          title: '图片已自动压缩',
          description: `原始大小: ${formatFileSize(compressionResult.originalSize)}, 压缩后: ${formatFileSize(compressionResult.finalSize)}`
        });
      }

      const safeFileName = generateSafeFileName(compressionResult.file.name);
      const uploadPath = `uploads/${safeFileName}`;
      const url = await uploadImage(compressionResult.file, uploadPath);
      setProgress(100);

      toast({
        title: '上传成功',
        description: '图片已成功上传'
      });

      onImageUploaded(url, compressionResult.file);
    } catch (error) {
      console.error('上传失败:', error);
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      });
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">上传照片</h3>
          <p className="text-sm text-muted-foreground">
            支持 JPG、PNG、WEBP 格式，最大 1MB
          </p>
        </div>

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="预览"
              className="w-full h-64 object-contain rounded-lg bg-muted"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleClearPreview}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Upload className="h-12 w-12 text-primary animate-pulse" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? '上传中...' : '点击或拖拽上传图片'}
              </p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              上传进度: {progress}%
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>
    </Card>
  );
}
