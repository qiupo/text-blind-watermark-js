/**
 * 图像隐写术模块 - 使用LSB算法在图像中隐藏和提取数据
 * 
 * 基于最低有效位(LSB)隐写术技术，将数据隐藏在图像的像素中。
 * 支持在浏览器环境中使用Canvas API处理图像数据。
 * 使用AES-256-GCM加密和PBKDF2密码派生函数确保数据安全。
 * 
 * @author qiupo
 * @license MIT
 */

import CryptoJS from 'crypto-js'

/**
 * 图像隐写术配置选项
 */
export interface ImageSteganographyOptions {
  /** 加密密码 */
  password?: string
  /** 是否压缩数据 */
  compress?: boolean
  /** 数据完整性校验 */
  checksum?: boolean
}

/**
 * 图像数据接口
 */
export interface StegoImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

/**
 * 将字符串转换为二进制字符串
 */
function stringToBinary(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('')
}

/**
 * 将二进制字符串转换为字符串
 */
function binaryToString(binary: string): string {
  const bytes = []
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8)
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2))
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

/**
 * 使用PBKDF2派生密钥
 */
function deriveKey(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256位密钥
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256
  }).toString()
}

/**
 * 使用AES-256-CBC加密数据
 */
function aesEncrypt(data: string, password: string): { encrypted: string; salt: string; iv: string } {
  if (!password) return { encrypted: data, salt: '', iv: '' }
  
  // 生成随机盐和初始化向量
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString()
  const iv = CryptoJS.lib.WordArray.random(128 / 8).toString()
  
  // 派生密钥
  const key = deriveKey(password, salt)
  
  // 加密数据
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: CryptoJS.enc.Hex.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString()
  
  return { encrypted, salt, iv }
}

/**
 * 使用AES-256-CBC解密数据
 */
function aesDecrypt(encryptedData: string, password: string, salt: string, iv: string): string {
  if (!password) return encryptedData
  
  try {
    // 派生密钥
    const key = deriveKey(password, salt)
    
    // 解密数据
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    const result = decrypted.toString(CryptoJS.enc.Utf8)
    if (!result) {
      throw new Error('解密失败')
    }
    return result
  } catch {
    throw new Error('解密失败：密码错误或数据损坏')
  }
}

/**
 * 计算SHA-256校验和
 */
function calculateChecksum(data: string): string {
  return CryptoJS.SHA256(data).toString().substring(0, 8) // 取前8个字符作为校验和
}

/**
 * 图像隐写术类
 */
export class ImageSteganography {
  private options: ImageSteganographyOptions

  constructor(options: ImageSteganographyOptions = {}) {
    this.options = {
      compress: false,
      checksum: true,
      ...options
    }
  }

  /**
   * 获取图像的最大数据容量（字节）
   */
  getMaxCapacity(imageData: StegoImageData): number {
    // 每个像素有3个颜色通道(RGB)，每个通道可以存储1位
    // 减去用于存储数据长度和校验和的空间
    const totalBits = imageData.width * imageData.height * 3
    const headerBits = 32 + (this.options.checksum ? 16 : 0) // 长度(32位) + 校验和(16位)
    return Math.floor((totalBits - headerBits) / 8)
  }

