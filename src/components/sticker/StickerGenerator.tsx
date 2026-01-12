import { useState } from 'react';
import { Sparkles, Download, Loader2 } from 'lucide-react';
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [stickerId, setStickerId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      
      // 如果用户输入了描述，先优化提示词
      let finalPrompt = 'Turn the person or pet in the uploaded photo into a hilarious hand-drawn urgent delivery meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a white background, rough hand-drawn texture. Expression: Exaggerate the subject\'s facial features to show extreme shock and anxiety, with wide-open eyes and an open mouth conveying the "why isn\'t it here yet" disbelief and impatience. Accessories: Add urgency-enhancing doodles around the subject\'s head, such as giant sweat drops, explosion symbols, dense question marks, and clocks or lightning bolts. Text: Add one random handwritten Chinese text from ["怎么还没好", "怎么还没到货", "什么时候到货", "快点啊", "抓紧", "我要马上到！"] at the bottom center; the text style must be messy, hasty, and visually impactful, accounting for no more than 1/5 of the total height.';
      let optimizedPromptText: string | null = null;

      if (description.trim()) {
        toast({
          title: '正在优化提示词',
          description: 'AI正在根据您的描述优化提示词...'
        });

        try {
          const optimized = await optimizePrompt(description);
          finalPrompt = optimized;
          optimizedPromptText = optimized;
          
          toast({
            title: '优化完成',
            description: '即将开始生成表情包'
          });
          
          // 等待一下让用户看到优化结果
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error('优化失败:', error);
          toast({
            title: '优化失败',
            description: '将使用默认提示词生成',
            variant: 'destructive'
          });
        }
      }

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
        optimized_prompt: optimizedPromptText
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
          <h3 className="text-lg font-semibold mb-2">生成催货表情包 🔥</h3>
          <p className="text-sm text-muted-foreground">
            专为"急急国王"打造，表达"等货等到心急火燎"的催货神器
          </p>
        </div>

        {/* 图片描述输入区域 */}
        <div className="space-y-2">
          <Label htmlFor="description">催货描述（可选）</Label>
          <Textarea
            id="description"
            placeholder="示例1：怎么还没到货啊&#10;示例2：快点啊，我等不及了&#10;示例3：什么时候到货"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={generating}
            className="min-h-[100px]"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>催货风格</strong>：极简丑萌线条画，白色背景，粗糙手绘质感</p>
            <p>😱 <strong>情绪强化</strong>：极度震惊、崩溃、咆哮或生无可恋，表现"怎么还没到"的焦急感</p>
            <p>⚡ <strong>紧迫配饰</strong>：巨大汗滴、爆炸符号、密集问号、时钟/闪电</p>
            <p>📝 <strong>催货文案</strong>：怎么还没好/怎么还没到货/什么时候到货/快点啊/抓紧/我要马上到！</p>
          </div>
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
