/**
 * 动态加载高德地图 JS API
 * @param {string} key 高德地图 Key
 * @param {string} securityJsCode 安全密钥（可选，JSAPI v2.0 必须）
 * @returns {Promise}
 */
export function loadAMap(key, securityJsCode = '') {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap)
      return
    }

    // 设置安全密钥
    if (securityJsCode) {
      window._AMapSecurityConfig = {
        securityJsCode: securityJsCode,
      }
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Driving,AMap.Geolocation,AMap.PlaceSearch,AMap.ToolBar`
    
    script.onerror = reject
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        reject(new Error('高德地图加载失败'))
      }
    }
    
    document.head.appendChild(script)
  })
}
