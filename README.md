# Text Blind Watermark JS

[![npm version](https://badge.fury.io/js/text-blind-watermark-js.svg)](https://badge.fury.io/js/text-blind-watermark-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

[中文文档](./README.zh-CN.md) | English

A JavaScript/TypeScript implementation of text blind watermarking, inspired by the Python [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) library. This library allows you to embed invisible watermarks into text using zero-width Unicode characters.

## ✨ Features

- 🔒 **Invisible Watermarks**: Embed completely invisible watermarks using zero-width Unicode characters
- 🖼️ **Image Steganography**: Hide text/data in images using LSB (Least Significant Bit) technique
- 🛡️ **Password Protection**: Secure your watermarks with password-based encryption
- 🌐 **Cross-Platform**: Works in browsers, Node.js, and various platforms (WeChat, DingTalk, etc.)
- 📱 **Unicode Support**: Full support for international text and emojis
- 🎯 **TypeScript**: Written in TypeScript with full type definitions
- 🔄 **Python Compatible**: API compatible with the original Python library
- 📦 **Multiple Formats**: Available as ES modules, CommonJS, and UMD builds

## 🚀 Installation

```bash
npm install text-blind-watermark-js
```

Or using yarn:

```bash
yarn add text-blind-watermark-js
```

## 📖 Quick Start

### Text Watermarking

```javascript
import { TextBlindWatermark } from 'text-blind-watermark-js'

// Create watermark instance
const watermark = new TextBlindWatermark({ password: 'your-secret-password' })

// Add watermark to text
const originalText = 'This is a sample text for watermarking.'
const secretMessage = 'Hidden watermark'
const textWithWatermark = watermark.addWatermarkRandom(originalText, secretMessage)

console.log('Text with watermark:', textWithWatermark)
// Output looks identical to original text!

// Extract watermark
const extractedMessage = watermark.extractAsString(textWithWatermark)
console.log('Extracted watermark:', extractedMessage)
// Output: "Hidden watermark"
```

### Image Steganography

```javascript
import { ImageSteganography, CanvasImageProcessor } from 'text-blind-watermark-js'

// Create steganography instance
const steganography = new ImageSteganography({ 
  password: 'image-secret',
  checksum: true 
})

// Browser usage with Canvas
const processor = new CanvasImageProcessor()

// Hide text in image
const imageFile = document.getElementById('imageInput').files[0]
const imageData = await processor.loadImageFromFile(imageFile)
const hiddenImageData = steganography.hideData(imageData, 'Secret message')

// Download the image with hidden data
processor.downloadImage(hiddenImageData, 'hidden-message.png')

// Extract hidden text from image
const extractedMessage = steganography.extractData(hiddenImageData)
console.log('Hidden message:', extractedMessage)
// Output: "Secret message"
```

### Python-Style API

For compatibility with the original Python library:

```javascript
import { TextBlindWatermark } from 'text-blind-watermark-js'

const watermark = new TextBlindWatermark({ password: 'test_password' })

// Using Python-style method names
const textWithWatermark = watermark.add_wm_rnd(originalText, secretMessage)
const extractedBytes = watermark.extract(textWithWatermark)
```

### Browser Usage (UMD)

```html
<script src="https://unpkg.com/text-blind-watermark-js/dist/index.umd.js"></script>
<script>
  const watermark = new TextBlindWatermark.default({ password: 'secret' })
  const result = watermark.addWatermarkRandom('Hello World', 'Hidden message')
  console.log(result)
</script>
```

## 🔧 API Reference

### Text Watermarking

#### Constructor

```typescript
new TextBlindWatermark(options?: WatermarkOptions)
```

**Options:**
- `password?: string | Uint8Array` - Password for encryption (default: 'default_password')
- `seed?: number` - Random seed for reproducible watermark placement

#### Methods

##### `addWatermarkRandom(text: string, watermark: string | Uint8Array): string`

Embeds a watermark into the text at random positions.

##### `add_wm_rnd(text: string, wm: string | Uint8Array): string`

Python-compatible alias for `addWatermarkRandom`.

##### `extract(textWithWatermark: string): Uint8Array`

Extracts the watermark as raw bytes.

##### `extractAsString(textWithWatermark: string): string`

Extracts the watermark as a UTF-8 string.

##### `hasWatermark(text: string): boolean`

Checks if the text contains a watermark.

##### `removeWatermark(textWithWatermark: string): string`

Removes the watermark from the text, returning clean text.

### Image Steganography

#### Constructor

```typescript
new ImageSteganography(options?: SteganographyOptions)
```

**Options:**
- `password?: string` - Password for encryption (optional)
- `checksum?: boolean` - Enable data integrity checking (default: true)

#### Methods

##### `hideData(imageData: StegoImageData, message: string): StegoImageData`

Hides a text message in the image using LSB steganography.

##### `extractData(imageData: StegoImageData): string`

Extracts hidden text from the image.

##### `hasHiddenData(imageData: StegoImageData): boolean`

Checks if the image contains hidden data.

##### `getMaxCapacity(imageData: StegoImageData): number`

Returns the maximum number of characters that can be hidden in the image.

#### Canvas Image Processor

```typescript
new CanvasImageProcessor()
```

##### `loadImageFromFile(file: File): Promise<StegoImageData>`

Loads an image file and returns image data for steganography.

##### `imageDataToBlob(imageData: StegoImageData, format?: string): Promise<Blob>`

Converts image data to a downloadable blob.

##### `downloadImage(imageData: StegoImageData, filename: string): void`

Downloads the image with hidden data.

## 🛠️ Advanced Usage

### Text Watermarking with Binary Data

```javascript
import { TextBlindWatermark, stringToBytes, bytesToString } from 'text-blind-watermark-js'

const watermark = new TextBlindWatermark({ password: 'binary_password' })

// Embed binary data
const binaryData = stringToBytes('Secret binary message')
const textWithWatermark = watermark.addWatermarkRandom(originalText, binaryData)

// Extract binary data
const extractedBytes = watermark.extract(textWithWatermark)
const extractedString = bytesToString(extractedBytes)
```

### Image Steganography with Encryption

```javascript
import { ImageSteganography } from 'text-blind-watermark-js'

// Create encrypted steganography instance
const steganography = new ImageSteganography({
  password: 'strong-encryption-key',
  checksum: true
})

// Hide sensitive data
const sensitiveData = 'Confidential information'
const hiddenImageData = steganography.hideData(imageData, sensitiveData)

// Only those with the correct password can extract the data
const extractedData = steganography.extractData(hiddenImageData)
```

### Node.js Image Processing

```javascript
// For Node.js environments, you can use the provided Node.js example
import { ImageSteganography } from 'text-blind-watermark-js'
import { NodeImageProcessor } from './examples/image-steganography-node.js'

const processor = new NodeImageProcessor()
const steganography = new ImageSteganography({ password: 'node-secret' })

// Load image from file system
const imageData = await processor.loadImageFromFile('input.png')

// Hide message
const hiddenImageData = steganography.hideData(imageData, 'Hidden in Node.js')

// Save to file system
await processor.saveImageToFile(hiddenImageData, 'output.png')
```

### Capacity Management

```javascript
import { ImageSteganography } from 'text-blind-watermark-js'

const steganography = new ImageSteganography()

// Check image capacity before hiding data
const maxCapacity = steganography.getMaxCapacity(imageData)
console.log(`Image can hide up to ${maxCapacity} characters`)

const message = 'Your message here'
if (message.length <= maxCapacity) {
  const hiddenImageData = steganography.hideData(imageData, message)
} else {
  console.error('Message too long for this image')
}
```

### Reproducible Watermarks

```javascript
const watermark = new TextBlindWatermark({ 
  password: 'secret', 
  seed: 12345 // Fixed seed for reproducible results
})

const result1 = watermark.addWatermarkRandom(text, message)
const result2 = watermark.addWatermarkRandom(text, message)
// result1 === result2 (same positions every time)
```

### Error Handling

```javascript
try {
  const extracted = watermark.extractAsString(suspiciousText)
  console.log('Watermark found:', extracted)
} catch (error) {
  if (error.message.includes('No watermark found')) {
    console.log('Text is clean')
  } else {
    console.error('Extraction failed:', error.message)
  }
}
```

## 🔒 Security Considerations

1. **Password Strength**: Use strong, unique passwords for each application
2. **Password Storage**: Never hardcode passwords in client-side code
3. **Watermark Size**: Longer watermarks require longer original text
4. **Platform Testing**: Test on target platforms (WeChat, email clients, etc.)
5. **Image Quality**: LSB steganography may be detectable with statistical analysis
6. **Data Integrity**: Always enable checksum for critical hidden data
7. **Encryption**: Use password protection for sensitive information

## 🧪 Testing

The library includes comprehensive tests covering:

- Basic watermark embedding and extraction
- Unicode and emoji support
- Password-based security
- Error handling
- Python library compatibility
- Image steganography functionality
- LSB encoding/decoding accuracy
- Data integrity verification
- Encryption and decryption

```bash
npm test
npm run test:coverage
```

## 📊 Compatibility

### Platforms Tested
- ✅ Web browsers (Chrome, Firefox, Safari, Edge)
- ✅ Node.js (14+)
- ✅ WeChat Mini Programs
- ✅ DingTalk
- ✅ Email clients
- ✅ Social media platforms

### Text Formats
- ✅ Plain text
- ✅ Unicode characters
- ✅ Emojis
- ✅ Mixed languages (English, Chinese, Arabic, etc.)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Python implementation: [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) by [guofei9987](https://github.com/guofei9987)
- Inspired by research in text steganography and zero-width character techniques

## 📚 Related Projects

- [text_blind_watermark](https://github.com/guofei9987/text_blind_watermark) - Original Python implementation
- [blind_watermark](https://github.com/guofei9987/blind_watermark) - Image watermarking library
- [HideInfo](https://github.com/guofei9987/HideInfo) - Information hiding toolkit

## 🔗 Links

- [npm package](https://www.npmjs.com/package/text-blind-watermark-js)
- [GitHub repository](https://github.com/yourusername/text-blind-watermark-js)
- [Documentation](https://github.com/yourusername/text-blind-watermark-js#readme)
- [Issues](https://github.com/yourusername/text-blind-watermark-js/issues)