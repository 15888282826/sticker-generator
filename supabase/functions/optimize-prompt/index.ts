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
              content: '你是一个专业的表情包生成提示词优化专家。你的任务是将用户的描述转换为详细的表情包生成提示词。重要：如果用户描述中包含具体的文字内容（如"搞快点啊"、"怎么还没发货呢"等），必须在提示词中明确要求将这些文字添加到表情包图片中。'
            },
            {
              role: 'user',
              content: `请将以下描述优化为专业的表情包生成提示词：

用户描述：${description}

优化要求：
1. 分析用户描述，识别其中的主体（人物/动物/物品）和情感表达
2. **关键**：如果描述中包含具体的文字内容（如"搞快点啊"、"怎么还没发货呢"等），必须在提示词中明确指出要将这些文字添加到图片中，作为表情包的文字标注
3. 添加手绘风格、简约线条、丑萌风格等表情包特征
4. 根据文字内容匹配合适的夸张表情（如着急、无奈、期待等）
5. 指定白色背景
6. 添加高清画质要求
7. 提示词长度控制在200字以内
8. 直接输出提示词，不要有"优化后的提示词："等前缀

示例：
输入："搞快点啊，怎么还没发货呢"
输出："将照片中的人物或宠物转换为手绘风格表情包。风格：简约丑萌线条画（涂鸦风格）。白色背景。表情：夸张的着急、催促表情，眉头紧皱，嘴巴张大。配件：在头部周围添加可爱的小涂鸦，如汗滴、问号、着急的波浪线等。**文字**：在图片底部添加手写中文文字"搞快点啊，怎么还没发货呢"，文字风格要凌乱搞笑。高清画质。"`
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
