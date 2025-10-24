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

// 新增：移动端安全的二进制字符集，仅使用两个兼容性最好的零宽字符
const BINARY_ZERO_WIDTH_CHARS = {
  '0': '\u200B', // 0 -> ZWSP
  '1': '\u200C', // 1 -> ZWNJ
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
  /** 编码方案：默认 'hex'，移动端安全可用 'binary' */
  encoding?: 'hex' | 'binary'
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
function stringToBytes(str: string): Uint8Array {
  // 优先使用原生 TextEncoder；小程序等环境没有时，使用纯 JS UTF-8 编码
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str)
  }
  return utf8Encode(str)
}

// 纯 JS UTF-8 编码（兼容高码点）
function utf8Encode(str: string): Uint8Array {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i)
    // 处理代理对 -> 生成 Unicode 码点
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000
        i++
      }
    }
    if (code <= 0x7f) {
      bytes.push(code)
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code <= 0xffff) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
    }
  }
  return new Uint8Array(bytes)
}

/**
 * 将 UTF-8 字节转换为字符串
 */
function bytesToString(bytes: Uint8Array): string {
  // 优先使用原生 TextDecoder；没有时用纯 JS UTF-8 解码
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  }
  return utf8Decode(bytes)
}

// 纯 JS UTF-8 解码
function utf8Decode(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; ) {
    const b1 = bytes[i++]
    if (b1 < 0x80) {
      out += String.fromCharCode(b1)
      continue
    }
    if ((b1 & 0xe0) === 0xc0) {
      // 2 字节
      const b2 = bytes[i++] & 0x3f
      const cp = ((b1 & 0x1f) << 6) | b2
      out += String.fromCharCode(cp)
      continue
    }
    if ((b1 & 0xf0) === 0xe0) {
      // 3 字节
      const b2 = bytes[i++] & 0x3f
      const b3 = bytes[i++] & 0x3f
      const cp = ((b1 & 0x0f) << 12) | (b2 << 6) | b3
      out += String.fromCharCode(cp)
      continue
    }
    if ((b1 & 0xf8) === 0xf0) {
      // 4 字节
      const b2 = bytes[i++] & 0x3f
      const b3 = bytes[i++] & 0x3f
      const b4 = bytes[i++] & 0x3f
      const cp = ((b1 & 0x07) << 18) | (b2 << 12) | (b3 << 6) | b4
      if (cp <= 0xffff) {
        out += String.fromCharCode(cp)
      } else {
        const adjusted = cp - 0x10000
        const high = 0xd800 + (adjusted >> 10)
        const low = 0xdc00 + (adjusted & 0x3ff)
        out += String.fromCharCode(high, low)
      }
      continue
    }
    // 非法首字节，按替换字符处理
    out += '\uFFFD'
  }
  return out
}

/**
 * 将字节转换为十六进制字符串
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 将十六进制字符串转换为字节
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

/**
 * 将十六进制字符串编码为零宽度字符
 */
function encodeToZeroWidth(hex: string): string {
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

// 新增：二进制到零宽字符的编码
function bytesToBitString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('')
}

function encodeBitsToZeroWidth(bits: string): string {
  return bits
    .split('')
    .map(bit => BINARY_ZERO_WIDTH_CHARS[bit as keyof typeof BINARY_ZERO_WIDTH_CHARS] || '')
    .join('')
}

/**
 * 将零宽度字符解码为十六进制字符串
 */
function decodeFromZeroWidth(zeroWidthText: string): string {
  return Array.from(zeroWidthText)
    .map(char => CHAR_TO_HEX[char] || '')
    .join('')
}

// 新增：从零宽字符解码为二进制位串
const BINARY_CHAR_TO_BIT: Record<string, string> = {
  ['\u200B']: '0',
  ['\u200C']: '1',
}

function decodeZeroWidthToBits(zeroWidthText: string): string {
  return Array.from(zeroWidthText)
    .map(char => BINARY_CHAR_TO_BIT[char] || '')
    .join('')
}

function bitStringToBytes(bits: string): Uint8Array {
  const len = Math.floor(bits.length / 8)
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    const byteBits = bits.slice(i * 8, i * 8 + 8)
    out[i] = parseInt(byteBits, 2)
  }
  return out
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
  const zeroWidthChars = [
    ...Object.values(ZERO_WIDTH_CHARS),
    ...Object.values(BINARY_ZERO_WIDTH_CHARS),
  ]
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
  private encoding: 'hex' | 'binary'

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
    this.encoding = options.encoding ?? 'hex'
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

      if (this.encoding === 'binary') {
        // 移动端安全：二进制编码
        const bitString = bytesToBitString(encryptedWatermark)
        const zeroWidthWatermark = encodeBitsToZeroWidth(bitString)
        return insertWatermarkRandomly(text, zeroWidthWatermark, this.seed)
      }

      // 默认十六进制编码
      const hexWatermark = bytesToHex(encryptedWatermark)
      const zeroWidthWatermark = encodeToZeroWidth(hexWatermark)
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

      if (this.encoding === 'binary') {
        const bits = decodeZeroWidthToBits(zeroWidthChars)
        if (!bits || bits.length % 8 !== 0) {
          throw new Error('无效的水印格式')
        }
        const encryptedWatermark = bitStringToBytes(bits)
        const watermark = xorCrypt(encryptedWatermark, this.password)
        return watermark
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
    const zeroWidthChars = [
      ...Object.values(ZERO_WIDTH_CHARS),
      ...Object.values(BINARY_ZERO_WIDTH_CHARS),
    ]
    return Array.from(textWithWatermark)
      .filter(char => !(zeroWidthChars as readonly string[]).includes(char))
      .join('')
  }
}

// 导出工具函数供高级用法使用
export {
  stringToBytes,
  bytesToString,
  bytesToHex,
  hexToBytes,
  encodeToZeroWidth,
  decodeFromZeroWidth,
  ZERO_WIDTH_CHARS,
  BINARY_ZERO_WIDTH_CHARS,
}

// 默认导出
export default TextBlindWatermark
