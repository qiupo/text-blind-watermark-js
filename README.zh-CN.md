# 文本盲水印 JavaScript 版

[![npm version](https://badge.fury.io/js/text-blind-watermark-js.svg)](https://badge.fury.io/js/text-blind-watermark-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

一个强大的 JavaScript 库，用于在文本中嵌入和提取不可见的水印。这是 Python [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) 库的完整 JavaScript 移植版本。

## ✨ 特性

- 🔒 **不可见水印**：使用零宽度 Unicode 字符嵌入完全不可见的水印
- 🔐 **密码保护**：支持密码加密保护水印内容
- 🌐 **跨平台兼容**：同时支持 Node.js 和浏览器环境
- 🌍 **Unicode 支持**：完美处理中文、阿拉伯文、表情符号等各种 Unicode 文本
- 📝 **TypeScript 支持**：完整的类型定义和 IntelliSense 支持
- 🐍 **Python API 兼容**：提供与原始 Python 库兼容的 API
- 📦 **多种格式**：支持 ES Module、CommonJS 和 UMD 格式

## 📦 安装

```bash
npm install text-blind-watermark-js
```

或使用 yarn：

```bash
yarn add text-blind-watermark-js
```

## 🚀 快速开始

### Node.js 环境

```javascript
import TextBlindWatermark from 'text-blind-watermark-js'

// 创建实例
const watermark = new TextBlindWatermark({ password: 'my-secret-key' })

// 添加水印
const originalText = '这是一段需要添加水印的文本。'
const watermarkedText = watermark.addWatermarkRandom(originalText, '版权所有')

console.log('原文:', originalText)
console.log('加水印后:', watermarkedText)
// 注意：加水印后的文本看起来与原文完全相同！

// 提取水印
const extractedWatermark = watermark.extractAsString(watermarkedText)
console.log('提取的水印:', extractedWatermark) // 输出: 版权所有
```

### 浏览器环境

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/text-blind-watermark-js/dist/index.umd.js"></script>
</head>
<body>
    <script>
        const watermark = new TextBlindWatermark({ password: 'my-secret-key' })
        
        const originalText = '这是一段测试文本。'
        const watermarkedText = watermark.addWatermarkRandom(originalText, '水印内容')
        
        console.log('提取的水印:', watermark.extractAsString(watermarkedText))
    </script>
</body>
</html>
```

## 📖 API 参考

### 构造函数

```typescript
new TextBlindWatermark(options?: WatermarkOptions)
```

**参数：**
- `options.password` (可选): 加密密码，支持字符串或 Uint8Array
- `options.seed` (可选): 随机种子，用于可重现的水印位置
- `options.encoding` (可选): `'hex' | 'binary'`，编码方案。若在手机端看到小圆圈/点，请使用 `'binary'`

### 主要方法

#### `addWatermarkRandom(text, watermark)`

随机添加水印到文本中。

```typescript
addWatermarkRandom(text: string, watermark: string | Uint8Array): string
```

#### `extract(textWithWatermark)`

从文本中提取水印（返回 Uint8Array）。

```typescript
extract(textWithWatermark: string): Uint8Array
```

#### `extractAsString(textWithWatermark)`

从文本中提取水印（返回字符串）。

```typescript
extractAsString(textWithWatermark: string): string
```

#### `hasWatermark(text)`

检查文本是否包含水印。

```typescript
hasWatermark(text: string): boolean
```

#### `removeWatermark(textWithWatermark)`

从文本中移除水印。

```typescript
removeWatermark(textWithWatermark: string): string
```

### Python API 兼容方法

#### `add_wm_rnd(text, wm)`

与 Python 版本兼容的添加水印方法。

```typescript
add_wm_rnd(text: string, wm: string | Uint8Array): string
```

## 🔧 高级用法

### 使用自定义密码

```javascript
const watermark = new TextBlindWatermark({ 
    password: 'my-super-secret-password' 
})

const text = '需要保护的重要文档内容。'
const watermarkedText = watermark.addWatermarkRandom(text, '机密文档')

// 只有知道正确密码的人才能提取水印
const extractedWatermark = watermark.extractAsString(watermarkedText)
console.log(extractedWatermark) // 输出: 机密文档
```

### 使用随机种子确保可重现性

```javascript
const watermark1 = new TextBlindWatermark({ 
    password: 'password', 
    seed: 12345 
})
const watermark2 = new TextBlindWatermark({ 
    password: 'password', 
    seed: 12345 
})

const text = '测试文本'
const result1 = watermark1.addWatermarkRandom(text, '水印')
const result2 = watermark2.addWatermarkRandom(text, '水印')

console.log(result1 === result2) // true - 相同的种子产生相同的结果
```

### 处理 Unicode 文本

```javascript
const watermark = new TextBlindWatermark({ password: 'unicode-test' })

// 支持各种 Unicode 文本
const texts = [
    '这是中文文本 🇨🇳',
    'هذا نص عربي 🇸🇦',
    'This is English text 🇺🇸',
    '这是混合文本 mixed text مختلط 🌍'
]

texts.forEach(text => {
    const watermarked = watermark.addWatermarkRandom(text, '多语言水印')
    const extracted = watermark.extractAsString(watermarked)
    console.log(`原文: ${text}`)
    console.log(`提取的水印: ${extracted}`)
    console.log('---')
})
```

### 使用 Uint8Array 密码和水印

```javascript
const password = new Uint8Array([1, 2, 3, 4, 5])
const watermarkData = new Uint8Array([10, 20, 30, 40])

const watermark = new TextBlindWatermark({ password })

const text = '二进制数据测试'
const watermarkedText = watermark.addWatermarkRandom(text, watermarkData)
const extractedData = watermark.extract(watermarkedText)

console.log('原始数据:', Array.from(watermarkData))
console.log('提取的数据:', Array.from(extractedData))
```

## 🔒 安全考虑

1. **密码强度**：使用强密码来保护您的水印
2. **密码管理**：安全地存储和管理密码
3. **文本修改**：大幅修改文本可能会破坏水印
4. **检测限制**：该方法对于了解零宽度字符的攻击者不是完全安全的

## 🧪 测试

运行测试套件：

```bash
npm test
```

运行代码检查：

```bash
npm run lint
```

## 🔗 兼容性

该库与原始 Python `text_blind_watermark` 库兼容，支持：

- 相同的水印嵌入和提取算法
- 兼容的 API 方法名称（`add_wm_rnd`）
- 相同的密码和种子行为
- 跨语言水印互操作性

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢 [guofei9987](https://github.com/guofei9987) 创建了原始的 Python `text_blind_watermark` 库
- 感谢所有为这个项目做出贡献的开发者

## 📚 相关项目

- [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) - 原始 Python 版本
- [blind-watermark](https://github.com/guofei9987/blind_watermark) - 图像盲水印库

---

如果这个项目对您有帮助，请给它一个 ⭐️！

## 📱 移动端兼容提示

部分手机应用/字体会把某些零宽或组合标记渲染为可见的点圈（如截图中出现的小圆圈）。如果遇到这种情况，请切换到移动端安全的二进制编码：

```javascript
import TextBlindWatermark from 'text-blind-watermark-js'

const wm = new TextBlindWatermark({ password: 'secret', encoding: 'binary' })
const withWm = wm.addWatermarkRandom('你好', '隐藏水印')
console.log(wm.extractAsString(withWm))
```

二进制模式仅使用 `U+200B`（ZWSP）和 `U+200C`（ZWNJ）两个零宽字符，在主流手机端兼容性更好、不会显示点圈。