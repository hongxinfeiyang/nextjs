const products = [
  { name: '机械键盘 K8 Pro', slug: 'mechanical-keyboard-k8-pro', description: '87键热插拔机械键盘，Gasket结构，RGB背光，三模连接。适合程序员长时间编码使用。', price: 399, comparePrice: 599, category: '电子产品', stock: 50, featured: true, images: '[]' },
  { name: '无线降噪耳机 Pro', slug: 'wireless-anc-earbuds-pro', description: '主动降噪深度达45dB，Hi-Res认证音质，续航36小时，IPX5防水。通勤和运动的理想选择。', price: 699, comparePrice: 999, category: '电子产品', stock: 30, featured: true, images: '[]' },
  { name: '27寸 4K 显示器', slug: '27-inch-4k-monitor', description: '27英寸IPS面板，3840×2160分辨率，95%DCI-P3色域，Type-C 65W反向充电。设计师必备。', price: 2499, comparePrice: 3299, category: '电子产品', stock: 15, featured: true, images: '[]' },
  { name: 'Type-C 扩展坞', slug: 'usb-c-hub-12in1', description: '12合1多功能扩展坞，支持双4K显示器、千兆网口、SD/TF卡读取、100W PD快充。', price: 199, comparePrice: 299, category: '电子产品', stock: 100, featured: false, images: '[]' },
  { name: '轻薄笔记本电脑支架', slug: 'laptop-stand-aluminum', description: '全铝合金材质，可折叠设计，6档高度调节，兼容10-17寸笔记本，散热性能优异。', price: 129, comparePrice: null, category: '电子产品', stock: 80, featured: false, images: '[]' },
  { name: '男士纯棉休闲衬衫', slug: 'men-cotton-casual-shirt', description: '100%新疆长绒棉，修身版型，多种颜色可选。透气舒适，不易起皱，商务休闲两相宜。', price: 199, comparePrice: 399, category: '服装', stock: 200, featured: true, images: '[]' },
  { name: '女士轻薄羽绒服', slug: 'women-light-down-jacket', description: '90%白鹅绒填充，蓬松度800+，重量仅180g。防风防泼水面料，可收纳至收纳袋。', price: 599, comparePrice: 899, category: '服装', stock: 60, featured: true, images: '[]' },
  { name: '运动跑鞋 UltroBoost', slug: 'running-shoes-ultraboost', description: '全掌Boost中底，Primeknit编织鞋面，Continental橡胶外底。缓震回弹性能出色。', price: 799, comparePrice: 1099, category: '运动', stock: 45, featured: true, images: '[]' },
  { name: '瑜伽垫 TPE 6mm', slug: 'yoga-mat-tpe-6mm', description: '双面防滑纹理，TPE环保材质，6mm厚度适中。附带收纳绑带和背包，方便携带。', price: 129, comparePrice: 199, category: '运动', stock: 150, featured: false, images: '[]' },
  { name: '智能跳绳 Pro', slug: 'smart-jump-rope-pro', description: '霍尔计数传感器，蓝牙连接APP记录数据，360度防绕绳。LED显示屏，可充电设计。', price: 89, comparePrice: null, category: '运动', stock: 200, featured: false, images: '[]' },
  { name: '北欧简约台灯', slug: 'nordic-desk-lamp', description: '极简设计，36颗LED灯珠，Ra>90高显色指数，无频闪。3档色温调节，触控开关。', price: 199, comparePrice: 299, category: '家居', stock: 70, featured: true, images: '[]' },
  { name: '真空保温杯 500ml', slug: 'vacuum-thermos-500ml', description: '316不锈钢内胆，12小时保温/24小时保冷。食品级硅胶密封圈，防漏设计。', price: 99, comparePrice: 159, category: '家居', stock: 300, featured: false, images: '[]' },
  { name: '记忆棉颈椎枕', slug: 'memory-foam-pillow', description: '慢回弹记忆棉，人体工学曲线设计，透气冰丝枕套。缓解颈椎压力，改善睡眠质量。', price: 159, comparePrice: 259, category: '家居', stock: 120, featured: false, images: '[]' },
  { name: '智能扫地机器人', slug: 'robot-vacuum-cleaner', description: 'LDS激光导航，5000Pa大吸力，扫拖一体。支持APP远程控制，自动回充。', price: 1999, comparePrice: 2999, category: '家居', stock: 25, featured: true, images: '[]' },
  { name: 'TypeScript 编程指南', slug: 'typescript-programming-guide', description: '从基础到高级，全面覆盖TypeScript类型系统、泛型、装饰器等核心概念。含大量实战案例。', price: 79, comparePrice: null, category: '图书', stock: 500, featured: false, images: '[]' },
  { name: 'React 18 实战进阶', slug: 'react-18-advanced-practice', description: '深入React 18新特性：Concurrent Mode、Suspense、Server Components。适合有React基础的开发者。', price: 89, comparePrice: 119, category: '图书', stock: 400, featured: false, images: '[]' },
  { name: '系统设计面试精讲', slug: 'system-design-interview', description: '覆盖分布式系统、高可用架构、数据库设计等核心面试题。附详细图解和代码示例。', price: 69, comparePrice: null, category: '图书', stock: 350, featured: false, images: '[]' },
  { name: '算法图解（第2版）', slug: 'grokking-algorithms-2nd', description: '以图解方式讲解数据结构与算法，通俗易懂。涵盖动态规划、贪心算法、图论等内容。', price: 59, comparePrice: 79, category: '图书', stock: 600, featured: false, images: '[]' },
  { name: 'Next.js 全栈开发实战', slug: 'nextjs-fullstack-handbook', description: '从零搭建全栈应用，涵盖App Router、Server Actions、数据库集成、认证系统、部署全流程。', price: 99, comparePrice: null, category: '图书', stock: 450, featured: true, images: '[]' },
  { name: '空气炸锅 5.5L', slug: 'air-fryer-5l', description: '360°热风循环，少油健康烹饪。8大智能菜单，触控面板，不粘涂层内胆，易清洗。', price: 299, comparePrice: 499, category: '家居', stock: 90, featured: false, images: '[]' },
];

export async function seedProducts() {
  const { db } = await import('@/lib/db');

  console.log('Seeding products...');

  for (const product of products) {
    await db.product.upsert({
      where: { slug: product.slug },
      update: { ...product, published: true },
      create: { ...product, published: true },
    });
  }

  console.log(`Seeded ${products.length} products.`);
}

// Run if executed directly
seedProducts()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
