/**
 * 文本盲水印 - JavaScript 实现
 *
 * Python text_blind_watermark 库的 JavaScript 移植版本。
 * 使用零宽度 Unicode 字符将不可见水印嵌入到文本中。
 *
 * @author Your Name
 * @license MIT
 */

// 用于隐写术的零宽度字符映射
const ZERO_WIDTH_CHARS = {
  '0': '\u200B', // 零宽度空格
  '1': '\u200C', // 零宽度非连接符
  '2': '\u200D', // 零宽度连接符
  '3': '\u2060', // 单词连接符
  '4': '\u2061', // 函数应用符
  '5': '\u2062', // 不可见乘号
  '6': '\u2063', // 不可见分隔符
  '7': '\u2064', // 不可见加号
  '8': '\uFEFF', // 零宽度不换行空格
  '9': '\u180E', // 蒙古文元音分隔符
  A: '\u061C', // 阿拉伯字母标记
  B: '\u17B4', // 高棉语元音 Aq
  C: '\u17B5', // 高棉语元音 Aa
  D: '\u200E', // 从左到右标记
  E: '\u200F', // 从右到左标记
  F: '\u202A', // 从左到右嵌入
} as const

// 用于解码的反向映射
const CHAR_TO_HEX: Record<string, string> = {}
Object.entries(ZERO_WIDTH_CHARS).forEach(([hex, char]) => {
  CHAR_TO_HEX[char] = hex
})

/**
 * TextBlindWatermark 的配置选项
 */
export interface WatermarkOptions {
  /** 加密密码（字符串或 Uint8Array） */
  password?: string | Uint8Array
  /** 用于可重现水印放置的随机种子 */
  seed?: number
}

/**
 * 简单的 XOR 加密/解密
 */
function xorCrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length]
  }
  return result
}

/**
 * 将字符串转换为 UTF-8 字节
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * 将 UTF-8 字节转换为字符串
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

/**
 * 将字节转换为十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 将十六进制字符串转换为字节
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * 将十六进制字符串编码为零宽度字符
 */
export function encodeToZeroWidth(hex: string): string {
  return hex
    .split('')
    .map(char => {
      const upperChar = char.toUpperCase()
      if (upperChar in ZERO_WIDTH_CHARS) {
        return ZERO_WIDTH_CHARS[upperChar as keyof typeof ZERO_WIDTH_CHARS]
      }
      return ''
    })
    .join('')
}

/**
 * 将零宽度字符解码为十六进制字符串
 */
export function decodeFromZeroWidth(zeroWidthText: string): string {
  return Array.from(zeroWidthText)
    .map(char => CHAR_TO_HEX[char] || '')
    .join('')
}

/**
 * 用于可重现随机性的简单伪随机数生成器
 */
class SimpleRandom {
  private seed: number

  constructor(seed: number = Date.now()) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }
}

/**
 * 将水印字符随机插入到文本中（类似于 add_wm_rnd）
 */
function insertWatermarkRandomly(
  originalText: string,
  watermarkChars: string,
  seed?: number
): string {
  const textArray = Array.from(originalText)
  const watermarkArray = Array.from(watermarkChars)

  if (watermarkArray.length === 0) {
    return originalText
  }

  const random = new SimpleRandom(seed)
  const positions: number[] = []

  // 为水印插入生成随机位置
  for (let i = 0; i < watermarkArray.length; i++) {
    let pos: number
    do {
      pos = random.nextInt(textArray.length + i + 1)
    } while (positions.includes(pos))
    positions.push(pos)
  }

  // 按降序排列位置以避免索引偏移
  positions.sort((a, b) => b - a)

  // 插入水印字符
  const result = textArray.slice()
  watermarkArray.forEach((char, index) => {
    const pos = positions[watermarkArray.length - 1 - index]
    result.splice(pos, 0, char)
  })

  return result.join('')
}

/**
 * 从文本中提取零宽度字符
 */
function extractZeroWidthChars(text: string): string {
  const zeroWidthChars = Object.values(ZERO_WIDTH_CHARS)
  return Array.from(text)
    .filter(char => (zeroWidthChars as readonly string[]).includes(char))
    .join('')
}

