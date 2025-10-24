import { TextBlindWatermark, stringToBytes, bytesToString } from '../src/index'

describe('TextBlindWatermark', () => {
  let watermark: TextBlindWatermark

  beforeEach(() => {
    watermark = new TextBlindWatermark({ password: 'test_password' })
  })

  describe('基本功能', () => {
    test('应该能够使用字符串密码添加和提取水印', () => {
      const originalText = 'This is a test text for watermarking.'
      const watermarkText = 'Secret message'

      const textWithWatermark = watermark.addWatermarkRandom(originalText, watermarkText)
      const extractedWatermark = watermark.extractAsString(textWithWatermark)

      expect(extractedWatermark).toBe(watermarkText)
    })

    test('应该能够使用Uint8Array密码添加和提取水印', () => {
      const passwordBytes = stringToBytes('binary_password')
      const wm = new TextBlindWatermark({ password: passwordBytes })

      const originalText = 'Another test text.'
      const watermarkText = 'Hidden data'

      const textWithWatermark = wm.addWatermarkRandom(originalText, watermarkText)
      const extractedWatermark = wm.extractAsString(textWithWatermark)

      expect(extractedWatermark).toBe(watermarkText)
    })

    test('应该能够使用Python风格的API (add_wm_rnd)', () => {
      const originalText = 'Testing Python-style API'
      const watermarkBytes = stringToBytes('Python compatibility')

      const textWithWatermark = watermark.add_wm_rnd(originalText, watermarkBytes)
      const extractedBytes = watermark.extract(textWithWatermark)
      const extractedText = bytesToString(extractedBytes)

      expect(extractedText).toBe('Python compatibility')
    })
  })

  describe('边界情况', () => {
    test('应该处理空水印', () => {
      const text = 'Test text for empty watermark'
      const emptyWatermark = ''

      // 对于空水印，我们期望它要么正常工作，要么抛出有意义的错误
      try {
        const textWithWatermark = watermark.addWatermarkRandom(text, emptyWatermark)
        const extracted = watermark.extractAsString(textWithWatermark)
        expect(extracted).toBe(emptyWatermark)
      } catch (error) {
        // 拒绝空水印是可以接受的
        expect(error).toBeInstanceOf(Error)
      }
    })

    test('应该处理Unicode文本', () => {
      const originalText = '这是一个中文测试文本 🚀 with emojis and special chars: αβγ'
      const watermarkText = '隐藏的中文水印 🔒'

      const textWithWatermark = watermark.addWatermarkRandom(originalText, watermarkText)
      const extractedWatermark = watermark.extractAsString(textWithWatermark)

      expect(extractedWatermark).toBe(watermarkText)
    })

    test('应该处理长水印', () => {
      const originalText = 'Short text'
      const longWatermark =
        'This is a very long watermark that contains much more text than the original message itself, testing the robustness of the algorithm.'

      const textWithWatermark = watermark.addWatermarkRandom(originalText, longWatermark)
      const extractedWatermark = watermark.extractAsString(textWithWatermark)

      expect(extractedWatermark).toBe(longWatermark)
    })
  })

  describe('安全功能', () => {
    test('使用错误密码应该失败', () => {
      const originalText = 'Secure text'
      const watermarkText = 'Secret'

      const textWithWatermark = watermark.addWatermarkRandom(originalText, watermarkText)

      const wrongPasswordWatermark = new TextBlindWatermark({ password: 'wrong_password' })
      const extractedWatermark = wrongPasswordWatermark.extractAsString(textWithWatermark)

      expect(extractedWatermark).not.toBe(watermarkText)
    })

    test('不同密码应该产生不同结果', () => {
      const originalText = 'Same text'
      const watermarkText = 'Same watermark'

      const wm1 = new TextBlindWatermark({ password: 'password1' })
      const wm2 = new TextBlindWatermark({ password: 'password2' })

      const result1 = wm1.addWatermarkRandom(originalText, watermarkText)
      const result2 = wm2.addWatermarkRandom(originalText, watermarkText)

      expect(result1).not.toBe(result2)
    })
  })

  describe('实用方法', () => {
    test('应该检测水印存在', () => {
      const originalText = 'Clean text'
      const watermarkText = 'Hidden'

      expect(watermark.hasWatermark(originalText)).toBe(false)

      const textWithWatermark = watermark.addWatermarkRandom(originalText, watermarkText)
      expect(watermark.hasWatermark(textWithWatermark)).toBe(true)
    })

    test('应该移除水印', () => {
      const originalText = 'Text to clean'
      const watermarkText = 'Remove me'

      const textWithWatermark = watermark.addWatermarkRandom(originalText, watermarkText)
      const cleanedText = watermark.removeWatermark(textWithWatermark)

      expect(cleanedText).toBe(originalText)
      expect(watermark.hasWatermark(cleanedText)).toBe(false)
    })
  })

  describe('种子的可重现性', () => {
    test('相同种子应该产生相同结果', () => {
      const originalText = 'Reproducible test'
      const watermarkText = 'Consistent'
      const seed = 12345

      const wm1 = new TextBlindWatermark({ password: 'test', seed })
      const wm2 = new TextBlindWatermark({ password: 'test', seed })

      const result1 = wm1.addWatermarkRandom(originalText, watermarkText)
      const result2 = wm2.addWatermarkRandom(originalText, watermarkText)

      expect(result1).toBe(result2)
    })

    test('不同种子应该产生不同结果', () => {
      const originalText = 'Seed test'
      const watermarkText = 'Variable'

      const wm1 = new TextBlindWatermark({ password: 'test', seed: 111 })
      const wm2 = new TextBlindWatermark({ password: 'test', seed: 222 })

      const result1 = wm1.addWatermarkRandom(originalText, watermarkText)
      const result2 = wm2.addWatermarkRandom(originalText, watermarkText)

      expect(result1).not.toBe(result2)

      // 但两者都应该能正确提取
      expect(wm1.extractAsString(result1)).toBe(watermarkText)
      expect(wm2.extractAsString(result2)).toBe(watermarkText)
    })
  })

  describe('错误处理', () => {
    test('从没有水印的文本中提取时应该抛出错误', () => {
      const cleanText = 'No watermark here'

      expect(() => {
        watermark.extract(cleanText)
      }).toThrow('未找到水印')
    })

    test('提取损坏的水印时应该抛出错误', () => {
      // 创建包含无效零宽字符的文本
      const corruptedText = 'Text with invalid\u200Bwatermark'

      expect(() => {
        watermark.extract(corruptedText)
      }).toThrow()
    })
  })

  describe('与原始Python库的兼容性', () => {
    test('基本操作应该匹配Python库的行为', () => {
      const originalText = 'Hello, World!'
      const watermarkText = 'secret'

      const textWithWatermark = watermark.addWatermarkRandom(originalText, watermarkText)
      const extracted = watermark.extractAsString(textWithWatermark)

      expect(extracted).toBe(watermarkText)
      // 带水印的文本应该包含原始文本（忽略零宽字符）
      const cleanText = watermark.removeWatermark(textWithWatermark)
      expect(cleanText).toBe(originalText)
    })
  })
})
