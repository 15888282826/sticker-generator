import { useEffect, useState } from 'react';
import { Download, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUserStickers, deleteSticker, getOrCreateUserId } from '@/db/api';
import type { Sticker } from '@/types/types';

interface StickerHistoryProps {
  refresh?: number;
}

export function StickerHistory({ refresh }: StickerHistoryProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStickers = async () => {
    try {
      setLoading(true);
      const userId = getOrCreateUserId();
      const data = await getUserStickers(userId, 20);
      setStickers(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载历史记录',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStickers();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSticker(id);
      setStickers(stickers.filter(s => s.id !== id));
      toast({
        title: '删除成功',
        description: '记录已删除'
      });
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `sticker_${id}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
          <p>加载中...</p>
        </div>
      </Card>
    );
  }

  if (stickers.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          <p>暂无生成记录</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">生成历史</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stickers.map((sticker) => (
            <div key={sticker.id} className="border rounded-lg p-3 space-y-2">
              {sticker.generated_image_url ? (
                <img
                  src={sticker.generated_image_url}
                  alt="表情包"
                  className="w-full h-32 object-contain rounded bg-muted"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-muted rounded">
                  <p className="text-sm text-muted-foreground">生成中...</p>
                </div>
              )}
              <div className="flex gap-2">
                {sticker.generated_image_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(sticker.generated_image_url!, sticker.id)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    下载
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(sticker.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(sticker.created_at).toLocaleString('zh-CN')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
