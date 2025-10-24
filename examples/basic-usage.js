const { TextBlindWatermark } = require('../dist/index.cjs')

// 基本用法示例
console.log('=== Text Blind Watermark JS - 基本用法 ===\n')

// 创建水印实例
const watermark = new TextBlindWatermark({ password: 'my-secret-password', encoding: 'base4' })

// 原始文本
const originalText = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
`.trim()

// 要隐藏的秘密消息
const secretMessage = 'This is a hidden watermark!'

console.log('原始文本:')
console.log(originalText)
console.log('\n秘密消息:', secretMessage)

// 添加水印
const textWithWatermark = watermark.addWatermarkRandom(originalText, secretMessage)

console.log('\n带水印的文本（看起来完全相同）:')
console.log(textWithWatermark)

// 检查文本是否包含水印
const hasWatermark = watermark.hasWatermark(textWithWatermark)
console.log('\n包含水印:', hasWatermark)

// 提取水印
try {
  const extractedMessage = watermark.extractAsString(textWithWatermark)
  console.log('提取的消息:', extractedMessage)
  console.log('与原始消息匹配:', extractedMessage === secretMessage)
} catch (error) {
  console.error('提取水印失败:', error.message)
}

// 移除水印
const cleanText = watermark.removeWatermark(textWithWatermark)
console.log('\n清理后的文本:')
console.log(cleanText)
console.log('与原始文本匹配:', cleanText === originalText)

// 使用错误密码测试
console.log('\n=== 使用错误密码测试 ===')
const wrongPasswordWatermark = new TextBlindWatermark({
  password: 'wrong-password',
  encoding: 'binary',
})

try {
  const wrongExtraction = wrongPasswordWatermark.extractAsString(textWithWatermark)
  console.log('使用错误密码提取:', wrongExtraction)
} catch (error) {
  console.log('使用错误密码的预期错误:', error.message)
}
