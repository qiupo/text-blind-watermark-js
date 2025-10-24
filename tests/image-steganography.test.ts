/**
 * 图像隐写术测试用例
 */

import { ImageSteganography, StegoImageData } from '../src/image-steganography'

describe('ImageSteganography', () => {
  let steganography: ImageSteganography
  let testImageData: StegoImageData

  beforeEach(() => {
    steganography = new ImageSteganography({ checksum: false })
    
    // 创建测试用的图像数据 (100x100 RGBA)
    const width = 100
    const height = 100
    const data = new Uint8ClampedArray(width * height * 4)
    
    // 填充随机像素数据
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(Math.random() * 256)     // R
      data[i + 1] = Math.floor(Math.random() * 256) // G
      data[i + 2] = Math.floor(Math.random() * 256) // B
      data[i + 3] = 255                             // A (不透明)
    }
    
    testImageData = { data, width, height }
  })

  describe('基本功能测试', () => {
    test('应该能够计算图像的最大容量', () => {
      const capacity = steganography.getMaxCapacity(testImageData)
      
      // 100x100 图像，每个像素3个通道，减去头部信息（32位长度）
      const expectedCapacity = Math.floor((100 * 100 * 3 - 32) / 8)
      expect(capacity).toBe(expectedCapacity)
    })

    test('应该能够隐藏和提取简单文本', () => {
      const message = 'Hello, World!'
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('应该能够隐藏和提取中文文本', () => {
      const message = '你好，世界！这是一个测试消息。'
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('应该能够隐藏和提取包含特殊字符的文本', () => {
      const message = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~'
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('应该能够隐藏和提取空字符串', () => {
      const message = ''
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })
  })

  describe('加密功能测试', () => {
    test('应该能够使用密码加密和解密数据', () => {
      const message = 'Secret message with password'
      const password = 'mySecretPassword123'
      
      const encryptedSteganography = new ImageSteganography({ password })
      
      const hiddenImageData = encryptedSteganography.hideData(testImageData, message)
      const extractedMessage = encryptedSteganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('使用错误密码应该无法正确解密', () => {
      const message = 'Secret message'
      const correctPassword = 'correctPassword'
      const wrongPassword = 'wrongPassword'
      
      const encryptSteganography = new ImageSteganography({ password: correctPassword })
      const decryptSteganography = new ImageSteganography({ password: wrongPassword })
      
      const hiddenImageData = encryptSteganography.hideData(testImageData, message)
      
      // AES加密应该在错误密码时抛出异常
      expect(() => {
        decryptSteganography.extractData(hiddenImageData)
      }).toThrow('Decryption failed: invalid password or corrupted data')
    })

    test('不使用密码应该无法解密加密的数据', () => {
      const message = 'Encrypted message'
      const password = 'testPassword'
      
      const encryptedSteganography = new ImageSteganography({ password })
      const normalSteganography = new ImageSteganography()
      
      const hiddenImageData = encryptedSteganography.hideData(testImageData, message)
      const extractedMessage = normalSteganography.extractData(hiddenImageData)
      
      expect(extractedMessage).not.toBe(message)
    })
  })

  describe('校验和功能测试', () => {
    test('启用校验和时应该能够检测数据完整性', () => {
      const message = 'Message with checksum'
      const steganographyWithChecksum = new ImageSteganography({ checksum: true })
      
      const hiddenImageData = steganographyWithChecksum.hideData(testImageData, message)
      const extractedMessage = steganographyWithChecksum.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('禁用校验和时应该仍能正常工作', () => {
      const message = 'Message without checksum'
      const steganographyNoChecksum = new ImageSteganography({ checksum: false })
      
      const hiddenImageData = steganographyNoChecksum.hideData(testImageData, message)
      const extractedMessage = steganographyNoChecksum.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('数据损坏时校验和应该检测到错误', () => {
      const message = 'Message to be corrupted'
      const steganographyWithChecksum = new ImageSteganography({ checksum: true })
      
      const hiddenImageData = steganographyWithChecksum.hideData(testImageData, message)
      
      // 故意损坏一些像素数据
      hiddenImageData.data[100] ^= 0xFF
      hiddenImageData.data[200] ^= 0xFF
      
      expect(() => {
        steganographyWithChecksum.extractData(hiddenImageData)
      }).toThrow('Data integrity check failed')
    })
  })

  describe('容量限制测试', () => {
    test('超出容量限制时应该抛出错误', () => {
      const maxCapacity = steganography.getMaxCapacity(testImageData)
      const oversizedMessage = 'x'.repeat(maxCapacity + 100)
      
      expect(() => {
        steganography.hideData(testImageData, oversizedMessage)
      }).toThrow('Message too large')
    })

    test('接近容量限制的消息应该能够正常处理', () => {
      const maxCapacity = steganography.getMaxCapacity(testImageData)
      const nearMaxMessage = 'x'.repeat(maxCapacity - 10)
      
      const hiddenImageData = steganography.hideData(testImageData, nearMaxMessage)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(nearMaxMessage)
    })
  })

  describe('隐藏数据检测测试', () => {
    test('应该能够检测包含隐藏数据的图像', () => {
      const message = 'Hidden message'
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const hasHidden = steganography.hasHiddenData(hiddenImageData)
      
      expect(hasHidden).toBe(true)
    })

    test('应该能够检测不包含隐藏数据的图像', () => {
      const hasHidden = steganography.hasHiddenData(testImageData)
      
      expect(hasHidden).toBe(false)
    })

    test('损坏的图像数据应该返回false', () => {
      // 创建无效的图像数据
      const invalidImageData: StegoImageData = {
        data: new Uint8ClampedArray(100),
        width: 10,
        height: 10
      }
      
      const hasHidden = steganography.hasHiddenData(invalidImageData)
      
      expect(hasHidden).toBe(false)
    })
  })

  describe('边界条件测试', () => {
    test('应该处理较小尺寸的图像', () => {
      const minImageData: StegoImageData = {
        data: new Uint8ClampedArray(20 * 20 * 4), // 20x20 RGBA，提供足够容量
        width: 20,
        height: 20
      }
      
      // 填充数据
      for (let i = 0; i < minImageData.data.length; i += 4) {
        minImageData.data[i] = 128     // R
        minImageData.data[i + 1] = 128 // G
        minImageData.data[i + 2] = 128 // B
        minImageData.data[i + 3] = 255 // A
      }
      
      const message = 'Hi'
      const minSteganography = new ImageSteganography({ checksum: false })
      
      const hiddenImageData = minSteganography.hideData(minImageData, message)
      const extractedMessage = minSteganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('应该处理单字符消息', () => {
      const message = 'A'
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('应该处理包含换行符的消息', () => {
      const message = 'Line 1\nLine 2\nLine 3'
      
      const hiddenImageData = steganography.hideData(testImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })
  })

  describe('组合选项测试', () => {
    test('应该能够同时使用密码和校验和', () => {
      const message = 'Message with both password and checksum'
      const password = 'testPassword123'
      
      const fullOptionsSteganography = new ImageSteganography({
        password,
        checksum: true
      })
      
      const hiddenImageData = fullOptionsSteganography.hideData(testImageData, message)
      const extractedMessage = fullOptionsSteganography.extractData(hiddenImageData)
      
      expect(extractedMessage).toBe(message)
    })

    test('不同选项的实例应该无法互相解密', () => {
      const message = 'Test message with special chars: 测试中文'
      
      const steganography1 = new ImageSteganography({ password: 'pass1', checksum: true })
      const steganography2 = new ImageSteganography({ password: 'pass2', checksum: true })
      
      const hiddenImageData = steganography1.hideData(testImageData, message)
      
      expect(() => {
        steganography2.extractData(hiddenImageData)
      }).toThrow()
    })
  })

  describe('性能测试', () => {
    test('应该能够处理较大的消息', () => {
      const largeMessage = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50)
      
      const start = Date.now()
      const hiddenImageData = steganography.hideData(testImageData, largeMessage)
      const extractedMessage = steganography.extractData(hiddenImageData)
      const end = Date.now()
      
      expect(extractedMessage).toBe(largeMessage)
      expect(end - start).toBeLessThan(1000) // 应该在1秒内完成
    })

    test('应该能够处理较大的图像', () => {
      // 创建更大的测试图像 (200x200)
      const width = 200
      const height = 200
      const data = new Uint8ClampedArray(width * height * 4)
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(Math.random() * 256)
        data[i + 1] = Math.floor(Math.random() * 256)
        data[i + 2] = Math.floor(Math.random() * 256)
        data[i + 3] = 255
      }
      
      const largeImageData: StegoImageData = { data, width, height }
      const message = 'Message in large image'
      
      const start = Date.now()
      const hiddenImageData = steganography.hideData(largeImageData, message)
      const extractedMessage = steganography.extractData(hiddenImageData)
      const end = Date.now()
      
      expect(extractedMessage).toBe(message)
      expect(end - start).toBeLessThan(2000) // 应该在2秒内完成
    })
  })
})