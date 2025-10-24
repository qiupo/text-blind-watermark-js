const { TextBlindWatermark } = require('../dist/index.cjs')

console.log('=== Unicode 和表情符号支持示例 ===\n')

const watermark = new TextBlindWatermark({ password: 'unicode-test' })

// 使用各种 Unicode 文本进行测试
const testCases = [
  {
    name: '中文文本',
    text: '这是一段中文文本，用于测试文本盲水印的功能。我们希望能够在不影响文本可读性的情况下嵌入隐藏信息。',
    secret: '隐藏的中文水印'
  },
  {
    name: '阿拉伯文本',
    text: 'هذا نص باللغة العربية لاختبار وظيفة العلامة المائية النصية المخفية.',
    secret: 'علامة مائية عربية'
  },
  {
    name: '表情符号文本',
    text: 'Hello! 👋 This text contains emojis 🎉 and various symbols ⭐ for testing purposes! 🚀',
    secret: 'Hidden emoji message! 🔒'
  },
  {
    name: '混合语言',
    text: 'English text with 中文字符 and العربية and русский язык mixed together! 🌍',
    secret: 'Multilingual watermark 多语言水印'
  },
  {
    name: '特殊字符',
    text: 'Text with special chars: @#$%^&*()_+-=[]{}|;:,.<>? and "quotes" and \'apostrophes\'',
    secret: 'Special chars test!'
  }
]

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`)
  console.log('原文:', testCase.text)
  console.log('秘密:', testCase.secret)
  
  try {
    // 添加水印
    const watermarked = watermark.addWatermarkRandom(testCase.text, testCase.secret)
    console.log('加水印后:', watermarked)
    
    // 验证提取
    const extracted = watermark.extractAsString(watermarked)
    console.log('提取结果:', extracted)
    console.log('成功:', extracted === testCase.secret ? '✅' : '❌')
    
    // 检查字符数差异
    const originalLength = testCase.text.length
    const watermarkedLength = watermarked.length
    console.log(`长度: ${originalLength} → ${watermarkedLength} (+${watermarkedLength - originalLength})`)
    
  } catch (error) {
    console.log('错误:', error.message, '❌')
  }
  
  console.log('---')
})

// 使用很长的 Unicode 文本进行测试
console.log('\n=== 长 Unicode 文本测试 ===')
const longText = '这是一个很长的中文文本，'.repeat(50) + '用于测试长文本的水印功能。'
const longSecret = 'This is a longer secret message that we want to hide in the long Chinese text!'

try {
  const longWatermarked = watermark.addWatermarkRandom(longText, longSecret)
  const longExtracted = watermark.extractAsString(longWatermarked)
  
  console.log('长文本长度:', longText.length)
  console.log('加水印后长度:', longWatermarked.length)
  console.log('秘密长度:', longSecret.length)
  console.log('提取成功:', longExtracted === longSecret ? '✅' : '❌')
} catch (error) {
  console.log('长文本错误:', error.message)
}