/**
 * 主要的 TextBlindWatermark 类 - Python 库的 JavaScript 移植版本
 */
export class TextBlindWatermark {
  private password: Uint8Array
  private seed?: number

  /**
   * 初始化 TextBlindWatermark 实例
   * @param options 配置选项
   */
  constructor(options: WatermarkOptions = {}) {
    // 处理密码 - 支持字符串和 Uint8Array，与 Python 版本一样
    if (options.password instanceof Uint8Array) {
      this.password = options.password
    } else if (typeof options.password === 'string') {
      this.password = stringToBytes(options.password)
    } else {
      this.password = stringToBytes('default_password')
    }

    this.seed = options.seed
  }

  /**
   * 随机添加水印到文本中（等同于 Python 的 add_wm_rnd）
   * @param text 原始文本
   * @param watermark 水印内容（字符串或 Uint8Array）
   * @returns 嵌入水印的文本
   */
  addWatermarkRandom(text: string, watermark: string | Uint8Array): string {
    try {
      // 如果水印是字符串，则转换为字节
      const watermarkBytes = typeof watermark === 'string' ? stringToBytes(watermark) : watermark

      // 加密水印
      const encryptedWatermark = xorCrypt(watermarkBytes, this.password)

      // 转换为十六进制
      const hexWatermark = bytesToHex(encryptedWatermark)

      // 编码为零宽度字符
      const zeroWidthWatermark = encodeToZeroWidth(hexWatermark)

      // 随机插入到文本中
      return insertWatermarkRandomly(text, zeroWidthWatermark, this.seed)
    } catch (error) {
      throw new Error(`添加水印失败: ${error}`)
    }
  }

  /**
   * addWatermarkRandom 的别名，以匹配 Python API
   */
  add_wm_rnd(text: string, wm: string | Uint8Array): string {
    return this.addWatermarkRandom(text, wm)
  }

  /**
   * 从文本中提取水印（等同于 Python 的 extract）
   * @param textWithWatermark 包含水印的文本
   * @returns 提取的水印作为 Uint8Array
   */
  extract(textWithWatermark: string): Uint8Array {
    try {
      // 提取零宽度字符
      const zeroWidthChars = extractZeroWidthChars(textWithWatermark)

      if (!zeroWidthChars) {
        throw new Error('未找到水印')
      }

      // 解码为十六进制
      const hexWatermark = decodeFromZeroWidth(zeroWidthChars)

      if (!hexWatermark || hexWatermark.length % 2 !== 0) {
        throw new Error('无效的水印格式')
      }

      // 转换为字节
      const encryptedWatermark = hexToBytes(hexWatermark)

      // 解密水印
      const watermark = xorCrypt(encryptedWatermark, this.password)

      return watermark
    } catch (error) {
      throw new Error(`提取水印失败: ${error}`)
    }
  }

  /**
   * 提取水印并返回为字符串
   * @param textWithWatermark 包含水印的文本
   * @returns 提取的水印作为字符串
   */
  extractAsString(textWithWatermark: string): string {
    const watermarkBytes = this.extract(textWithWatermark)
    return bytesToString(watermarkBytes)
  }

  /**
   * 检查文本是否包含水印
   * @param text 要检查的文本
   * @returns 如果检测到水印则返回 true
   */
  hasWatermark(text: string): boolean {
    try {
      const zeroWidthChars = extractZeroWidthChars(text)
      return zeroWidthChars.length > 0
    } catch {
      return false
    }
  }

  /**
   * 从文本中移除水印
   * @param textWithWatermark 包含水印的文本
   * @returns 不含水印的干净文本
   */
  removeWatermark(textWithWatermark: string): string {
    const zeroWidthChars = Object.values(ZERO_WIDTH_CHARS)
    return Array.from(textWithWatermark)
      .filter(char => !(zeroWidthChars as readonly string[]).includes(char))
      .join('')
  }


}

// 导出零宽度字符常量
export { ZERO_WIDTH_CHARS }

// 默认导出
export default TextBlindWatermark