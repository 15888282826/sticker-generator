import { useState } from 'react';
import { Smile } from 'lucide-react';
import { ImageUploader } from '@/components/sticker/ImageUploader';
import { StickerGenerator } from '@/components/sticker/StickerGenerator';
import { StickerHistory } from '@/components/sticker/StickerHistory';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<{
    url: string;
    file: File;
  } | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleImageUploaded = (url: string, file: File) => {
    setUploadedImage({ url, file });
  };

  const handleGenerated = () => {
    setRefreshHistory(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Smile className="w-10 h-10 text-primary" />
            <h1 className="font-bold text-foreground text-[32px]">催货表情包生成器 🔥</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            专为"急急国王"打造！上传照片，AI生成"等货等到心急火燎"的催货表情包
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <ImageUploader
              onImageUploaded={handleImageUploaded}
              disabled={false}
            />
          </div>
          <div>
            {uploadedImage ? (
              <StickerGenerator
                originalImageUrl={uploadedImage.url}
                originalFile={uploadedImage.file}
                onGenerated={handleGenerated}
              />
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg p-12">
                <p className="text-muted-foreground text-center">
                  请先上传图片
                </p>
              </div>
            )}
          </div>
        </div>

        <StickerHistory refresh={refreshHistory} />
      </div>
    </div>
  );
}
