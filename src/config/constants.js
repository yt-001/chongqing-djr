// 应用常量配置

/**
 * 图片相关配置
 */
export const IMAGE_CONFIG = {
  // 图片根路径（后端返回的相对路径需要拼接这个前缀）
  // 选项1：HTTP访问方式（推荐用于生产环境）
  BASE_URL: 'http://localhost:9002',
  
  // 选项2：本地文件访问方式（如果图片存储在本地）
  // BASE_URL: 'file:///F:/djr-img',
  
  // 图片访问路径前缀
  PREFIX: '/images',
  
  // 本地图片存储路径（用于配置说明）
  LOCAL_STORAGE_PATH: 'F:/djr-img',
  
  /**
   * 切换图片访问模式
   * @param {'http'|'file'} mode - 访问模式
   */
  setMode(mode) {
    if (mode === 'file') {
      this.BASE_URL = 'file:///' + this.LOCAL_STORAGE_PATH.replace(/\\/g, '/')
    } else {
      this.BASE_URL = 'http://localhost:9002'
    }
  },
  
  /**
   * 获取完整的图片URL
   * @param {string} imagePath - 后端返回的图片路径（如：/images/xxx.png）
   * @returns {string} 完整的图片URL
   */
  getFullUrl(imagePath) {
    if (!imagePath) return ''
    
    // 如果已经是完整URL，直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('file:///')) {
      return imagePath
    }
    
    // 拼接基础URL和图片路径
    return this.BASE_URL + imagePath
  },
  
  /**
   * 获取图片预览URL（用于显示）
   * @param {string} imagePath - 图片路径
   * @returns {string} 预览URL
   */
  getPreviewUrl(imagePath) {
    return this.getFullUrl(imagePath)
  },
  
  /**
   * 检查当前配置模式
   * @returns {string} 当前模式：'http' 或 'file'
   */
  getCurrentMode() {
    return this.BASE_URL.startsWith('file') ? 'file' : 'http'
  }
}

/**
 * API 相关配置
 */
export const API_CONFIG = {
  // API 基础地址（空字符串表示使用同源代理）
  BASE_URL: '',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 分页默认配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
  }
}

/**
 * 文件上传配置
 */
export const UPLOAD_CONFIG = {
  // 支持的图片类型
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  
  // 最大文件大小（字节）
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // 最大文件数量
  MAX_FILE_COUNT: 10,
  
  // 文件大小限制（用于显示）
  MAX_SIZE_MB: 10
}

/**
 * 应用基础配置
 */
export const APP_CONFIG = {
  // 应用名称
  APP_NAME: '梁平文旅管理系统',
  
  // 应用版本
  VERSION: '1.0.0',
  
  // 分页配置
  PAGE_SIZE: 10,
  
  // 表单验证配置
  VALIDATION: {
    // 手机号正则
    PHONE_REGEX: /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    
    // 邮箱正则
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // 纬度范围
    LATITUDE_RANGE: { min: -90, max: 90 },
    
    // 经度范围  
    LONGITUDE_RANGE: { min: -180, max: 180 }
  }
}