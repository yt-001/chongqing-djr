/**
 * 图片数据处理工具类
 */

/**
 * 处理后端返回的图片数据，转换为前端可用的格式
 * @param {Object} imageData - 后端返回的图片数据
 * @param {string} imageData.coverImage - 封面图片文件名或路径
 * @param {string} imageData.images - 图片数组JSON字符串
 * @returns {{coverUrl:string,imageUrls:string[]}} 处理后的图片数据
 */
export function processImageData(imageData) {
  const result = {
    coverUrl: '',
    imageUrls: []
  }

  const toStringUrl = (value) => {
    const raw = String(value ?? '').trim()
    if (!raw) return ''
    // 兼容处理：去除后端可能返回的绝对路径前缀（如 F:/djr-img/）
    // 以及去除可能已存在的 /public/images/ 或 /images/ 前缀
    const fileName = raw.replace(/^.*[\\\/]djr-img[\\\/]/i, '')
                        .replace(/^\/(public\/)?images\//, '')
    // 统一加上 /images/ 前缀，这会通过 Vite 代理重写为后端的 /public/images/
    return `/images/${fileName}`
  }

  if (imageData.coverImage) {
    result.coverUrl = toStringUrl(imageData.coverImage)
  }

  if (imageData.images) {
    try {
      const imageArray = Array.isArray(imageData.images) ? imageData.images : JSON.parse(imageData.images)
      if (Array.isArray(imageArray)) {
        result.imageUrls = imageArray
          .filter(Boolean)
          .map((img) => {
            return toStringUrl(img)
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
 * @returns {{coverImage:string,images:string}} 格式化后的数据
 */
export function formatImageDataForSubmit(uploadedUrls) {
  if (!Array.isArray(uploadedUrls) || uploadedUrls.length === 0) {
    return {
      coverImage: '',
      images: '[]'
    }
  }
  const coverImage = uploadedUrls[0]
  const otherImages = uploadedUrls.slice(1)
  return {
    coverImage: coverImage,
    images: JSON.stringify(otherImages)
  }
}
