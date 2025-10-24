# 文本盲水印 JavaScript 版

[![npm version](https://badge.fury.io/js/text-blind-watermark-js.svg)](https://badge.fury.io/js/text-blind-watermark-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

[English](./README.md) | 中文文档

一个强大的 JavaScript/TypeScript 库，支持文本盲水印和图像隐写术功能。这是 Python [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) 库的完整 JavaScript 移植版本，并新增了图像隐写术功能。

## ✨ 特性

- 🔒 **不可见水印**：使用零宽度 Unicode 字符嵌入完全不可见的水印
- 🖼️ **图像隐写术**：使用 LSB（最低有效位）技术在图像中隐藏文本/数据
- 🛡️ **密码保护**：支持基于密码的加密保护
- 🌐 **跨平台**：支持浏览器、Node.js 和各种平台（微信、钉钉等）
- 📱 **Unicode 支持**：完全支持国际化文本和表情符号
- 🎯 **TypeScript**：使用 TypeScript 编写，提供完整的类型定义
- 🔄 **Python 兼容**：与原始 Python 库 API 兼容
- 📦 **多种格式**：提供 ES 模块、CommonJS 和 UMD 构建版本

## 📦 安装

```bash
npm install text-blind-watermark-js
```

或使用 yarn：

```bash
yarn add text-blind-watermark-js
```

## 🚀 快速开始

### 文本水印

```javascript
import { TextBlindWatermark } from 'text-blind-watermark-js'

// 创建水印实例
const watermark = new TextBlindWatermark({ password: 'your-secret-password' })

// 添加水印到文本
const originalText = '这是一段需要添加水印的文本。'
const secretMessage = '隐藏水印'
const textWithWatermark = watermark.addWatermarkRandom(originalText, secretMessage)

console.log('带水印的文本:', textWithWatermark)
// 输出看起来与原文完全相同！

// 提取水印
const extractedMessage = watermark.extractAsString(textWithWatermark)
console.log('提取的水印:', extractedMessage)
// 输出: "隐藏水印"
```

### 图像隐写术

```javascript
import { ImageSteganography, CanvasImageProcessor } from 'text-blind-watermark-js'

// 创建隐写术实例
const steganography = new ImageSteganography({ 
  password: 'image-secret',
  checksum: true 
})

// 浏览器中使用 Canvas
const processor = new CanvasImageProcessor()

// 在图像中隐藏文本
const imageFile = document.getElementById('imageInput').files[0]
const imageData = await processor.loadImageFromFile(imageFile)
const hiddenImageData = steganography.hideData(imageData, '秘密消息')

// 下载包含隐藏数据的图像
processor.downloadImage(hiddenImageData, 'hidden-message.png')

// 从图像中提取隐藏文本
const extractedMessage = steganography.extractData(hiddenImageData)
console.log('隐藏消息:', extractedMessage)
// 输出: "秘密消息"
```

### Python 风格 API

为了与原始 Python 库兼容：

```javascript
import { TextBlindWatermark } from 'text-blind-watermark-js'

const watermark = new TextBlindWatermark({ password: 'test_password' })

// 使用 Python 风格的方法名
const textWithWatermark = watermark.add_wm_rnd(originalText, secretMessage)
const extractedBytes = watermark.extract(textWithWatermark)
```

### 浏览器使用 (UMD)

```html
<script src="https://unpkg.com/text-blind-watermark-js/dist/index.umd.js"></script>
<script>
  const watermark = new TextBlindWatermark.default({ password: 'secret' })
  const result = watermark.addWatermarkRandom('Hello World', '隐藏消息')
  console.log(result)
</script>
```

## 🔧 API 参考

### 文本水印

#### 构造函数

```typescript
new TextBlindWatermark(options?: WatermarkOptions)
```

**选项:**
- `password?: string | Uint8Array` - 加密密码 (默认: 'default_password')
- `seed?: number` - 随机种子，用于可重现的水印位置

#### 方法

##### `addWatermarkRandom(text: string, watermark: string | Uint8Array): string`

在文本的随机位置嵌入水印。

##### `add_wm_rnd(text: string, wm: string | Uint8Array): string`

`addWatermarkRandom` 的 Python 兼容别名。

##### `extract(textWithWatermark: string): Uint8Array`

提取水印为原始字节。

##### `extractAsString(textWithWatermark: string): string`

提取水印为 UTF-8 字符串。

##### `hasWatermark(text: string): boolean`

检查文本是否包含水印。

##### `removeWatermark(textWithWatermark: string): string`

从文本中移除水印，返回干净的文本。

### 图像隐写术

#### 构造函数

```typescript
new ImageSteganography(options?: SteganographyOptions)
```

**选项:**
- `password?: string` - 加密密码 (可选)
- `checksum?: boolean` - 启用数据完整性检查 (默认: true)

#### 方法

##### `hideData(imageData: StegoImageData, message: string): StegoImageData`

使用 LSB 隐写术在图像中隐藏文本消息。

##### `extractData(imageData: StegoImageData): string`

从图像中提取隐藏的文本。

##### `hasHiddenData(imageData: StegoImageData): boolean`

检查图像是否包含隐藏数据。

##### `getMaxCapacity(imageData: StegoImageData): number`

返回图像中可以隐藏的最大字符数。

#### Canvas 图像处理器

```typescript
new CanvasImageProcessor()
```

##### `loadImageFromFile(file: File): Promise<StegoImageData>`

加载图像文件并返回用于隐写术的图像数据。

##### `imageDataToBlob(imageData: StegoImageData, format?: string): Promise<Blob>`

将图像数据转换为可下载的 blob。

##### `downloadImage(imageData: StegoImageData, filename: string): void`

下载包含隐藏数据的图像。

## 🛠️ 高级用法

### 文本水印与二进制数据

```javascript
import { TextBlindWatermark, stringToBytes, bytesToString } from 'text-blind-watermark-js'

const watermark = new TextBlindWatermark({ password: 'binary_password' })

// 嵌入二进制数据
const binaryData = stringToBytes('秘密二进制消息')
const textWithWatermark = watermark.addWatermarkRandom(originalText, binaryData)

// 提取二进制数据
const extractedBytes = watermark.extract(textWithWatermark)
const extractedString = bytesToString(extractedBytes)
```

### 图像隐写术加密

```javascript
import { ImageSteganography } from 'text-blind-watermark-js'

// 创建加密隐写术实例
const steganography = new ImageSteganography({
  password: 'strong-encryption-key',
  checksum: true
})

// 隐藏敏感数据
const sensitiveData = '机密信息'
const hiddenImageData = steganography.hideData(imageData, sensitiveData)

// 只有拥有正确密码的人才能提取数据
const extractedData = steganography.extractData(hiddenImageData)
```

### Node.js 图像处理

```javascript
// 对于 Node.js 环境，可以使用提供的 Node.js 示例
import { ImageSteganography } from 'text-blind-watermark-js'
import { NodeImageProcessor } from './examples/image-steganography-node.js'

const processor = new NodeImageProcessor()
const steganography = new ImageSteganography({ password: 'node-secret' })

// 从文件系统加载图像
const imageData = await processor.loadImageFromFile('input.png')

// 隐藏消息
const hiddenImageData = steganography.hideData(imageData, '在 Node.js 中隐藏')

// 保存到文件系统
await processor.saveImageToFile(hiddenImageData, 'output.png')
```

### 容量管理

```javascript
import { ImageSteganography } from 'text-blind-watermark-js'

const steganography = new ImageSteganography()

// 在隐藏数据前检查图像容量
const maxCapacity = steganography.getMaxCapacity(imageData)
console.log(`图像最多可以隐藏 ${maxCapacity} 个字符`)

const message = '您的消息内容'
if (message.length <= maxCapacity) {
  const hiddenImageData = steganography.hideData(imageData, message)
} else {
  console.error('消息对于此图像来说太长了')
}
```

### 可重现水印

```javascript
const watermark = new TextBlindWatermark({ 
  password: 'secret', 
  seed: 12345 // 固定种子以获得可重现的结果
})

const result1 = watermark.addWatermarkRandom(text, message)
const result2 = watermark.addWatermarkRandom(text, message)
// result1 === result2 (每次都是相同的位置)
```

### 错误处理

```javascript
try {
  const extracted = watermark.extractAsString(suspiciousText)
  console.log('发现水印:', extracted)
} catch (error) {
  if (error.message.includes('No watermark found')) {
    console.log('文本是干净的')
  } else {
    console.error('提取失败:', error.message)
  }
}
```

## 🔒 安全考虑

1. **密码强度**: 为每个应用程序使用强大、唯一的密码
2. **密码存储**: 永远不要在客户端代码中硬编码密码
3. **水印大小**: 更长的水印需要更长的原始文本
4. **平台测试**: 在目标平台上测试（微信、邮件客户端等）
5. **图像质量**: LSB 隐写术可能通过统计分析被检测到
6. **数据完整性**: 对于关键隐藏数据，始终启用校验和
7. **加密**: 对敏感信息使用密码保护

## 🧪 测试

该库包含全面的测试，涵盖：

- 基本水印嵌入和提取
- Unicode 和表情符号支持
- 基于密码的安全性
- 错误处理
- Python 库兼容性
- 图像隐写术功能
- LSB 编码/解码准确性
- 数据完整性验证
- 加密和解密

```bash
npm test
npm run test:coverage
```

## 📊 兼容性

### 测试平台
- ✅ Web 浏览器 (Chrome, Firefox, Safari, Edge)
- ✅ Node.js (14+)
- ✅ 微信小程序
- ✅ 钉钉
- ✅ 邮件客户端
- ✅ 社交媒体平台

### 文本格式
- ✅ 纯文本
- ✅ Unicode 字符
- ✅ 表情符号
- ✅ 混合语言（英文、中文、阿拉伯文等）

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。对于重大更改，请先开启 issue 讨论您想要更改的内容。

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

该项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 原始 Python 实现：[text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) by [guofei9987](https://github.com/guofei9987)
- 受文本隐写术和零宽度字符技术研究启发

## 📚 相关项目

- [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) - 原始 Python 实现
- [blind_watermark](https://github.com/guofei9987/blind_watermark) - 图像水印库
- [HideInfo](https://github.com/guofei9987/HideInfo) - 信息隐藏工具包

## 🔗 链接

- [npm 包](https://www.npmjs.com/package/text-blind-watermark-js)
- [GitHub 仓库](https://github.com/yourusername/text-blind-watermark-js)
- [文档](https://github.com/yourusername/text-blind-watermark-js#readme)
- [问题反馈](https://github.com/yourusername/text-blind-watermark-js/issues)