-- 禁用外键检查以避免插入顺序问题
SET FOREIGN_KEY_CHECKS = 0;

-- =================================================================================================
-- 1. 用户数据 (Users) - 11个用户
-- 密码统一假设为 '123456' 的哈希值 (示例: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
-- =================================================================================================
TRUNCATE TABLE users;
INSERT INTO users (id, username, password_hash, email, phone, avatar_url, role, status) VALUES
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@cqwl.com', '13800138000', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 0, 1),
(2, 'traveler_01', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user01@qq.com', '13900000001', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(3, 'foodie_cq', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'foodie@163.com', '13900000002', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(4, 'photo_master', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'photo@gmail.com', '13900000003', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(5, 'backpack_xiao', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'xiao@sina.com', '13900000004', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(6, 'cq_native', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'native@cq.com', '13900000005', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(7, 'tourist_lee', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'lee@hotmail.com', '13900000006', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(8, 'river_city', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'river@yeah.net', '13900000007', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(9, 'mountain_climber', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'climber@qq.com', '13900000008', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(10, 'night_view_lover', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'night@cq.com', '13900000009', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1),
(11, 'spicy_girl', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'spicy@cq.com', '13900000010', 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', 1, 1);

-- =================================================================================================
-- 2. 景点数据 (Attractions) - 10个
-- =================================================================================================
TRUNCATE TABLE attractions;
INSERT INTO attractions (id, name, description, location, latitude, longitude, cover_image, images, open_hours, ticket_price, contact_phone) VALUES
(1, '洪崖洞民俗风貌区', '国家AAAA级旅游景区，以巴渝传统建筑吊脚楼为主体，依山就势，沿江而建。夜晚灯光亮起时，像极了《千与千寻》里的不可思议之街。', '重庆市渝中区嘉陵江滨江路88号', 29.5697, 106.5771, 'https://imgs.qunarzz.com/sight/p0/1911/1a/1a370170496f4827a3.img.jpg_224x148_633b4d9d.jpg', '["https://imgs.qunarzz.com/sight/p0/1911/1a/1a370170496f4827a3.img.jpg_224x148_633b4d9d.jpg", "https://imgs.qunarzz.com/sight/p0/1911/97/9733225048922e0ba3.img.jpg_224x148_49f22146.jpg"]', '09:00-23:00', 0.00, '023-63039999'),
(2, '磁器口古镇', '中国历史文化名街，重庆“新巴渝十二景”，巴渝民俗文化旅游圈。蕴含丰富的巴渝文化、宗教文化、沙磁文化、红岩文化和民间文化。', '重庆市沙坪坝区磁南街1号', 29.5796, 106.4517, 'https://imgs.qunarzz.com/sight/p0/1603/b2/b2c8c49e6029f23c90.img.jpg_224x148_35877d0e.jpg', '["https://imgs.qunarzz.com/sight/p0/1603/b2/b2c8c49e6029f23c90.img.jpg_224x148_35877d0e.jpg"]', '全天开放', 0.00, '023-65011111'),
(3, '长江索道', '被誉为“万里长江第一条空中走廊”和“山城空中公共汽车”。乘坐索道可飞渡大江，在空中俯瞰重庆山水地貌。', '重庆市渝中区新华路151号', 29.5568, 106.5876, 'https://imgs.qunarzz.com/sight/p0/1505/f4/f4e7f732960e7968.water.jpg_224x148_65145674.jpg', '["https://imgs.qunarzz.com/sight/p0/1505/f4/f4e7f732960e7968.water.jpg_224x148_65145674.jpg"]', '08:00-22:00', 20.00, '023-68816888'),
(4, '武隆天生三桥', '国家AAAAA级旅游景区，世界自然遗产。由天龙桥、青龙桥、黑龙桥组成，气势磅礴、恢宏，是亚洲最大的天生桥群。', '重庆市武隆区仙女山镇', 29.4299, 107.7992, 'https://imgs.qunarzz.com/sight/p0/1412/10/569452e1435522101a78432103135693.water.jpg_224x148_73f9634d.jpg', '["https://imgs.qunarzz.com/sight/p0/1412/10/569452e1435522101a78432103135693.water.jpg_224x148_73f9634d.jpg"]', '08:30-16:30', 125.00, '023-77788888'),
(5, '大足石刻', '世界文化遗产，世界八大石窟之一。是唐末、宋初时期的宗教摩崖石刻，以佛教题材为主，尤以宝顶山摩崖造像最为著名。', '重庆市大足区宝顶镇', 29.7503, 105.7927, 'https://imgs.qunarzz.com/sight/p0/1501/37/377d816832b40847.water.jpg_224x148_1120c5c0.jpg', '["https://imgs.qunarzz.com/sight/p0/1501/37/377d816832b40847.water.jpg_224x148_1120c5c0.jpg"]', '08:30-17:00', 135.00, '023-43722222'),
(6, '李子坝轻轨站', '重庆轨道交通2号线的一座车站，以“轻轨穿楼”闻名遐迩。列车直接从居民楼的肚子中穿过，是重庆魔幻地形的代表。', '重庆市渝中区李子坝正街', 29.5537, 106.5389, 'https://imgs.qunarzz.com/sight/p0/1906/26/26d284657c3b12a3a3.img.jpg_224x148_34997658.jpg', '["https://imgs.qunarzz.com/sight/p0/1906/26/26d284657c3b12a3a3.img.jpg_224x148_34997658.jpg"]', '06:30-23:30', 0.00, '023-68002222'),
(7, '解放碑步行街', '重庆的城市地标，西部第一条商业步行街。抗战胜利纪功碑暨人民解放纪念碑矗立于此，周边高楼林立，商场众多。', '重庆市渝中区民族路', 29.5572, 106.5772, 'https://imgs.qunarzz.com/sight/p0/1505/f5/f5979d6142256874.water.jpg_224x148_d7350f55.jpg', '["https://imgs.qunarzz.com/sight/p0/1505/f5/f5979d6142256874.water.jpg_224x148_d7350f55.jpg"]', '全天开放', 0.00, '023-63700000'),
(8, '南山一棵树', '重庆绝佳的夜景观看地，位于南山半山腰。可俯瞰渝中半岛全貌，将两江交汇、跨江大桥和高楼灯火尽收眼底。', '重庆市南岸区南山植物园路', 29.5555, 106.6066, 'https://imgs.qunarzz.com/sight/p0/1501/b2/b27898c9c79893d2.water.jpg_224x148_60475c7f.jpg', '["https://imgs.qunarzz.com/sight/p0/1501/b2/b27898c9c79893d2.water.jpg_224x148_60475c7f.jpg"]', '09:00-22:30', 30.00, '023-62467777'),
(9, '渣滓洞', '原为人工采煤的小煤窑，后被国民党特务机关改造成秘密监狱。是爱国主义教育基地，记录了红岩英烈的不屈斗争。', '重庆市沙坪坝区凌云路', 29.5899, 106.4355, 'https://imgs.qunarzz.com/sight/p0/1505/8c/8c48826718c55733.water.jpg_224x148_7f89e030.jpg', '["https://imgs.qunarzz.com/sight/p0/1505/8c/8c48826718c55733.water.jpg_224x148_7f89e030.jpg"]', '09:00-17:00', 0.00, '023-65314444'),
(10, '重庆动物园', '可以看到可爱的大熊猫。园内古树名木繁茂，是集科普、教育、游乐、休闲为一体的大型城市动物园。', '重庆市九龙坡区西郊路25号', 29.5088, 106.5088, 'https://imgs.qunarzz.com/sight/p0/1508/6f/1c2c69e033e726110874237352210988.water.jpg_224x148_03e14460.jpg', '["https://imgs.qunarzz.com/sight/p0/1508/6f/1c2c69e033e726110874237352210988.water.jpg_224x148_03e14460.jpg"]', '08:00-17:00', 25.00, '023-68422222');

-- =================================================================================================
-- 3. 美食数据 (Restaurants) - 10个
-- =================================================================================================
TRUNCATE TABLE restaurants;
INSERT INTO restaurants (id, name, description, location, latitude, longitude, cover_image, images, open_hours, price_range, specialty, contact_phone, rating) VALUES
(1, '佩姐老火锅(解放碑店)', '重庆必吃火锅之一，牛油味醇厚，辣而不燥。贡菜丸子和屠场鲜毛肚是必点菜品，排队王。', '渝中区民权路较场口', 29.5560, 106.5760, 'https://img.meituan.net/msmerchant/0d475526071086761300114486170475564019.jpg', '["https://img.meituan.net/msmerchant/0d475526071086761300114486170475564019.jpg"]', '10:00-02:00', '￥80-120', '鲜毛肚, 贡菜丸子', '023-63999999', 4.8),
(2, '花市豌杂面', '重庆小面50强，豌豆软糯，杂酱香浓，面条劲道。是很多重庆人早餐的首选。', '渝中区青年路77号', 29.5580, 106.5780, 'https://img.meituan.net/msmerchant/809816d4286342931964618162865036130010.jpg', '["https://img.meituan.net/msmerchant/809816d4286342931964618162865036130010.jpg"]', '07:00-20:00', '￥15-25', '豌杂面, 杂酱面', '13888888888', 4.5),
(3, '李记串串香', '正宗重庆风味，串串种类丰富，锅底香辣。牛肉串串尤其受欢迎，性价比高。', '渝中区大井巷', 29.5600, 106.5700, 'https://img.meituan.net/msmerchant/f585060417256081305543151355018893665.jpg', '["https://img.meituan.net/msmerchant/f585060417256081305543151355018893665.jpg"]', '11:00-23:00', '￥50-80', '麻辣牛肉, 香菜牛肉', '023-66666666', 4.6),
(4, '慈云寺素斋', '位于南滨路慈云寺内，环境清幽，素菜荤做，口感独特。是体验佛教文化和健康饮食的好去处。', '南岸区玄坛庙狮子山', 29.5650, 106.5900, 'https://img.meituan.net/msmerchant/36734691086672628626453868614022277362.jpg', '["https://img.meituan.net/msmerchant/36734691086672628626453868614022277362.jpg"]', '11:00-14:00', '￥40-60', '素鸭, 罗汉斋', '023-62888888', 4.3),
(5, '歌乐山辣子鸡', '发源于歌乐山三百梯，满盘红辣椒中寻找鸡丁，麻辣酥香，回味无穷。', '沙坪坝区歌乐山', 29.5850, 106.4400, 'https://img.meituan.net/msmerchant/c2f242342488331306042426264410441796462.jpg', '["https://img.meituan.net/msmerchant/c2f242342488331306042426264410441796462.jpg"]', '09:00-21:00', '￥80-100', '辣子鸡', '023-65555555', 4.7),
(6, '南山泉水鸡', '南山特色美食，用泉水烹制，鸡肉鲜嫩，味道麻辣鲜香。', '南岸区南山植物园附近', 29.5500, 106.6000, 'https://img.meituan.net/msmerchant/18636346806004262415434224411832140484.jpg', '["https://img.meituan.net/msmerchant/18636346806004262415434224411832140484.jpg"]', '10:00-22:00', '￥100-150', '泉水鸡', '023-62444444', 4.4),
(7, '陈麻花(磁器口总店)', '磁器口排队最长的店，麻花酥脆化渣，有多种口味。是重庆著名的伴手礼。', '沙坪坝区磁器口正街', 29.5790, 106.4510, 'https://img.meituan.net/msmerchant/809816d4286342931964618162865036130010.jpg', '["https://img.meituan.net/msmerchant/809816d4286342931964618162865036130010.jpg"]', '08:00-19:00', '￥20-30', '椒盐麻花, 蜂蜜麻花', '023-65433333', 4.6),
(8, '吴抄手', '中华老字号，抄手皮薄肉大，调料讲究。红油抄手麻辣鲜香，清汤抄手汤鲜味美。', '渝中区中华路', 29.5590, 106.5790, 'https://img.meituan.net/msmerchant/5525516022145531306062015011002465584.jpg', '["https://img.meituan.net/msmerchant/5525516022145531306062015011002465584.jpg"]', '08:00-21:00', '￥15-25', '红油抄手', '023-63888888', 4.2),
(9, '洞子火锅', '开在防空洞里的火锅，冬暖夏凉，环境独特。味道正宗，是体验重庆防空洞文化的绝佳方式。', '渝中区中山三路', 29.5620, 106.5500, 'https://img.meituan.net/msmerchant/0d475526071086761300114486170475564019.jpg', '["https://img.meituan.net/msmerchant/0d475526071086761300114486170475564019.jpg"]', '11:00-23:00', '￥70-100', '九宫格火锅', '023-63666666', 4.7),
(10, '烤脑花', '重庆夜市名小吃，脑花绵软入味，麻辣鲜香，毫无腥味。', '江北区观音桥好吃街', 29.5750, 106.5300, 'https://img.meituan.net/msmerchant/f585060417256081305543151355018893665.jpg', '["https://img.meituan.net/msmerchant/f585060417256081305543151355018893665.jpg"]', '17:00-02:00', '￥15-20', '锡纸烤脑花', '13666666666', 4.5);

-- =================================================================================================
-- 4. 住宿数据 (Accommodations) - 10个
-- =================================================================================================
TRUNCATE TABLE accommodations;
INSERT INTO accommodations (id, name, description, type, location, latitude, longitude, cover_image, images, price_per_night, capacity, facilities, contact_phone) VALUES
(1, '重庆解放碑威斯汀酒店', '位于解放碑中心，拥有无边泳池和绝佳的城市景观。豪华舒适，服务一流。', '酒店', '渝中区新华路222号', 29.5565, 106.5785, 'https://dimg04.c-ctrip.com/images/0202l120008f0k0k0E45D_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0202l120008f0k0k0E45D_R_600_400_R5_D.jpg"]', 1200.00, 2, '["WiFi", "泳池", "健身房", "早餐"]', '023-63806666'),
(2, '洪崖洞大酒店', '紧邻洪崖洞景区，依崖而建，具有浓郁的巴渝特色。推窗即见江景。', '酒店', '渝中区沧白路56号', 29.5690, 106.5775, 'https://dimg04.c-ctrip.com/images/20061g000001h0j0jAD8A_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/20061g000001h0j0jAD8A_R_600_400_R5_D.jpg"]', 600.00, 2, '["WiFi", "江景", "餐厅"]', '023-63992888'),
(3, '南山·鉴山民宿', '隐于南山之中，环境清幽，空气清新。是逃离城市喧嚣，享受慢生活的理想之地。', '民宿', '南岸区南山公园路', 29.5540, 106.6050, 'https://dimg04.c-ctrip.com/images/0201g120008n1l1l1C78B_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0201g120008n1l1l1C78B_R_600_400_R5_D.jpg"]', 450.00, 4, '["WiFi", "庭院", "茶室"]', '13555555555'),
(4, '重庆喜来登大酒店', '南滨路双子塔地标建筑，豪华气派，尽享一线江景和璀璨夜景。', '酒店', '南岸区南滨路78号', 29.5480, 106.5850, 'https://dimg04.c-ctrip.com/images/0203x120008h3n3n3D56C_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0203x120008h3n3n3D56C_R_600_400_R5_D.jpg"]', 900.00, 2, '["WiFi", "SPA", "行政酒廊"]', '023-62777777'),
(5, '观音桥繁花民宿', '位于繁华的观音桥商圈，装修风格清新文艺，交通便利，周边美食众多。', '民宿', '江北区观音桥步行街', 29.5740, 106.5310, 'https://dimg04.c-ctrip.com/images/0204k120008f0j0j0E23A_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0204k120008f0j0j0E23A_R_600_400_R5_D.jpg"]', 280.00, 2, '["WiFi", "投影仪", "厨房"]', '13666666666'),
(6, '瓦舍国际青年旅舍', '位于较场口，氛围极佳，聚集了来自世界各地的背包客。', '酒店', '渝中区中兴路', 29.5530, 106.5720, 'https://dimg04.c-ctrip.com/images/200u1h000001h0k0kAD8A_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/200u1h000001h0k0kAD8A_R_600_400_R5_D.jpg"]', 80.00, 1, '["WiFi", "公共区域", "酒吧"]', '023-63123456'),
(7, '北温泉度假酒店', '坐落于北碚区缙云山下，拥有优质的温泉资源和园林景观。', '酒店', '北碚区北温泉公园', 29.8300, 106.4200, 'https://dimg04.c-ctrip.com/images/0202l120008f0k0k0E45D_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0202l120008f0k0k0E45D_R_600_400_R5_D.jpg"]', 700.00, 2, '["温泉", "餐饮", "会议"]', '023-68222222'),
(8, '云端江景公寓', '高层公寓，视野开阔，直面两江交汇，看轻轨穿楼。', '民宿', '渝中区滨江路', 29.5600, 106.5800, 'https://dimg04.c-ctrip.com/images/0201g120008n1l1l1C78B_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0201g120008n1l1l1C78B_R_600_400_R5_D.jpg"]', 350.00, 3, '["WiFi", "洗衣机", "落地窗"]', '13777777777'),
(9, '重庆洲际酒店', '老牌五星级酒店，服务稳健，位于市中心，商务出行首选。', '酒店', '渝中区民族路101号', 29.5580, 106.5780, 'https://dimg04.c-ctrip.com/images/0203x120008h3n3n3D56C_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0203x120008h3n3n3D56C_R_600_400_R5_D.jpg"]', 850.00, 2, '["WiFi", "健身房", "会议室"]', '023-89066888'),
(10, '丽晶酒店', '奢华典雅，设计感强，江北嘴地标酒店，拥有顶级餐饮和住宿体验。', '酒店', '江北区金沙门路66号', 29.5760, 106.5750, 'https://dimg04.c-ctrip.com/images/0204k120008f0j0j0E23A_R_600_400_R5_D.jpg', '["https://dimg04.c-ctrip.com/images/0204k120008f0j0j0E23A_R_600_400_R5_D.jpg"]', 1500.00, 2, '["WiFi", "泳池", "江景下午茶"]', '023-89088888');

-- =================================================================================================
-- 5. 非遗数据 (Intangible Culture) - 5个
-- =================================================================================================
TRUNCATE TABLE intangible_culture;
INSERT INTO intangible_culture (id, name, description, type, inheritor, cover_image, images) VALUES
(1, '川剧', '中国汉族戏曲剧种之一，流行于四川东中部、重庆及贵州、云南部分地区。变脸是其最著名的绝技。', '传统戏剧', '沈铁梅', 'https://img1.qunarzz.com/travel/d5/1708/16/48335821818130b5.jpg_r_720x480x95_0b502950.jpg', '["https://img1.qunarzz.com/travel/d5/1708/16/48335821818130b5.jpg_r_720x480x95_0b502950.jpg"]'),
(2, '蜀绣', '中国四大名绣之一，以软缎和彩丝为主要原料，针法严谨，片线光亮，针脚平齐，色彩明快。', '传统美术', '康宁', 'https://img1.qunarzz.com/travel/d1/1708/16/22214151412510b5.jpg_r_720x480x95_5b821212.jpg', '["https://img1.qunarzz.com/travel/d1/1708/16/22214151412510b5.jpg_r_720x480x95_5b821212.jpg"]'),
(3, '荣昌折扇', '制作工艺精湛，扇面素洁高雅，扇骨轻盈灵巧。既是实用品，又是艺术鉴赏品。', '传统技艺', '陈子福', 'https://img1.qunarzz.com/travel/d5/1708/16/48335821818130b5.jpg_r_720x480x95_0b502950.jpg', '["https://img1.qunarzz.com/travel/d5/1708/16/48335821818130b5.jpg_r_720x480x95_0b502950.jpg"]'),
(4, '梁平木版年画', '属于民间美术范畴，具有浓厚的乡土气息和地方特色。色彩艳丽，造型夸张。', '传统美术', '徐家辉', 'https://img1.qunarzz.com/travel/d1/1708/16/22214151412510b5.jpg_r_720x480x95_5b821212.jpg', '["https://img1.qunarzz.com/travel/d1/1708/16/22214151412510b5.jpg_r_720x480x95_5b821212.jpg"]'),
(5, '重庆火锅底料制作技艺', '重庆火锅的灵魂，选料讲究，炒制工艺独特，形成了麻、辣、鲜、香的独特风味。', '传统技艺', '集体传承', 'https://img.meituan.net/msmerchant/0d475526071086761300114486170475564019.jpg', '["https://img.meituan.net/msmerchant/0d475526071086761300114486170475564019.jpg"]');

-- =================================================================================================
-- 6. 评论数据 (Comments) - 约20条示例
-- =================================================================================================
TRUNCATE TABLE comments;
INSERT INTO comments (user_id, attraction_id, restaurant_id, culture_id, accommodation_id, content, rating, is_approved, create_time) VALUES
(2, 1, NULL, NULL, NULL, '洪崖洞夜景真的太美了，仿佛穿越到了二次元！', 5, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 1, NULL, NULL, NULL, '人太多了，挤得不行，但是景色确实值得一看。', 4, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, NULL, 1, NULL, NULL, '佩姐火锅名不虚传，辣得过瘾，毛肚很脆！', 5, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, NULL, 1, NULL, NULL, '排队排了两个小时，味道还可以，但没有想象中那么惊艳。', 4, 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(6, NULL, NULL, NULL, 1, '威斯汀的服务很好，房间视野开阔，早餐也很丰富。', 5, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 2, NULL, NULL, NULL, '磁器口商业化有点重，不过陈麻花还是很好吃的。', 3, 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(7, 3, NULL, NULL, NULL, '长江索道很有特色，在空中看长江感觉很震撼。', 5, 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(8, 4, NULL, NULL, NULL, '武隆天坑太壮观了，大自然的鬼斧神工。', 5, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(9, NULL, 2, NULL, NULL, '豌杂面味道很正宗，豌豆软烂，杂酱香浓。', 5, 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(10, NULL, NULL, 1, NULL, '川剧变脸太神奇了，演员功夫了得。', 5, 1, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(2, NULL, NULL, NULL, 3, '南山民宿环境很好，很安静，适合周末放松。', 4, 1, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 5, NULL, NULL, NULL, '大足石刻非常精美，古代工匠的技艺令人叹为观止。', 5, 1, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(4, 6, NULL, NULL, NULL, '李子坝轻轨穿楼很有趣，打卡必去。', 4, 1, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
(5, NULL, 5, NULL, NULL, '辣子鸡辣椒比鸡多，但是味道真香，越吃越想吃。', 5, 1, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(6, NULL, NULL, 2, NULL, '蜀绣很精致，买了一幅做纪念。', 5, 1, DATE_SUB(NOW(), INTERVAL 9 HOUR)),
(7, NULL, NULL, NULL, 4, '喜来登位置很好，晚上看夜景很方便。', 5, 1, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(8, 8, NULL, NULL, NULL, '南山一棵树看夜景无敌，就是山上有点冷。', 4, 1, DATE_SUB(NOW(), INTERVAL 11 HOUR)),
(9, 10, NULL, NULL, NULL, '熊猫很可爱，动物园很大，逛了一下午。', 5, 1, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(10, NULL, 7, NULL, NULL, '陈麻花买了好多送朋友，大家都说好吃。', 5, 1, DATE_SUB(NOW(), INTERVAL 13 HOUR)),
(11, NULL, NULL, NULL, 8, '云端公寓视野太棒了，躺在床上看江景。', 5, 1, DATE_SUB(NOW(), INTERVAL 14 HOUR));

-- =================================================================================================
-- 7. 收藏数据 (Favorites) - 约15条示例
-- =================================================================================================
TRUNCATE TABLE favorites;
INSERT INTO favorites (user_id, attraction_id, restaurant_id, culture_id, accommodation_id, create_time) VALUES
(2, 1, NULL, NULL, NULL, NOW()),
(2, 3, NULL, NULL, NULL, NOW()),
(2, NULL, 1, NULL, NULL, NOW()),
(3, NULL, NULL, NULL, 1, NOW()),
(3, 2, NULL, NULL, NULL, NOW()),
(4, 4, NULL, NULL, NULL, NOW()),
(4, NULL, 2, NULL, NULL, NOW()),
(5, NULL, NULL, 1, NULL, NOW()),
(5, 5, NULL, NULL, NULL, NOW()),
(6, 6, NULL, NULL, NULL, NOW()),
(6, NULL, 5, NULL, NULL, NOW()),
(7, NULL, NULL, NULL, 3, NOW()),
(8, 8, NULL, NULL, NULL, NOW()),
(9, 10, NULL, NULL, NULL, NOW()),
(10, NULL, 7, NULL, NULL, NOW());

-- =================================================================================================
-- 8. 订单数据 (Orders) - 约10条示例
-- product_type: 1-景点门票, 2-美食消费券, 3-住宿消费券
-- =================================================================================================
TRUNCATE TABLE orders;
INSERT INTO orders (order_no, user_id, product_type, product_id, product_name, description, quantity, unit_price, total_amount, status, create_time) VALUES
('ORD20231101001', 2, 1, 3, '长江索道', '单程票', 2, 20.00, 40.00, 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
('ORD20231101002', 2, 2, 1, '佩姐老火锅', '100元代金券', 1, 95.00, 95.00, 2, DATE_SUB(NOW(), INTERVAL 9 DAY)),
('ORD20231101003', 3, 3, 1, '重庆解放碑威斯汀酒店', '豪华江景房1晚', 1, 1200.00, 1200.00, 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
('ORD20231101004', 4, 1, 4, '武隆天生三桥', '成人票', 1, 125.00, 125.00, 2, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('ORD20231101005', 5, 1, 5, '大足石刻', '通票', 1, 135.00, 135.00, 0, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('ORD20231101006', 6, 2, 5, '歌乐山辣子鸡', '双人套餐', 1, 168.00, 168.00, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('ORD20231101007', 7, 3, 3, '南山·鉴山民宿', '大床房1晚', 1, 450.00, 450.00, 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('ORD20231101008', 8, 1, 8, '南山一棵树', '观景台门票', 2, 30.00, 60.00, 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('ORD20231101009', 9, 1, 10, '重庆动物园', '成人票', 3, 25.00, 75.00, 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ORD20231101010', 10, 2, 7, '陈麻花', '伴手礼盒', 5, 25.00, 125.00, 1, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;
