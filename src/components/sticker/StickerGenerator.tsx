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
    // 如果用户输入了描述但还没有优化，先自动优化
    if (description.trim() && !optimizedPromptText) {
      toast({
        title: '正在优化提示词',
        description: 'AI正在根据您的描述优化提示词...'
      });
      
      try {
        setOptimizing(true);
        const optimized = await optimizePrompt(description);
        setOptimizedPromptText(optimized);
        
        toast({
          title: '优化完成',
          description: '即将开始生成表情包'
        });
        
        // 等待一下让用户看到优化结果
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 使用优化后的提示词继续生成
        await generateWithPrompt(optimized);
      } catch (error) {
        console.error('优化失败:', error);
        toast({
          title: '优化失败',
          description: '将使用默认提示词生成',
          variant: 'destructive'
        });
        // 优化失败，使用默认提示词
        await generateWithPrompt(null);
      } finally {
        setOptimizing(false);
      }
    } else {
      // 已经有优化后的提示词，或者没有输入描述，直接生成
      await generateWithPrompt(optimizedPromptText);
    }
  };

  const generateWithPrompt = async (promptText: string | null) => {
    const finalPrompt = promptText || 'Turn the people or pets in your photos into fun hand-drawn WeChat stickers. Style: Minimalist ugly-cute line drawing (doodle style). White background. Expression: Exaggerate the animal\'s expression to look extremely shocked/judgemental/lazy (based on photo). Accessories: Add cute little doodles like sweat drops, question marks, or sparkles around the head. Text: Add handwritten Chinese text at the bottom: \'[搞快点 / 累了 / 暗中观察 / 咬牙切齿 / 哈哈哈哈哈 / 是心动的感觉 / 要命 / 比心 / 土狗贴贴 / 一切随缘]\'. Ensure the text style is messy and funny.';

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
        optimized_prompt: promptText || null
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
          <h3 className="text-lg font-semibold mb-2">生成恶搞表情包</h3>
          <p className="text-sm text-muted-foreground">
            描述图片内容或输入想要的文字，AI将生成丑萌风格表情包
          </p>
        </div>

        {/* 图片描述输入区域 */}
        <div className="space-y-2">
          <Label htmlFor="description">图片描述（可选）</Label>
          <Textarea
            id="description"
            placeholder="示例1：搞快点啊，怎么还没发货呢&#10;示例2：一只可爱的猫咪正在睡觉&#10;示例3：一只狗狗在翻白眼瞪人"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={generating || optimizing}
            className="min-h-[100px]"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>风格说明</strong>：极简丑萌线条画，纯白背景，搞怪趣味</p>
            <p>📝 <strong>文字处理</strong>：输入的文字会添加到表情包中（手写体、凌乱风格）</p>
            <p>😄 <strong>表情强化</strong>：AI会自动识别情绪并夸张化（震惊/批判/懒惰）</p>
            {description.trim() && !optimizedPromptText && (
              <p className="text-primary font-semibold">
                ⚡ 提示：点击"生成表情包"时会自动优化您的描述
              </p>
            )}
          </div>
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
                  AI优化中...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI优化提示词（可选）
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 优化后的提示词显示 */}
        {optimizedPromptText && (
          <div className="space-y-2">
            <Label>优化后的提示词（英文）</Label>
            <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
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
