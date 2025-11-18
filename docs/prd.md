# 表情包生成器需求文档

## 1. 工具概述
### 1.1 工具名称
表情包生成器

### 1.2 工具描述
一个基于AI图片生成技术的表情包制作工具，用户上传人物或宠物照片后，可自动生成手绘风格的微信表情包。

## 2. 核心功能
### 2.1 图片上传功能
- 支持用户上传人物照片或宠物照片
- 图片格式支持JPG、PNG等常见格式

### 2.2 AI表情包生成功能
- 使用Nano Banana Pro图片生成与编辑技术
- 生成参数：
  - 风格：极简丑萌线条画（涂鸦风格），白色背景
  - 表情：放大动物表情，呈现极度震惊/批判/懒惰情绪（基于原照片表情）
  - 配饰：头部周围添加可爱涂鸦，如汗滴、问号、闪光点
  - 文字：底部添加手写字体中文文字：「搞快点 / 累了 / 暗中观察」，确保文字风格凌乱有趣
  - 提示词：Turn the people or pets in your photos into fun hand-drawn WeChat stickers. Style: Minimalist ugly-cute line drawing (doodle style). White background. Expression: Exaggerate the animal's expression to look extremely shocked/judgemental/lazy (based on photo). Accessories: Add cute little doodles like sweat drops, question marks, or sparkles around the head. Text: Add handwritten Chinese text at the bottom: '[搞快点 / 累了 / 暗中观察]'. Ensure the text style is messy and funny.

### 2.3 表情包下载功能
- 支持用户下载生成的表情包
- 支持微信表情包格式

## 3. 设计风格
### 3.1 配色方案
主色调采用温暖的橙色系(#FF8C42)搭配清新的薄荷绿(#7FDBCA)，营造活泼有趣的创作氛围

### 3.2 视觉细节
界面采用圆润的8px圆角设计，按钮具有轻微阴影效果，图标使用线性风格，整体呈现简约现代的视觉体验

### 3.3 整体布局
采用卡片式布局，功能区域清晰分割，上传区域、生成进度、下载区域垂直排列，确保操作流程直观易懂