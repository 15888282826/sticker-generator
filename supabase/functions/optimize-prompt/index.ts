const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: '请提供有效的图片描述' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 调用文心大模型API优化提示词
    const response = await fetch(
      'https://api-integrations.appmiaoda.com/app-8uqvqoz8ynls/api-Xa6JZMByJlDa/v2/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `你是一个专业的AI恶搞表情包提示词优化专家。你的任务是根据用户描述生成符合以下规范的英文提示词：

【核心规范】
1. 整体风格：极简丑萌线条画（涂鸦风格），纯白色背景，线条粗糙随性
2. 表情处理：识别主体（动物/人物/物品），根据描述放大表情特征，强化「极度震惊」「犀利批判」「摆烂懒惰」三类核心情绪
3. 配饰添加：在主体头部周围随机添加1-2个可爱涂鸦元素（汗滴、问号、小星星、闪光、黑线、小云朵等）
4. 文字配置：
   - 如果用户描述中包含具体文字内容，使用用户提供的文字
   - 如果没有，从固定文案池随机选一个：「搞快点」「累了」「暗中观察」
   - 文字位置：底部居中，占比不超过整体高度的1/5
   - 文字风格：手写体、笔触凌乱歪斜、略带飞白效果

【情绪关键词映射】
- 睡觉/困/累 → extremely lazy（摆烂懒惰）
- 惊讶/震惊/吓到 → extremely shocked（极度震惊）
- 翻白眼/瞪人/鄙视/无语 → sharply critical（犀利批判）

【输出要求】
- 必须使用英文输出提示词
- 直接输出提示词，不要有任何前缀或解释
- 提示词长度控制在200词以内`
            },
            {
              role: 'user',
              content: `用户描述：${description}

请生成符合规范的英文提示词。

参考模板：
Turn the [主体描述] in the uploaded photo into a hilarious hand-drawn meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a pure white background, rough and casual lines. Expression: Exaggerate the [主体]'s [基础表情] expression to look **[情绪强化]**, with [具体表情细节]. Accessories: Add 1-2 cute doodles randomly around the [主体]'s head, such as [配饰列表]. Text: Add handwritten Chinese text "[用户文字或随机文案]" at the bottom center of the sticker; the text style must be messy, crooked, and funny, accounting for no more than 1/5 of the total height of the sticker.

示例1：
输入："一只可爱的猫咪正在睡觉"
输出：Turn the sleeping cat in the uploaded photo into a hilarious hand-drawn meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a pure white background, rough and casual lines. Expression: Exaggerate the cat's drowsy expression to look **extremely lazy**, with half-closed eyes and a slack mouth. Accessories: Add 1-2 cute doodles randomly around the cat's head, such as sweat drops or small clouds. Text: Add one random handwritten Chinese text from ["搞快点", "累了", "暗中观察"] at the bottom center of the sticker; the text style must be messy, crooked, and funny, accounting for no more than 1/5 of the total height of the sticker.

示例2：
输入："搞快点啊，怎么还没发货呢"
输出：Turn the person or pet in the uploaded photo into a hilarious hand-drawn meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a pure white background, rough and casual lines. Expression: Exaggerate the subject's anxious and impatient expression to look **extremely shocked**, with wide-open eyes and a tense mouth. Accessories: Add 1-2 cute doodles randomly around the subject's head, such as sweat drops or question marks. Text: Add handwritten Chinese text "搞快点啊，怎么还没发货呢" at the bottom center of the sticker; the text style must be messy, crooked, and funny, accounting for no more than 1/5 of the total height of the sticker.

示例3：
输入："一只狗狗在翻白眼瞪人"
输出：Turn the dog rolling its eyes and staring in the uploaded photo into a hilarious hand-drawn meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a pure white background, rough and casual lines. Expression: Exaggerate the dog's eye-rolling expression to look **sharply critical**, with squinted eyes and a furrowed brow. Accessories: Add 1-2 cute doodles randomly around the dog's head, such as black lines or small stars. Text: Add one random handwritten Chinese text from ["搞快点", "累了", "暗中观察"] at the bottom center of the sticker; the text style must be messy, crooked, and funny, accounting for no more than 1/5 of the total height of the sticker.`
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    // 处理流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let optimizedPrompt = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            optimizedPrompt += content;
          } catch (e) {
            // 忽略解析错误
            console.log('解析行失败:', line);
          }
        }
      }
    }

    if (!optimizedPrompt.trim()) {
      throw new Error('未能生成优化后的提示词');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        optimizedPrompt: optimizedPrompt.trim()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('提示词优化失败:', error);
    return new Response(
      JSON.stringify({ 
        error: '提示词优化失败',
        message: error instanceof Error ? error.message : '未知错误'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