  /**
   * 在图像中隐藏数据
   */
  hideData(imageData: StegoImageData, message: string): StegoImageData {
    let processedMessage = message
    let encryptionMeta = ''

    // 使用AES加密
    if (this.options.password) {
      const { encrypted, salt, iv } = aesEncrypt(processedMessage, this.options.password)
      processedMessage = encrypted
      // 将盐和IV编码到元数据中
      encryptionMeta = `${salt}:${iv}`
    }

    // 计算校验和（使用加密后的数据）
    let checksum = ''
    if (this.options.checksum) {
      checksum = calculateChecksum(processedMessage)
    }

    // 准备要隐藏的数据：加密元数据长度 + 加密元数据 + 消息长度 + 校验和 + 数据
    const encryptionMetaBinary = stringToBinary(encryptionMeta)
    const encryptionMetaLength = encryptionMetaBinary.length / 8
    const encryptionMetaLengthBinary = encryptionMetaLength.toString(2).padStart(32, '0')
    
    const messageBinary = stringToBinary(processedMessage)
    const messageByteLength = messageBinary.length / 8 // 字节长度
    const lengthBinary = messageByteLength.toString(2).padStart(32, '0')
    const checksumBinary = this.options.checksum ? 
      stringToBinary(checksum) : ''
    
    const fullBinary = encryptionMetaLengthBinary + encryptionMetaBinary + lengthBinary + checksumBinary + messageBinary

    // 检查容量
    const maxCapacity = this.getMaxCapacity(imageData)
    const totalDataSize = encryptionMetaLength + messageByteLength + (this.options.checksum ? checksum.length : 0)
    if (totalDataSize > maxCapacity) {
      throw new Error(`Message too large. Max capacity: ${maxCapacity} bytes, message: ${totalDataSize} bytes`)
    }

    // 创建新的图像数据
    const newImageData: StegoImageData = {
      data: new Uint8ClampedArray(imageData.data),
      width: imageData.width,
      height: imageData.height
    }

    // 将二进制数据嵌入到像素中
    let binaryIndex = 0
    for (let i = 0; i < newImageData.data.length && binaryIndex < fullBinary.length; i += 4) {
      // 处理RGB通道（跳过Alpha通道）
      for (let channel = 0; channel < 3 && binaryIndex < fullBinary.length; channel++) {
        const pixelIndex = i + channel
        const bit = fullBinary[binaryIndex]
        
        // 修改最低有效位
        if (bit === '1') {
          newImageData.data[pixelIndex] |= 1 // 设置LSB为1
        } else {
          newImageData.data[pixelIndex] &= 0xFE // 设置LSB为0
        }
        
        binaryIndex++
      }
    }

    return newImageData
  }

  /**
   * 从图像中提取数据
   */
  extractData(imageData: StegoImageData): string {
    // 首先提取加密元数据长度（32位）
    let binaryData = ''
    let binaryIndex = 0

    // 提取加密元数据长度
    for (let i = 0; i < imageData.data.length && binaryIndex < 32; i += 4) {
      for (let channel = 0; channel < 3 && binaryIndex < 32; channel++) {
        const pixelIndex = i + channel
        const lsb = imageData.data[pixelIndex] & 1
        binaryData += lsb.toString()
        binaryIndex++
      }
    }

    const encryptionMetaLength = parseInt(binaryData, 2)
    
    // 提取加密元数据
    const encryptionMetaBits = encryptionMetaLength * 8
    for (let i = Math.floor(binaryIndex / 3) * 4; i < imageData.data.length && binaryIndex < 32 + encryptionMetaBits; i += 4) {
      for (let channel = binaryIndex % 3; channel < 3 && binaryIndex < 32 + encryptionMetaBits; channel++) {
        const pixelIndex = i + channel
        const lsb = imageData.data[pixelIndex] & 1
        binaryData += lsb.toString()
        binaryIndex++
      }
    }

    const encryptionMetaBinary = binaryData.slice(32, 32 + encryptionMetaBits)
    const encryptionMeta = binaryToString(encryptionMetaBinary)

    // 提取消息长度（32位）
    for (let i = Math.floor(binaryIndex / 3) * 4; i < imageData.data.length && binaryIndex < 32 + encryptionMetaBits + 32; i += 4) {
      for (let channel = binaryIndex % 3; channel < 3 && binaryIndex < 32 + encryptionMetaBits + 32; channel++) {
        const pixelIndex = i + channel
        const lsb = imageData.data[pixelIndex] & 1
        binaryData += lsb.toString()
        binaryIndex++
      }
    }

    const messageByteLength = parseInt(binaryData.slice(32 + encryptionMetaBits, 32 + encryptionMetaBits + 32), 2)
    if (messageByteLength < 0 || messageByteLength > this.getMaxCapacity(imageData)) {
      throw new Error('Invalid message length or no hidden data found')
    }

    // 如果消息长度为0，直接返回空字符串
    if (messageByteLength === 0) {
      return ''
    }

    // 计算校验和位数
    let checksumBits = 0
    if (this.options.checksum) {
      checksumBits = 64 // SHA-256校验和的前8个字符 = 8字节 = 64位
    }

    // 计算总共需要提取的位数
    const totalBitsNeeded = 32 + encryptionMetaBits + 32 + checksumBits + (messageByteLength * 8)

    // 继续提取剩余的数据
    for (let i = Math.floor(binaryIndex / 3) * 4; i < imageData.data.length && binaryIndex < totalBitsNeeded; i += 4) {
      for (let channel = binaryIndex % 3; channel < 3 && binaryIndex < totalBitsNeeded; channel++) {
        const pixelIndex = i + channel
        const lsb = imageData.data[pixelIndex] & 1
        binaryData += lsb.toString()
        binaryIndex++
      }
    }

    // 解析数据
    const dataStartIndex = 32 + encryptionMetaBits + 32
    const messageBinary = binaryData.slice(dataStartIndex + checksumBits)
    let extractedMessage = binaryToString(messageBinary)

    // 验证校验和（使用加密后的数据）
    if (this.options.checksum) {
      const extractedChecksumBinary = binaryData.slice(dataStartIndex, dataStartIndex + checksumBits)
      const extractedChecksum = binaryToString(extractedChecksumBinary)
      
      // 计算加密数据的校验和
      const calculatedChecksum = calculateChecksum(extractedMessage)
      
      if (extractedChecksum !== calculatedChecksum) {
        throw new Error('Data integrity check failed')
      }
    }

    // 使用AES解密
    if (this.options.password && encryptionMeta) {
      const [salt, iv] = encryptionMeta.split(':')
      if (!salt || !iv) {
        throw new Error('Invalid encryption metadata')
      }
      
      try {
         extractedMessage = aesDecrypt(extractedMessage, this.options.password, salt, iv)
       } catch {
         throw new Error('Decryption failed: invalid password or corrupted data')
       }
    }

    return extractedMessage
  }

