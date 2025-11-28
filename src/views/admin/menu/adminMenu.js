// 管理端菜单配置（一级/二级）
// 图标名称与 @element-plus/icons-vue 保持一致，组件内通过动态 component 引用
export default [
  { label: '仪表盘', name: 'admin-dashboard', icon: 'Monitor' },
  {
    label: '景点管理', name: 'admin-attractions-root', icon: 'Location',
    children: [
      { label: '景点列表', name: 'admin-attractions' }
    ]
  },
  {
    label: '餐饮管理', name: 'admin-restaurants-root', icon: 'ForkSpoon',
    children: [
      { label: '餐饮列表', name: 'admin-restaurants' }
    ]
  },
  {
    label: '住宿管理', name: 'admin-accommodations-root', icon: 'House',
    children: [
      { label: '住宿列表', name: 'admin-accommodations' }
    ]
  },
  {
    label: '订单管理', name: 'admin-orders-root', icon: 'Document',
    children: [
      { label: '订单列表', name: 'admin-orders' }
    ]
  },
  { label: '用户管理', name: 'admin-users', icon: 'User' },
  { label: '用户端', name: 'admin-user', icon: 'Monitor' }
]
