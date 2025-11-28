/**
 * 动态加载腾讯地图 GL JS API
 * @param {string} key 腾讯地图 Key
 * @returns {Promise}
 */
export function loadQQMap(key) {
  return new Promise((resolve, reject) => {
    if (window.TMap) {
      resolve(window.TMap)
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    // 加载 GL 版本，性能更好，功能更强
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${key}`
    
    script.onerror = reject
    script.onload = () => {
      if (window.TMap) {
        resolve(window.TMap)
      } else {
        reject(new Error('腾讯地图加载失败'))
      }
    }
    
    document.head.appendChild(script)
  })
}