  /**
   * 检查图像是否包含隐藏数据
   */
  hasHiddenData(imageData: StegoImageData): boolean {
    try {
      // 首先提取加密元数据长度（32位）
      let binaryData = ''
      let binaryIndex = 0

      // 提取加密元数据长度
      for (let i = 0; i < imageData.data.length && binaryIndex < 32; i += 4) {
        for (let channel = 0; channel < 3 && binaryIndex < 32; channel++) {
          const pixelIndex = i + channel
          const lsb = imageData.data[pixelIndex] & 1
          binaryData += lsb.toString()
          binaryIndex++
        }
      }

      if (binaryData.length < 32) {
        return false
      }

      const encryptionMetaLength = parseInt(binaryData, 2)
      
      // 计算需要提取的总位数：32位元数据长度 + 元数据位数 + 32位消息长度
      const encryptionMetaBits = encryptionMetaLength * 8
      const totalBitsNeeded = 32 + encryptionMetaBits + 32

      // 继续提取剩余数据
      for (let i = Math.floor(binaryIndex / 3) * 4; i < imageData.data.length && binaryIndex < totalBitsNeeded; i += 4) {
        for (let channel = binaryIndex % 3; channel < 3 && binaryIndex < totalBitsNeeded; channel++) {
          const pixelIndex = i + channel
          const lsb = imageData.data[pixelIndex] & 1
          binaryData += lsb.toString()
          binaryIndex++
        }
      }

      if (binaryData.length < totalBitsNeeded) {
        return false
      }

      // 提取消息长度（跳过加密元数据）
      const messageLengthStart = 32 + encryptionMetaBits
      const messageLength = parseInt(binaryData.substring(messageLengthStart, messageLengthStart + 32), 2)
      
      // 检查长度是否合理
      const maxCapacity = this.getMaxCapacity(imageData)
      const checksumLength = this.options.checksum ? 8 : 0 // 校验和字节长度
      const totalDataLength = encryptionMetaLength + messageLength + checksumLength
      
      return encryptionMetaLength >= 0 && messageLength > 0 && totalDataLength <= maxCapacity
    } catch {
      return false
    }
  }
}

/**
 * Canvas工具函数 - 用于浏览器环境
 */
export class CanvasImageProcessor {
  /**
   * 从文件加载图像到Canvas
   */
  static loadImageFromFile(file: File): Promise<StegoImageData> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx!.drawImage(img, 0, 0)
        
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        resolve(imageData)
      }

      img.onerror = reject

      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target!.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * 将ImageData转换为Blob
   */
  static imageDataToBlob(imageData: StegoImageData, format: string = 'image/png'): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = imageData.width
      canvas.height = imageData.height
      
      // 创建标准的ImageData对象
      const standardImageData = ctx!.createImageData(imageData.width, imageData.height)
      standardImageData.data.set(imageData.data)
      ctx!.putImageData(standardImageData, 0, 0)
      
      canvas.toBlob((blob) => {
        resolve(blob!)
      }, format)
    })
  }

  /**
   * 下载图像
   */
  static downloadImage(imageData: StegoImageData, filename: string = 'hidden-image.png') {
    this.imageDataToBlob(imageData).then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }
}

// 导出默认实例
export default ImageSteganography