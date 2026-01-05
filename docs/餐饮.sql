-- 可选：方便先删再建
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS restaurant_dishes;
DROP TABLE IF EXISTS restaurants;
DROP TABLE IF EXISTS dish_categories;
DROP TABLE IF EXISTS restaurant_categories;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. 重建美食店铺表（与原表结构一致）
CREATE TABLE restaurants
(
    id            INT AUTO_INCREMENT
        PRIMARY KEY,
    category_id   INT                                NULL COMMENT '餐厅分类ID，对应 restaurant_categories.id',
    name          VARCHAR(100)                       NOT NULL COMMENT '餐厅/美食名称',
    description   TEXT                               NULL COMMENT '描述',
    location      VARCHAR(255)                       NULL COMMENT '地理位置',
    latitude      DECIMAL(10, 8)                     NULL COMMENT '纬度',
    longitude     DECIMAL(11, 8)                     NULL COMMENT '经度',
    cover_image   VARCHAR(255)                       NULL COMMENT '封面图片',
    images        TEXT                               NULL COMMENT '图片JSON数组',
    open_hours    VARCHAR(100)                       NULL COMMENT '营业时间',
    price_range   VARCHAR(50)                        NULL COMMENT '价格区间(如:￥50-100)',
    specialty     VARCHAR(100)                       NULL COMMENT '招牌菜',
    contact_phone VARCHAR(20)                        NULL COMMENT '联系电话',
    create_time   DATETIME DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time   DATETIME DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    rating        DECIMAL(2, 1)                      NULL COMMENT '推荐指数(0-5)'
)
    COMMENT '美食店铺表'
    COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_restaurants_location
    ON restaurants (location);

CREATE INDEX idx_restaurants_category
    ON restaurants (category_id);

CREATE INDEX idx_restaurants_rating
    ON restaurants (rating);

