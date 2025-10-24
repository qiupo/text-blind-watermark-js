/**
 * 文本盲水印 - JavaScript 实现
 * 
 * 主入口文件，提供所有功能的统一导出
 * 支持按需引入和完整导入两种方式
 */

// 从文本盲水印模块导入
export {
  TextBlindWatermark,
  type WatermarkOptions,
  stringToBytes,
  bytesToString,
  bytesToHex,
  hexToBytes,
  encodeToZeroWidth,
  decodeFromZeroWidth,
  ZERO_WIDTH_CHARS,
} from './text-blind-watermark'

// 从图像隐写术模块导入
export {
  ImageSteganography,
  CanvasImageProcessor,
  type ImageSteganographyOptions,
  type StegoImageData,
} from './image-steganography'

// 默认导出TextBlindWatermark类以保持向后兼容
export { default } from './text-blind-watermark'
