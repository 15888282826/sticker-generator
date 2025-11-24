import { useState } from 'react';
import { Sparkles, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateSticker, downloadBase64Image, base64ToBlob } from '@/utils/nanoBananaApi';
import { fileToBase64 } from '@/utils/imageCompression';
import { createSticker, updateSticker, getOrCreateUserId, uploadImage } from '@/db/api';

interface StickerGeneratorProps {
  originalImageUrl: string;
  originalFile: File;
  onGenerated?: () => void;
}

export function StickerGenerator({ originalImageUrl, originalFile, onGenerated }: StickerGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [stickerId, setStickerId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      toast({
        title: '开始生成',
        description: '正在使用AI生成表情包，请耐心等待...'
      });

      const userId = getOrCreateUserId();
      const base64 = await fileToBase64(originalFile);
      const mimeType = originalFile.type as 'image/png' | 'image/jpeg' | 'image/webp';

      const record = await createSticker({
        user_id: userId,
        original_image_url: originalImageUrl,
        prompt: 'Turn the people or pets in your photos into fun hand-drawn WeChat stickers. Style: Minimalist ugly-cute line drawing (doodle style). White background. Expression: Exaggerate the animal\'s expression to look extremely shocked/judgemental/lazy (based on photo). Accessories: Add cute little doodles like sweat drops, question marks, or sparkles around the head. Text: Add handwritten Chinese text at the bottom: \'[搞快点 / 累了 / 暗中观察 / 咬牙切齿 / 哈哈哈哈哈 / 是心动的感觉 / 要命 / 比心 / 土狗贴贴 / 一切随缘]\'. Ensure the text style is messy and funny.'
      });

      const generatedBase64 = await generateSticker({
        imageBase64: base64,
        mimeType
      });

      setGeneratedImage(generatedBase64);

      if (record) {
        const blob = base64ToBlob(generatedBase64, 'image/png');
        const file = new File([blob], `generated_${Date.now()}.png`, { type: 'image/png' });
        const generatedUrl = await uploadImage(file, `generated/${file.name}`);

        await updateSticker(record.id, {
          generated_image_url: generatedUrl
        });

        setStickerId(record.id);
      }

      toast({
        title: '生成成功',
        description: '表情包已生成，可以下载使用了！'
      });

      onGenerated?.();
    } catch (error) {
      console.error('生成失败:', error);
      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      downloadBase64Image(generatedImage, `sticker_${Date.now()}.png`);
      toast({
        title: '下载成功',
        description: '表情包已保存到本地'
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">生成表情包</h3>
          <p className="text-sm text-muted-foreground">
            使用AI将照片转换为手绘风格表情包
          </p>
        </div>

        {generatedImage ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={`data:image/png;base64,${generatedImage}`}
                alt="生成的表情包"
                className="w-full h-64 object-contain rounded-lg bg-muted"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                className="flex-1"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                下载表情包
              </Button>
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="lg"
                disabled={generating}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                重新生成
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                点击下方按钮开始生成
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成表情包
                </>
              )}
            </Button>
          </div>
        )}

        {generating && (
          <div className="text-center text-sm text-muted-foreground">
            <p>AI正在创作中，预计需要30-60秒</p>
            <p className="text-xs mt-1">请保持页面打开，不要刷新</p>
          </div>
        )}
      </div>
    </Card>
  );
}
