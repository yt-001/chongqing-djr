// postcss 配置：将 px 转换为 viewport 单位，适配移动端
export default {
  plugins: {
    autoprefixer: {},
    'postcss-px-to-viewport': {
      unitToConvert: 'px',
      viewportWidth: 375, // 设计稿宽度，按 iPhone 375
      unitPrecision: 5,
      propList: ['*'],
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: ['.ignore', '.hairlines', /^\.pc-/], // 桌面端选择器前缀 pc- 不转换
      minPixelValue: 1,
      mediaQuery: false,
      replace: true,
      exclude: [/node_modules/, /src\/views\/admin/], // 排除管理端/桌面端目录（根据你的实际目录调整）
      landscape: false
    }
  }
}
