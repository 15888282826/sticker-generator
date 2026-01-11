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
              content: '你是一个专业的AI图像生成提示词优化专家。你的任务是将用户简单的图片描述转换为详细、专业的表情包生成提示词。提示词应该包含：1) 主体描述 2) 风格要求（手绘、简约线条、丑萌风格）3) 表情特征（夸张、搞笑）4) 背景要求（白色背景）5) 画质要求。请直接输出优化后的提示词，不要有其他解释。'
            },
            {
              role: 'user',
              content: `请将以下图片描述优化为专业的表情包生成提示词：\n\n${description}\n\n要求：\n1. 保持原描述的核心内容\n2. 添加手绘风格、丑萌线条、夸张表情等表情包特征\n3. 指定白色背景\n4. 添加高清画质要求\n5. 提示词长度控制在150字以内\n6. 直接输出提示词，不要有"优化后的提示词："等前缀`
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
