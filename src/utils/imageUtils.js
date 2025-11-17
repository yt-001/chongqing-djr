/**
 * 图片数据处理工具类
 */

/**
 * 处理后端返回的图片数据，转换为前端可用的格式
 * @param {Object} imageData - 后端返回的图片数据
 * @param {string} imageData.coverImage - 封面图片文件名
 * @param {string} imageData.images - 图片数组JSON字符串
 * @returns {Object} 处理后的图片数据
 */
export function processImageData(imageData) {
  const result = {
    coverUrl: '',
    imageUrls: []
  }
  
  // 处理封面图片 - 直接使用前端 images 文件夹
  if (imageData.coverImage) {
    // 移除可能的前缀（如 /images/），只保留文件名
    const coverFileName = imageData.coverImage.replace(/^\/images\//, '')
    result.coverUrl = `/images/${coverFileName}`
  }
  
  // 处理图片数组
  if (imageData.images) {
    try {
      // 解析JSON数组
      const imageArray = JSON.parse(imageData.images)
      if (Array.isArray(imageArray)) {
        result.imageUrls = imageArray
          .filter(img => img) // 过滤空值
          .map(img => {
            // 移除可能的前缀，只保留文件名
            const fileName = img.replace(/^\/images\//, '')
            return `/images/${fileName}`
          })
      }
    } catch (error) {
      console.error('解析图片数组失败:', error)
    }
  }
  
  return result
}

/**
 * 格式化图片数据用于提交给后端
 * @param {Array} uploadedUrls - 上传后返回的URL数组
 * @returns {Object} 格式化后的数据
 */
export function formatImageDataForSubmit(uploadedUrls) {
  if (!Array.isArray(uploadedUrls) || uploadedUrls.length === 0) {
    return {
      coverImage: '',
      images: '[]'
    }
  }
  
  // 第一个作为封面，其余作为图片集
  const coverImage = uploadedUrls[0]
  const otherImages = uploadedUrls.slice(1)
  
  return {
    coverImage: coverImage,
    images: JSON.stringify(otherImages)
  }
}