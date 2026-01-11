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
              content: `你是一个专业的AI恶搞催货表情包提示词优化专家。你的任务是根据用户描述生成符合"急急国王"催货主题的英文提示词：

【核心规范 - 恶搞催货Pro版】
1. 整体风格：极简丑萌线条画（涂鸦风格），白色背景，突出粗糙的手绘质感
2. 表情处理：放大原片主体的面部特征，呈现「极度震惊」「崩溃」「咆哮」或「生无可恋」的情绪。重点表现"怎么还没好/怎么还没到"的难以置信与焦急感
3. 配饰添加：头部周围添加强化紧迫感的涂鸦元素，如巨大的汗滴、爆炸符号、密集的问号以及代表时间的时钟/闪电
4. 文字配置：
   - 如果用户描述中包含催货相关文字，使用用户提供的文字
   - 如果没有，从催货文案池随机选一个：「怎么还没好」「怎么还没到货」「什么时候到货」「快点啊」「抓紧」「我要马上到！」
   - 文字位置：底部居中，占比不超过整体高度的1/5
   - 文字风格：潦草凌乱的手写体，带有急促的视觉冲击力

【情绪关键词映射 - 催货场景】
- 等待/着急/催促/快点 → extremely shocked and anxious（极度震惊焦急）
- 崩溃/抓狂/受不了 → completely broken down（完全崩溃）
- 无语/无奈/生无可恋 → utterly hopeless（生无可恋）
- 咆哮/发火/爆发 → furiously roaring（愤怒咆哮）

【输出要求】
- 必须使用英文输出提示词
- 直接输出提示词，不要有任何前缀或解释
- 提示词长度控制在200词以内
- 必须体现"等货等到心急火燎"的催货主题`
            },
            {
              role: 'user',
              content: `用户描述：${description}

请生成符合催货主题的英文提示词。

参考模板：
Turn the [主体描述] in the uploaded photo into a hilarious hand-drawn urgent delivery meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a white background, rough hand-drawn texture. Expression: Exaggerate the [主体]'s facial features to show **[催货情绪]**, with [具体表情细节] conveying the "why isn't it here yet" disbelief and anxiety. Accessories: Add urgency-enhancing doodles around the [主体]'s head, such as [催货配饰]. Text: Add handwritten Chinese text "[催货文案]" at the bottom center; the text style must be messy, hasty, and visually impactful, accounting for no more than 1/5 of the total height.

示例1：
输入："怎么还没到货啊"
输出：Turn the person or pet in the uploaded photo into a hilarious hand-drawn urgent delivery meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a white background, rough hand-drawn texture. Expression: Exaggerate the subject's facial features to show **extreme shock and anxiety**, with wide-open eyes, raised eyebrows, and an open mouth conveying the "why isn't it here yet" disbelief and impatience. Accessories: Add urgency-enhancing doodles around the subject's head, such as giant sweat drops, explosion symbols, dense question marks, and clocks or lightning bolts representing time pressure. Text: Add handwritten Chinese text "怎么还没到货啊" at the bottom center; the text style must be messy, hasty, and visually impactful, accounting for no more than 1/5 of the total height.

示例2：
输入："一只猫咪等待的样子"
输出：Turn the waiting cat in the uploaded photo into a hilarious hand-drawn urgent delivery meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a white background, rough hand-drawn texture. Expression: Exaggerate the cat's facial features to show **utter hopelessness and impatience**, with half-closed eyes, drooping whiskers, and a slack mouth conveying the "when will it arrive" desperation. Accessories: Add urgency-enhancing doodles around the cat's head, such as giant sweat drops, multiple question marks, and clock symbols. Text: Add one random handwritten Chinese text from ["怎么还没好", "怎么还没到货", "什么时候到货", "快点啊", "抓紧", "我要马上到！"] at the bottom center; the text style must be messy, hasty, and visually impactful, accounting for no more than 1/5 of the total height.

示例3：
输入："快点啊，我等不及了"
输出：Turn the person or pet in the uploaded photo into a hilarious hand-drawn urgent delivery meme sticker. Style: Minimalist ugly-cute line drawing (doodle style) with a white background, rough hand-drawn texture. Expression: Exaggerate the subject's facial features to show **furious roaring and complete breakdown**, with bulging eyes, furrowed brows, and a wide-open mouth conveying the "hurry up already" explosive impatience. Accessories: Add urgency-enhancing doodles around the subject's head, such as explosion symbols, lightning bolts, dense sweat drops, and multiple exclamation marks. Text: Add handwritten Chinese text "快点啊，我等不及了" at the bottom center; the text style must be messy, hasty, and visually impactful, accounting for no more than 1/5 of the total height.`
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
