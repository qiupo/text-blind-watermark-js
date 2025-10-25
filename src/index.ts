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
  '0': '\u200B', // ZWSP
  '1': '\u2060', // Word Joiner
  '2': '\u2061', // Function Application
  '3': '\u2062', // Invisible Times
  '4': '\u2063', // Invisible Separator
  '5': '\u2064', // Invisible Plus
  '6': '\uFEFF', // Zero Width No-Break Space (ZWNBSP)
  '7': '\u200C', // Zero Width Non-Joiner (ZWNJ)
  '8': '\u200D', // Zero Width Joiner (ZWJ)
  '9': '\u180B', // Mongolian Variation Selector-1
  A: '\u180C', // Mongolian Variation Selector-2
  B: '\u180D', // Mongolian Variation Selector-3
  C: '\uFE00', // Variation Selector-1
  D: '\uFE01', // Variation Selector-2
  E: '\uFE02', // Variation Selector-3
  F: '\uFE03', // Variation Selector-4
} as const

// 新增：移动端安全的二进制字符集，仅使用两个兼容性最好的零宽字符
const BINARY_ZERO_WIDTH_CHARS = {
  '0': '\u200B', // 0 -> ZWSP
  '1': '\u200C', // 1 -> Zero Width Non-Joiner (ZWNJ)
} as const

// 新增：四进制（base4）移动端安全字符集，2bit/字符，体积比 binary 缩半
const BASE4_ZERO_WIDTH_CHARS = {
  '0': '\u200B', // 00 (ZWSP)
  '1': '\u2060', // 01 (Word Joiner)
  '2': '\u2062', // 10 (Invisible Times)
  '3': '\u2063', // 11 (Invisible Separator)
} as const

