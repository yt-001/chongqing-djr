SET NAMES utf8mb4;
SET time_zone = '+08:00';

START TRANSACTION;

DELETE FROM comments;
DELETE FROM favorites;
DELETE FROM orders;
DELETE FROM intangible_culture;
DELETE FROM accommodations;
DELETE FROM attractions;
DELETE FROM restaurants;
DELETE FROM users;

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 30
)
INSERT INTO attractions (name, description, location, latitude, longitude, cover_image, images, open_hours, ticket_price, contact_phone, create_time, update_time)
SELECT 
  ELT(MOD(n,12)+1,
    '洪崖洞', '磁器口古镇', '长江索道', '解放碑步行街', '南山一棵树', '白公馆', '鹅岭二厂', '山城巷', '园博园', '重庆动物园', '涂山寺', '重庆科技馆'
  ),
  CONCAT('重庆热门景点，第', n, '号样例，适合家庭与好友出游'),
  CONCAT('重庆市', ELT(MOD(n,6)+1, '渝中区','江北区','南岸区','沙坪坝区','渝北区','九龙坡区')),
  ROUND(29.400 + (MOD(n*7, 300))/1000, 6),
  ROUND(106.300 + (MOD(n*11, 300))/1000, 6),
  CONCAT('attraction_', LPAD(n,2,'0'), '.png'),
  CONCAT('["attraction_', LPAD(n,2,'0'), '_1.png","attraction_', LPAD(n,2,'0'), '_2.png"]'),
  ELT(MOD(n,3)+1, '09:00-22:00','全天','10:00-18:00'),
  ROUND(30 + MOD(n*13, 120), 2),
  CONCAT('023-', LPAD(MOD(n*97, 9999), 4, '0')),
  NOW(), NOW();

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 20
)
INSERT INTO restaurants (name, description, location, latitude, longitude, cover_image, images, open_hours, price_range, specialty, contact_phone, create_time, update_time, rating)
SELECT 
  ELT(MOD(n,10)+1,
    '洞子火锅','刘一手火锅','小天鹅火锅','袁记串串','冒椒火辣','三两小面','花市豌杂面','江湖菜馆','老灶火锅','解放碑砂锅饭'
  ),
  CONCAT('老字号与网红餐厅混合，第', n, '号样例'),
  CONCAT('重庆市', ELT(MOD(n,6)+1, '渝中区','江北区','南岸区','沙坪坝区','渝北区','九龙坡区')),
  ROUND(29.350 + (MOD(n*9, 200))/1000, 6),
  ROUND(106.500 + (MOD(n*5, 200))/1000, 6),
  CONCAT('restaurant_', LPAD(n,2,'0'), '.png'),
  CONCAT('["restaurant_', LPAD(n,2,'0'), '_1.png","restaurant_', LPAD(n,2,'0'), '_2.png"]'),
  ELT(MOD(n,3)+1, '10:00-22:00','11:00-23:00','全天'),
  CONCAT('￥', 30 + MOD(n*7, 150), '-', 60 + MOD(n*11, 220)),
  ELT(MOD(n,8)+1, '毛肚','黄喉','鸭肠','番茄锅','麻辣锅','豌杂面','肥肠面','串串签'),
  CONCAT('023-', LPAD(MOD(n*131, 9999), 4, '0')),
  NOW(), NOW(),
  ROUND(2.5 + (MOD(n*3, 25))/10, 1);

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 15
)
INSERT INTO accommodations (name, description, type, location, latitude, longitude, cover_image, images, price_per_night, capacity, facilities, contact_phone, create_time, update_time)
SELECT 
  ELT(MOD(n,10)+1,
    '威斯汀酒店','万豪酒店','喜来登酒店','高空观景民宿','江景酒店','商务酒店','主题民宿','网红民宿','精品酒店','星空露营地'
  ),
  CONCAT('舒适住宿与特色体验，第', n, '号样例'),
  ELT(MOD(n,3)+1, '酒店','民宿','农家乐'),
  CONCAT('重庆市', ELT(MOD(n,6)+1, '渝中区','江北区','南岸区','沙坪坝区','渝北区','九龙坡区')),
  ROUND(29.300 + (MOD(n*4, 150))/1000, 6),
  ROUND(106.400 + (MOD(n*8, 150))/1000, 6),
  CONCAT('accommodation_', LPAD(n,2,'0'), '.png'),
  CONCAT('["accommodation_', LPAD(n,2,'0'), '_1.png","accommodation_', LPAD(n,2,'0'), '_2.png"]'),
  ROUND(120 + MOD(n*19, 480), 2),
  2 + MOD(n, 4),
  CONCAT('["空调","WiFi","停车位","早餐",', '"24小时前台"]'),
  CONCAT('023-', LPAD(MOD(n*173, 9999), 4, '0')),
  NOW(), NOW();

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 12
)
INSERT INTO intangible_culture (name, description, type, inheritor, cover_image, images, create_time, update_time)
SELECT 
  ELT(MOD(n,12)+1,
    '川江号子','木洞山歌','酉阳摆手舞','荣昌夏布','铜梁龙舞','合川钓鱼城传说','涪陵榨菜技艺','綦江农民版画','黔江土家织锦','巫溪民歌','万州烤鱼技艺','秀山花灯'
  ),
  CONCAT('非遗项目传承样例，第', n, '号'),
  ELT(MOD(n,4)+1, '民俗','工艺','音乐','舞蹈'),
  ELT(MOD(n,6)+1, '刘师傅','张师傅','王老师','陈老师','杨师傅','黄老师'),
  CONCAT('culture_', LPAD(n,2,'0'), '.png'),
  CONCAT('["culture_', LPAD(n,2,'0'), '_1.png","culture_', LPAD(n,2,'0'), '_2.png"]'),
  NOW(), NOW();

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 120
)
INSERT INTO users (username, password_hash, email, phone, avatar_url, status, create_time, update_time, role)
SELECT 
  CASE WHEN n=1 THEN 'admin' ELSE CONCAT('user', LPAD(n,3,'0')) END,
  CONCAT('hash_', LPAD(n,4,'0')),
  CONCAT('user', LPAD(n,3,'0'), '@example.com'),
  CONCAT('138', LPAD(MOD(n*137, 99999999), 8, '0')),
  CONCAT('avatar_', LPAD(MOD(n, 20), 2, '0'), '.png'),
  1,
  NOW(), NOW(),
  CASE WHEN n=1 THEN 0 ELSE 1 END;

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 240
)
INSERT INTO orders (order_no, user_id, product_type, product_id, product_name, description, quantity, unit_price, total_amount, status, payment_time, used_time, expire_time, create_time, update_time)
SELECT 
  CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(n,4,'0')),
  1 + MOD(n, 120),
  1 + MOD(n,3),
  CASE WHEN MOD(n,3)=0 THEN 1 + MOD(n,30) WHEN MOD(n,3)=1 THEN 1 + MOD(n,20) ELSE 1 + MOD(n,15) END,
  CASE 
    WHEN MOD(n,3)=0 THEN (SELECT name FROM attractions WHERE id = 1 + MOD(n,30))
    WHEN MOD(n,3)=1 THEN (SELECT name FROM restaurants WHERE id = 1 + MOD(n,20))
    ELSE (SELECT name FROM accommodations WHERE id = 1 + MOD(n,15))
  END,
  ELT(MOD(n,6)+1, '成人票','夜场票','双人套餐','豪华锅底','景观房','节日券'),
  1 + MOD(n,4),
  CASE 
    WHEN MOD(n,3)=0 THEN ROUND(40 + MOD(n*7, 120), 2)
    WHEN MOD(n,3)=1 THEN ROUND(20 + MOD(n*11, 180), 2)
    ELSE ROUND(180 + MOD(n*13, 420), 2)
  END,
  (1 + MOD(n,4)) * CASE 
    WHEN MOD(n,3)=0 THEN ROUND(40 + MOD(n*7, 120), 2)
    WHEN MOD(n,3)=1 THEN ROUND(20 + MOD(n*11, 180), 2)
    ELSE ROUND(180 + MOD(n*13, 420), 2)
  END,
  MOD(n,5),
  CASE WHEN MOD(n,5) IN (1,2,4) THEN DATE_SUB(NOW(), INTERVAL MOD(n, 15) DAY) END,
  CASE WHEN MOD(n,5)=2 THEN DATE_SUB(NOW(), INTERVAL MOD(n, 10) DAY) END,
  DATE_ADD(NOW(), INTERVAL (10 - MOD(n, 10)) DAY),
  NOW(), NOW();

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 300
)
INSERT INTO comments (user_id, attraction_id, restaurant_id, culture_id, accommodation_id, content, rating, is_approved, create_time, update_time)
SELECT 
  1 + MOD(n, 120),
  CASE WHEN MOD(n,4)=0 THEN 1 + MOD(n,30) END,
  CASE WHEN MOD(n,4)=1 THEN 1 + MOD(n,20) END,
  CASE WHEN MOD(n,4)=2 THEN 1 + MOD(n,12) END,
  CASE WHEN MOD(n,4)=3 THEN 1 + MOD(n,15) END,
  ELT(MOD(n,8)+1,
    '风景很美，值得一去！','交通方便，人不多','服务很好，拍照出片','性价比高，推荐','排队稍久，但体验不错','菜品口味很赞','房间干净整洁','下次还会再来'
  ),
  1 + MOD(n*7, 5),
  MOD(n,2),
  DATE_SUB(NOW(), INTERVAL MOD(n, 60) DAY),
  NOW();

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 150
)
INSERT INTO favorites (user_id, attraction_id, restaurant_id, culture_id, accommodation_id, create_time, update_time)
SELECT 
  1 + MOD(n, 120),
  CASE WHEN MOD(n,4)=0 THEN 1 + MOD(n,30) END,
  CASE WHEN MOD(n,4)=1 THEN 1 + MOD(n,20) END,
  CASE WHEN MOD(n,4)=2 THEN 1 + MOD(n,12) END,
  CASE WHEN MOD(n,4)=3 THEN 1 + MOD(n,15) END,
  NOW(), NOW();

COMMIT;