-- 2. 新增：餐厅分类表
CREATE TABLE restaurant_categories
(
    id          INT AUTO_INCREMENT
        PRIMARY KEY,
    name        VARCHAR(50)                         NOT NULL COMMENT '分类名称',
    sort_order  INT          DEFAULT 0              NOT NULL COMMENT '排序',
    is_enabled  TINYINT(1)   DEFAULT 1              NOT NULL COMMENT '是否启用：1-启用，0-禁用',
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '餐厅分类表'
    COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_restaurant_categories_name
    ON restaurant_categories (name);

-- 3. 新增：菜品分类表
CREATE TABLE dish_categories
(
    id          INT AUTO_INCREMENT
        PRIMARY KEY,
    name        VARCHAR(50)                         NOT NULL COMMENT '分类名称',
    sort_order  INT          DEFAULT 0              NOT NULL COMMENT '排序',
    is_enabled  TINYINT(1)   DEFAULT 1              NOT NULL COMMENT '是否启用：1-启用，0-禁用',
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '菜品分类表'
    COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_dish_categories_name
    ON dish_categories (name);

-- 4. 新增：餐厅菜品表（无外键约束，只用 restaurant_id 关联）
CREATE TABLE restaurant_dishes
(
    id             INT AUTO_INCREMENT
        PRIMARY KEY,
    restaurant_id  INT                                 NOT NULL COMMENT '所属餐厅ID，对应 restaurants.id',
    category_id    INT                                 NULL COMMENT '菜品分类ID，对应 dish_categories.id',
    name           VARCHAR(100)                        NOT NULL COMMENT '菜品名称',
    description    VARCHAR(255)                        NULL COMMENT '菜品描述',
    price          DECIMAL(10, 2)                      NULL COMMENT '价格',
    image_url      VARCHAR(255)                        NULL COMMENT '菜品图片',
    is_recommended TINYINT(1)  DEFAULT 0               NOT NULL COMMENT '是否推荐菜：1-是，0-否',
    sort_order     INT          DEFAULT 0               NOT NULL COMMENT '展示顺序（同一店铺内）',
    create_time    DATETIME     DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time    DATETIME     DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '餐厅菜品表'
    COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_restaurant_dishes_restaurant
    ON restaurant_dishes (restaurant_id);

CREATE INDEX idx_restaurant_dishes_category
    ON restaurant_dishes (category_id);

CREATE INDEX idx_restaurant_dishes_name
    ON restaurant_dishes (name);

----------------------------------------------------------------------
-- 5. 初始化示例数据：餐厅分类、菜品分类
----------------------------------------------------------------------

INSERT INTO restaurant_categories (id, name, sort_order, is_enabled)
VALUES (1, '小吃店', 1, 1),
       (2, '私房菜', 2, 1),
       (3, '古镇餐厅', 3, 1),
       (4, '咖啡甜点', 4, 1),
       (5, '农家菜', 5, 1),
       (6, '温泉餐厅', 6, 1);

ALTER TABLE restaurant_categories AUTO_INCREMENT = 7;

INSERT INTO dish_categories (id, name, sort_order, is_enabled)
VALUES (1, '招牌', 1, 1),
       (2, '热菜', 2, 1),
       (3, '汤类', 3, 1),
       (4, '主食', 4, 1),
       (5, '甜品', 5, 1),
       (6, '凉菜', 6, 1),
       (7, '饮品', 7, 1),
       (8, '轻食', 8, 1);

ALTER TABLE dish_categories AUTO_INCREMENT = 9;

----------------------------------------------------------------------
-- 6. 初始化示例数据：美食店铺（8 家，与截图对应）
----------------------------------------------------------------------

INSERT INTO restaurants
(id, category_id, name, description, location, latitude, longitude, cover_image, images,
 open_hours, price_range, specialty, contact_phone, create_time, update_time, rating)
VALUES
    (1, 1, '梁平张鸭子总店', '地方名小吃，卤味香浓', '梁平区人民路',
     30.67250000, 107.79330000,
     'https://example.com/images/restaurant1.jpg', NULL,
     '10:00-22:00', '￥50-80', '张鸭子', '023-00000001', NOW(), NOW(), 4.5),

    (2, 1, '双桂油渣家', '油渣料理与家常菜', '梁平区双桂湖景区',
     30.67680000, 107.80250000,
     'https://example.com/images/restaurant2.jpg', NULL,
     '10:00-21:30', '￥40-70', '油渣', '023-00000002', NOW(), NOW(), 4.3),

    (3, 3, '明达古镇客栈餐厅', '古镇风味菜，环境古色古香', '梁平区明达古镇',
     30.69190000, 107.78020000,
     'https://example.com/images/restaurant3.jpg', NULL,
     '09:30-21:00', '￥60-100', '古镇风味拼盘', '023-00000003', NOW(), NOW(), 4.4),

    (4, 2, '竹尖私房菜', '竹荪与乡土菜为主打', '梁平区竹市镇',
     30.70200000, 107.82400000,
     'https://example.com/images/restaurant4.jpg', NULL,
     '11:00-22:00', '￥70-120', '竹荪土鸡汤', '023-00000004', NOW(), NOW(), 4.6),

    (5, 6, '桂湖温泉餐厅', '康养套餐与汤品', '梁平区桂湖路',
     30.67100000, 107.81580000,
     'https://example.com/images/restaurant5.jpg', NULL,
     '08:00-21:30', '￥60-150', '温泉养生套餐', '023-00000005', NOW(), NOW(), 4.2),

    (6, 4, '云逸咖啡', '轻食咖啡甜点', '梁平区云岫路',
     30.66890000, 107.79900000,
     'https://example.com/images/restaurant6.jpg', NULL,
     '10:00-23:00', '￥30-60', '手冲咖啡', '023-00000006', NOW(), NOW(), 4.7),

    (7, 5, '合兴农家院', '农家菜与土鸡', '梁平区合兴镇',
     30.65840000, 107.84100000,
     'https://example.com/images/restaurant7.jpg', NULL,
     '10:00-21:00', '￥50-90', '柴火土鸡', '023-00000007', NOW(), NOW(), 4.4),

    (8, 1, '文化街小吃集市', '地方特色小吃集合', '梁平区文化街',
     30.67550000, 107.80660000,
     'https://example.com/images/restaurant8.jpg', NULL,
     '09:00-23:00', '￥20-50', '梁平火烧、糍粑', '023-00000008', NOW(), NOW(), 4.8);

ALTER TABLE restaurants AUTO_INCREMENT = 9;

----------------------------------------------------------------------
-- 7. 初始化示例数据：每家店铺 3–5 个菜品
----------------------------------------------------------------------

INSERT INTO restaurant_dishes
(restaurant_id, category_id, name, description, price, image_url, is_recommended, sort_order)
VALUES
    -- 1. 梁平张鸭子总店
    (1, 1, '招牌张鸭子', '秘制卤味，色泽红亮，入口酥香', 68.00,
     'https://example.com/images/dishes/1_zhangyazi.jpg', 1, 1),
    (1, 3, '鸭架酸菜汤', '以张鸭子鸭架熬制的酸菜汤，酸爽开胃', 18.00,
     'https://example.com/images/dishes/1_yajia_tang.jpg', 0, 2),
    (1, 6, '凉拌鸭掌', '麻辣爽口，适合下酒小菜', 26.00,
     'https://example.com/images/dishes/1_liangban_yazhang.jpg', 0, 3),
    (1, 2, '卤味拼盘', '鸭肠、鸭翅等卤味组合', 48.00,
     'https://example.com/images/dishes/1_luwei_pinpan.jpg', 0, 4),

    -- 2. 双桂油渣家
    (2, 4, '双桂油渣炒饭', '颗粒分明，油渣香酥，双桂特色', 22.00,
     'https://example.com/images/dishes/2_youzha_chaofan.jpg', 1, 1),
    (2, 2, '油渣回锅肉', '本地猪肉配油渣，香辣下饭', 38.00,
     'https://example.com/images/dishes/2_youzha_huiguo.jpg', 0, 2),
    (2, 6, '酸辣藕丁', '爽脆藕丁配自制酸辣汁', 18.00,
     'https://example.com/images/dishes/2_suanla_ouding.jpg', 0, 3),

    -- 3. 明达古镇客栈餐厅
    (3, 1, '古镇风味拼盘', '腊肉、香肠、豆干等组合，古镇必点', 58.00,
     'https://example.com/images/dishes/3_fengwei_pinpan.jpg', 1, 1),
    (3, 2, '石锅焖排骨', '慢火焖煮，入口脱骨', 68.00,
     'https://example.com/images/dishes/3_shiguo_paigu.jpg', 0, 2),
    (3, 5, '手工糍粑', '糯米现打，外焦里糯', 26.00,
     'https://example.com/images/dishes/3_ciba.jpg', 0, 3),

    -- 4. 竹尖私房菜
    (4, 3, '竹荪土鸡汤', '以竹荪与走地鸡熬制，清淡鲜美', 78.00,
     'https://example.com/images/dishes/4_zhusun_tuji_tang.jpg', 1, 1),
    (4, 2, '笋干红烧肉', '五花肉配自晒笋干，肥而不腻', 52.00,
     'https://example.com/images/dishes/4_sungan_hongshaorou.jpg', 0, 2),
    (4, 2, '清炒竹叶菜', '本地季节性蔬菜，清爽可口', 26.00,
     'https://example.com/images/dishes/4_qingchao_zhuyecai.jpg', 0, 3),
    (4, 3, '小份竹荪拼盘', '适合两人分享的小份汤品', 38.00,
     'https://example.com/images/dishes/4_zhusun_pinpan.jpg', 0, 4),

    -- 5. 桂湖温泉餐厅
    (5, 3, '温泉养生鸡', '以温泉水慢炖，汤清味鲜', 88.00,
     'https://example.com/images/dishes/5_yangsheng_ji.jpg', 1, 1),
    (5, 4, '杂粮养生饭', '多种粗粮搭配蔬菜，健康轻食', 32.00,
     'https://example.com/images/dishes/5_zaliang_fan.jpg', 0, 2),
    (5, 3, '桂湖菌菇汤', '多种菌菇熬制的养生汤', 48.00,
     'https://example.com/images/dishes/5_jungu_tang.jpg', 0, 3),

    -- 6. 云逸咖啡
    (6, 7, '手冲单品咖啡', '精选豆子手冲，酸度层次丰富', 32.00,
     'https://example.com/images/dishes/6_handbrew_coffee.jpg', 1, 1),
    (6, 7, '云朵拿铁', '拉花拿铁，口感顺滑', 30.00,
     'https://example.com/images/dishes/6_cloud_latte.jpg', 0, 2),
    (6, 5, '焦糖布丁', '经典甜点，适合作为下午茶', 22.00,
     'https://example.com/images/dishes/6_caramel_pudding.jpg', 0, 3),
    (6, 8, '森林沙拉', '生菜搭配坚果与水果，低脂清爽', 28.00,
     'https://example.com/images/dishes/6_forest_salad.jpg', 0, 4),

    -- 7. 合兴农家院
    (7, 2, '柴火土鸡', '柴火大锅慢炖，香味浓郁', 86.00,
     'https://example.com/images/dishes/7_chaihuo_tuji.jpg', 1, 1),
    (7, 2, '腊肉炒豌豆尖', '本地腊肉配时令蔬菜', 42.00,
     'https://example.com/images/dishes/7_larou_wandoujian.jpg', 0, 2),
    (7, 2, '农家小炒肉', '家常口味，辣椒与五花肉', 36.00,
     'https://example.com/images/dishes/7_nongjia_xiaochao.jpg', 0, 3),

    -- 8. 文化街小吃集市
    (8, 1, '梁平火烧', '外酥里软，层次分明的传统小吃', 8.00,
     'https://example.com/images/dishes/8_liangping_huoshao.jpg', 1, 1),
    (8, 5, '糯米糍粑', '蘸红糖或黄豆粉，软糯香甜', 10.00,
     'https://example.com/images/dishes/8_ciba.jpg', 0, 2),
    (8, 4, '豆花米线', '微辣汤底配细米线和嫩豆花', 16.00,
     'https://example.com/images/dishes/8_douhua_mixian.jpg', 0, 3),
    (8, 5, '冰粉凉虾', '夏日消暑甜品，清凉爽口', 12.00,
     'https://example.com/images/dishes/8_bingfen_liangxia.jpg', 0, 4);

ALTER TABLE restaurant_dishes AUTO_INCREMENT = 1000;
