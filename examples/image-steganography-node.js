/**
 * 图像隐写术 Node.js 示例
 * 
 * 演示如何在Node.js环境中使用图像隐写术功能
 * 需要安装 canvas 和 sharp 依赖包
 * 
 * 安装依赖：
 * npm install canvas sharp
 */

import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import { ImageSteganography } from '../dist/image-steganography.js';

/**
 * Node.js 图像处理器
 */
class NodeImageProcessor {
  /**
   * 从文件加载图像数据
   */
  static async loadImageFromFile(imagePath) {
    try {
      // 使用 sharp 获取图像信息
      const metadata = await sharp(imagePath).metadata();
      
      // 获取 RGBA 像素数据
      const { data, info } = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      return {
        data: new Uint8ClampedArray(data),
        width: info.width,
        height: info.height
      };
    } catch (error) {
      throw new Error(`加载图像失败: ${error.message}`);
    }
  }

  /**
   * 保存图像数据到文件
   */
  static async saveImageToFile(imageData, outputPath, format = 'png') {
    try {
      const canvas = createCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      
      // 创建 ImageData 对象
      const canvasImageData = ctx.createImageData(imageData.width, imageData.height);
      canvasImageData.data.set(imageData.data);
      
      // 将数据绘制到 canvas
      ctx.putImageData(canvasImageData, 0, 0);
      
      // 保存为文件
      const buffer = canvas.toBuffer(`image/${format}`);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`图像已保存到: ${outputPath}`);
    } catch (error) {
      throw new Error(`保存图像失败: ${error.message}`);
    }
  }
}

/**
 * 隐藏文本到图像中
 */
async function hideTextInImage(imagePath, text, outputPath, options = {}) {
  try {
    console.log('🖼️ 开始隐藏文本到图像...');
    
    // 加载图像
    console.log(`📁 加载图像: ${imagePath}`);
    const imageData = await NodeImageProcessor.loadImageFromFile(imagePath);
    
    // 创建隐写术实例
    const steganography = new ImageSteganography(options);
    
    // 显示容量信息
    const maxCapacity = steganography.getMaxCapacity(imageData);
    const textSize = new TextEncoder().encode(text).length;
    
    console.log(`📊 图像信息:`);
    console.log(`   尺寸: ${imageData.width} × ${imageData.height}`);
    console.log(`   最大容量: ${maxCapacity} 字节`);
    console.log(`   文本大小: ${textSize} 字节`);
    console.log(`   容量使用率: ${(textSize / maxCapacity * 100).toFixed(2)}%`);
    
    if (textSize > maxCapacity) {
      throw new Error(`文本太大！最大容量: ${maxCapacity} 字节，文本大小: ${textSize} 字节`);
    }
    
    // 隐藏文本
    console.log('🔒 隐藏文本中...');
    const hiddenImageData = steganography.hideData(imageData, text);
    
    // 保存结果
    await NodeImageProcessor.saveImageToFile(hiddenImageData, outputPath);
    
    console.log('✅ 文本隐藏成功！');
    return hiddenImageData;
    
  } catch (error) {
    console.error('❌ 隐藏文本失败:', error.message);
    throw error;
  }
}

/**
 * 从图像中提取文本
 */
async function extractTextFromImage(imagePath, options = {}) {
  try {
    console.log('🔍 开始从图像中提取文本...');
    
    // 加载图像
    console.log(`📁 加载图像: ${imagePath}`);
    const imageData = await NodeImageProcessor.loadImageFromFile(imagePath);
    
    // 创建隐写术实例
    const steganography = new ImageSteganography(options);
    
    // 检查是否包含隐藏数据
    const hasHidden = steganography.hasHiddenData(imageData);
    if (!hasHidden) {
      console.log('❌ 图像不包含隐藏数据');
      return null;
    }
    
    console.log('✅ 检测到隐藏数据');
    
    // 提取文本
    console.log('🔓 提取文本中...');
    const extractedText = steganography.extractData(imageData);
    
    console.log('✅ 文本提取成功！');
    console.log(`📝 提取的文本长度: ${extractedText.length} 字符`);
    
    return extractedText;
    
  } catch (error) {
    console.error('❌ 提取文本失败:', error.message);
    throw error;
  }
}

