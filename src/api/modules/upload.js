// 文件上传API接口
import { uploadRequest } from '../http.js'

/**
 * 上传图片文件
 * 路径：POST /files/upload-images
 * 说明：支持多文件上传，返回文件访问URL列表
 * @param {FormData} formData - 包含images字段的FormData对象
 * @returns {Promise<string[]>} 上传成功的文件URL列表
 */
export function uploadImages(formData) {
  return uploadRequest('/files/upload-images', {
    method: 'POST',
    body: formData
  })
}

/**
 * 创建图片上传的FormData
 * @param {File[]} files - 要上传的文件数组
 * @returns {FormData} 包含images字段的FormData对象
 */
export function createImagesFormData(files) {
  const formData = new FormData()
  
  // 添加所有文件到FormData中，使用images作为字段名
  files.forEach((file, index) => {
    formData.append('images', file)
  })
  
  return formData
}

/**
 * 上传单个图片文件
 * @param {File} file - 要上传的文件
 * @returns {Promise<string[]>} 上传成功的文件URL列表
 */
export function uploadSingleImage(file) {
  const formData = createImagesFormData([file])
  return uploadImages(formData)
}

/**
 * 上传多个图片文件
 * @param {File[]} files - 要上传的文件数组
 * @returns {Promise<string[]>} 上传成功的文件URL列表
 */
export function uploadMultipleImages(files) {
  const formData = createImagesFormData(files)
  return uploadImages(formData)
}