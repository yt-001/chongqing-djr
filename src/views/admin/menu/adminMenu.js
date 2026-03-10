// 管理端菜单配置（一级/二级）
// 图标名称与 @element-plus/icons-vue 保持一致，组件内通过动态 component 引用
export default [
  {
    label: '景点管理', name: 'admin-attractions-root', icon: 'Location',
    children: [
      { label: '景点列表', name: 'admin-attractions' },
      { label: '热门景点', name: 'admin-popular-attractions' },
      { label: '向导图制作', name: 'admin-guide-map' },
      { label: '向导图库', name: 'admin-guide-map-gallery' }
    ]
  },
  {
    label: '餐饮管理', name: 'admin-restaurants-root', icon: 'ForkSpoon',
    children: [
      { label: '餐饮列表', name: 'admin-restaurants' },
      { label: '菜品管理', name: 'admin-restaurant-dishes' },
      { label: '分类管理', name: 'admin-restaurant-categories' }
    ]
  },
  {
    label: '住宿管理', name: 'admin-accommodations-root', icon: 'House',
    children: [
      { label: '住宿列表', name: 'admin-accommodations' },
      { label: '住宿类型', name: 'admin-accommodation-types' },
      { label: '住宿设施', name: 'admin-accommodation-facilities' }
    ]
  },
  {
    label: '订单管理', name: 'admin-orders-root', icon: 'Document',
    children: [
      { label: '订单列表', name: 'admin-orders' }
    ]
  },
  {
    label: '评论管理', name: 'admin-comments-root', icon: 'ChatLineRound',
    children: [
      { label: '景点评论管理', name: 'admin-attraction-comments' },
      { label: '餐饮评论管理', name: 'admin-restaurant-comments' },
      { label: '住宿评论管理', name: 'admin-accommodation-comments' }
    ]
  },
  {
    label: 'AI管理', name: 'admin-ai-root', icon: 'ChatLineRound',
    children: [
      { label: '问候语管理', name: 'admin-ai-greetings' },
      { label: '推荐问题管理', name: 'admin-ai-prompts' }
    ]
  },
  { label: '用户管理', name: 'admin-users', icon: 'User' },
  { label: '用户端', name: 'admin-user', icon: 'Monitor' }
]