/**
 * 主函数 - 演示完整流程
 */
async function main() {
  try {
    console.log('🚀 图像隐写术 Node.js 示例\n');
    
    // 配置
    const sourceImage = './test-image.png'; // 源图像路径
    const hiddenImage = './hidden-image.png'; // 输出图像路径
    const secretText = '这是一个秘密消息！🔐 This is a secret message!';
    const password = 'mySecretPassword123';
    
    // 隐写术选项
    const options = {
      password: password,
      checksum: true
    };
    
    console.log(`🔑 使用密码: ${password}`);
    console.log(`📝 要隐藏的文本: "${secretText}"\n`);
    
    // 步骤1: 隐藏文本
    console.log('=== 步骤 1: 隐藏文本 ===');
    await hideTextInImage(sourceImage, secretText, hiddenImage, options);
    console.log();
    
    // 步骤2: 提取文本
    console.log('=== 步骤 2: 提取文本 ===');
    const extractedText = await extractTextFromImage(hiddenImage, options);
    
    if (extractedText) {
      console.log(`📄 提取的文本: "${extractedText}"`);
      
      // 验证结果
      if (extractedText === secretText) {
        console.log('🎉 验证成功！提取的文本与原文本完全一致');
      } else {
        console.log('⚠️ 验证失败！提取的文本与原文本不一致');
      }
    }
    
    console.log('\n✨ 示例完成！');
    
  } catch (error) {
    console.error('💥 示例执行失败:', error.message);
    
    // 提供帮助信息
    if (error.message.includes('no such file')) {
      console.log('\n💡 提示:');
      console.log('请确保存在测试图像文件 "test-image.png"');
      console.log('你可以使用任何 PNG、JPG 或其他格式的图像文件');
    }
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n💡 提示:');
      console.log('请先安装必要的依赖包:');
      console.log('npm install canvas sharp');
    }
  }
}

/**
 * 批量处理示例
 */
async function batchProcessExample() {
  console.log('📦 批量处理示例\n');
  
  const messages = [
    '消息1: 这是第一个秘密',
    '消息2: 这是第二个秘密',
    '消息3: 这是第三个秘密'
  ];
  
  const sourceImage = './test-image.png';
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const outputPath = `./hidden-message-${i + 1}.png`;
    
    try {
      console.log(`处理消息 ${i + 1}/${messages.length}...`);
      await hideTextInImage(sourceImage, message, outputPath, { 
        password: `password${i + 1}`,
        checksum: true 
      });
      
      // 验证
      const extracted = await extractTextFromImage(outputPath, { 
        password: `password${i + 1}`,
        checksum: true 
      });
      
      console.log(`验证结果: ${extracted === message ? '✅ 成功' : '❌ 失败'}\n`);
      
    } catch (error) {
      console.error(`处理消息 ${i + 1} 失败:`, error.message);
    }
  }
}

// 如果直接运行此文件，执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--batch')) {
    batchProcessExample();
  } else if (args.includes('--help')) {
    console.log('图像隐写术 Node.js 示例');
    console.log('');
    console.log('用法:');
    console.log('  node image-steganography-node.js          # 运行基本示例');
    console.log('  node image-steganography-node.js --batch  # 运行批量处理示例');
    console.log('  node image-steganography-node.js --help   # 显示帮助信息');
    console.log('');
    console.log('注意: 请确保安装了必要的依赖包 (canvas, sharp)');
  } else {
    main();
  }
}

// 导出函数供其他模块使用
export {
  NodeImageProcessor,
  hideTextInImage,
  extractTextFromImage
};