// 新增：八进制（base8）移动端紧凑字符集，3bit/字符，体积比 base4 再缩 33%
const BASE8_ZERO_WIDTH_CHARS = {
  '0': '\u200B', // 000 (ZWSP)
  '1': '\u2060', // 001 (Word Joiner)
  '2': '\u2061', // 010 (Function Application)
  '3': '\u2062', // 011 (Invisible Times)
  '4': '\u2063', // 100 (Invisible Separator)
  '5': '\u2064', // 101 (Invisible Plus)
  '6': '\uFEFF', // 110 (Zero Width No-Break Space)
  '7': '\u200C', // 111 (Zero Width Non-Joiner)
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
  /** 编码方案：默认 'hex'，移动端安全可用 'binary' 或 'base4'，更紧凑可选 'base8' */
  encoding?: 'hex' | 'binary' | 'base4' | 'base8'
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

// 新增：将位串按 2 位编码为 base4 零宽字符
function encodeBitsToZeroWidthBase4(bits: string): string {
  let out = ''
  for (let i = 0; i < bits.length; i += 2) {
    const pair = bits.slice(i, i + 2)
    const idx = parseInt(pair.padEnd(2, '0'), 2)
    const key = String(idx) as keyof typeof BASE4_ZERO_WIDTH_CHARS
    out += BASE4_ZERO_WIDTH_CHARS[key] || ''
  }
  return out
}

// 新增：将位串按 3 位编码为 base8 零宽字符（为保证还原字节数，配合长度前缀使用）
function encodeBitsToZeroWidthBase8(bits: string): string {
  let out = ''
  for (let i = 0; i < bits.length; i += 3) {
    const triplet = bits.slice(i, i + 3)
    const idx = parseInt(triplet.padEnd(3, '0'), 2)
    const key = String(idx) as keyof typeof BASE8_ZERO_WIDTH_CHARS
    out += BASE8_ZERO_WIDTH_CHARS[key] || ''
  }
  return out
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

// base4 反向映射
const BASE4_CHAR_TO_BITS: Record<string, string> = {
  ['\u200B']: '00',
  ['\u2060']: '01',
  ['\u2062']: '10',
  ['\u2063']: '11',
}

// base8 反向映射
const BASE8_CHAR_TO_BITS: Record<string, string> = {
  ['\u200B']: '000',
  ['\u2060']: '001',
  ['\u2061']: '010',
  ['\u2062']: '011',
  ['\u2063']: '100',
  ['\u2064']: '101',
  ['\uFEFF']: '110',
  ['\u200C']: '111',
}

// 修复：还原二进制解码函数
function decodeZeroWidthToBits(zeroWidthText: string): string {
  return Array.from(zeroWidthText)
    .map(char => BINARY_CHAR_TO_BIT[char] || '')
    .join('')
}

// 修复：base4 解码函数映射到 BASE4_CHAR_TO_BITS
function decodeZeroWidthBase4ToBits(zeroWidthText: string): string {
  return Array.from(zeroWidthText)
    .map(char => BASE4_CHAR_TO_BITS[char] || '')
    .join('')
}

// 保持：base8 解码函数
function decodeZeroWidthBase8ToBits(zeroWidthText: string): string {
  return Array.from(zeroWidthText)
    .map(char => BASE8_CHAR_TO_BITS[char] || '')
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
    ...Object.values(BASE4_ZERO_WIDTH_CHARS),
    ...Object.values(BASE8_ZERO_WIDTH_CHARS),
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
  private encoding: 'hex' | 'binary' | 'base4' | 'base8'

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

  // 数值转固定长度二进制串（用于 base8 长度前缀）
  private numberToFixedBits(n: number, bitLength: number): string {
    let s = Math.max(0, n >>> 0).toString(2) // 32bit 无符号
    if (s.length > bitLength) s = s.slice(-bitLength)
    return s.padStart(bitLength, '0')
  }

  addWatermarkRandom(text: string, watermark: string | Uint8Array): string {
    try {
      const watermarkBytes = typeof watermark === 'string' ? stringToBytes(watermark) : watermark
      const encryptedWatermark = xorCrypt(watermarkBytes, this.password)

      if (this.encoding === 'binary') {
        const bitString = bytesToBitString(encryptedWatermark)
        const zeroWidthWatermark = encodeBitsToZeroWidth(bitString)
        return insertWatermarkRandomly(text, zeroWidthWatermark, this.seed)
      }

      if (this.encoding === 'base4') {
        const bitString = bytesToBitString(encryptedWatermark)
        const zeroWidthWatermark = encodeBitsToZeroWidthBase4(bitString)
        return insertWatermarkRandomly(text, zeroWidthWatermark, this.seed)
      }

      if (this.encoding === 'base8') {
        const bitString = bytesToBitString(encryptedWatermark)
        const header = this.numberToFixedBits(encryptedWatermark.length, 32) // 32bit 长度前缀（字节）
        const zeroWidthWatermark = encodeBitsToZeroWidthBase8(header + bitString)
        return insertWatermarkRandomly(text, zeroWidthWatermark, this.seed)
      }

      const hexWatermark = bytesToHex(encryptedWatermark)
      const zeroWidthWatermark = encodeToZeroWidth(hexWatermark)
      return insertWatermarkRandomly(text, zeroWidthWatermark, this.seed)
    } catch (error) {
      throw new Error(`添加水印失败: ${error}`)
    }
  }

  extract(textWithWatermark: string): Uint8Array {
    try {
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

      if (this.encoding === 'base4') {
        const bits = decodeZeroWidthBase4ToBits(zeroWidthChars)
        if (!bits || bits.length % 8 !== 0) {
          throw new Error('无效的水印格式')
        }
        const encryptedWatermark = bitStringToBytes(bits)
        const watermark = xorCrypt(encryptedWatermark, this.password)
        return watermark
      }

      if (this.encoding === 'base8') {
        const bits = decodeZeroWidthBase8ToBits(zeroWidthChars)
        if (!bits || bits.length < 32) {
          throw new Error('无效的水印格式')
        }
        const lenBytes = parseInt(bits.slice(0, 32), 2) >>> 0
        const payloadBits = bits.slice(32, 32 + lenBytes * 8)
        if (payloadBits.length !== lenBytes * 8) {
          throw new Error('无效的水印长度')
        }
        const encryptedWatermark = bitStringToBytes(payloadBits)
        const watermark = xorCrypt(encryptedWatermark, this.password)
        return watermark
      }

      const hexWatermark = decodeFromZeroWidth(zeroWidthChars)
      if (!hexWatermark || hexWatermark.length % 2 !== 0) {
        throw new Error('无效的水印格式')
      }
      const encryptedWatermark = hexToBytes(hexWatermark)
      const watermark = xorCrypt(encryptedWatermark, this.password)
      return watermark
    } catch (error) {
      throw new Error(`提取水印失败: ${error}`)
    }
  }

  // 兼容 Python 风格 API
  add_wm_rnd(text: string, wm: string | Uint8Array): string {
    return this.addWatermarkRandom(text, wm)
  }

  // 提取为字符串
  extractAsString(textWithWatermark: string): string {
    const watermarkBytes = this.extract(textWithWatermark)
    return bytesToString(watermarkBytes)
  }

  // 检测是否包含水印
  hasWatermark(text: string): boolean {
    try {
      const zeroWidthChars = extractZeroWidthChars(text)
      return zeroWidthChars.length > 0
    } catch {
      return false
    }
  }

  removeWatermark(textWithWatermark: string): string {
    const zeroWidthChars = [
      ...Object.values(ZERO_WIDTH_CHARS),
      ...Object.values(BINARY_ZERO_WIDTH_CHARS),
      ...Object.values(BASE4_ZERO_WIDTH_CHARS),
      ...Object.values(BASE8_ZERO_WIDTH_CHARS),
    ]
    return Array.from(textWithWatermark)
      .filter(char => !(zeroWidthChars as readonly string[]).includes(char))
      .join('')
  }
}

export {
  stringToBytes,
  bytesToString,
  bytesToHex,
  hexToBytes,
  encodeToZeroWidth,
  decodeFromZeroWidth,
  ZERO_WIDTH_CHARS,
  BINARY_ZERO_WIDTH_CHARS,
  BASE4_ZERO_WIDTH_CHARS,
  BASE8_ZERO_WIDTH_CHARS,
}

// 默认导出
export default TextBlindWatermark
