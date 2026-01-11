import { useState } from 'react';
import { Sparkles, Download, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateSticker, downloadBase64Image, base64ToBlob } from '@/utils/nanoBananaApi';
import { fileToBase64 } from '@/utils/imageCompression';
import { createSticker, updateSticker, getOrCreateUserId, uploadImage, optimizePrompt } from '@/db/api';

interface StickerGeneratorProps {
  originalImageUrl: string;
  originalFile: File;
  onGenerated?: () => void;
}

export function StickerGenerator({ originalImageUrl, originalFile, onGenerated }: StickerGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [stickerId, setStickerId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [optimizedPromptText, setOptimizedPromptText] = useState('');
  const { toast } = useToast();

  const handleOptimizePrompt = async () => {
    if (!description.trim()) {
      toast({
        title: '请输入描述',
        description: '请先输入图片描述，例如"一只可爱的猫咪"',
        variant: 'destructive'
      });
      return;
    }

    try {
      setOptimizing(true);
      toast({
        title: '正在优化',
        description: 'AI正在优化您的提示词...'
      });

      const optimized = await optimizePrompt(description);
      setOptimizedPromptText(optimized);

      toast({
        title: '优化成功',
        description: '提示词已优化完成，可以开始生成表情包了'
      });
    } catch (error) {
      console.error('优化失败:', error);
      toast({
        title: '优化失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleGenerate = async () => {
    const finalPrompt = optimizedPromptText || 'Turn the people or pets in your photos into fun hand-drawn WeChat stickers. Style: Minimalist ugly-cute line drawing (doodle style). White background. Expression: Exaggerate the animal\'s expression to look extremely shocked/judgemental/lazy (based on photo). Accessories: Add cute little doodles like sweat drops, question marks, or sparkles around the head. Text: Add handwritten Chinese text at the bottom: \'[搞快点 / 累了 / 暗中观察 / 咬牙切齿 / 哈哈哈哈哈 / 是心动的感觉 / 要命 / 比心 / 土狗贴贴 / 一切随缘]\'. Ensure the text style is messy and funny.';

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
        prompt: finalPrompt,
        user_description: description || null,
        optimized_prompt: optimizedPromptText || null
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
            描述图片内容和想要的文字，AI将优化提示词并生成表情包
          </p>
        </div>

        {/* 图片描述输入区域 */}
        <div className="space-y-2">
          <Label htmlFor="description">图片描述（可选）</Label>
          <Textarea
            id="description"
            placeholder="例如：搞快点啊，怎么还没发货呢&#10;或：一只可爱的橙色猫咪&#10;或：我的宠物狗，看起来很无奈"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={generating || optimizing}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            💡 提示：输入的文字内容会被添加到表情包图片中
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleOptimizePrompt}
              disabled={!description.trim() || optimizing || generating}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {optimizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  优化中...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI优化提示词
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 优化后的提示词显示 */}
        {optimizedPromptText && (
          <div className="space-y-2">
            <Label>优化后的提示词</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              {optimizedPromptText}
            </div>
          </div>
        )}

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
                {optimizedPromptText ? '提示词已优化，点击下方按钮开始生成' : '点击下方按钮开始生成'}
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
