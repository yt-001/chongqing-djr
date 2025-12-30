SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS guide_route_points;
DROP TABLE IF EXISTS guide_routes;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE guide_routes
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL COMMENT '路线名称，例如：江北嘴一日游',
    description     TEXT NULL COMMENT '路线描述、游玩说明',
    total_distance  DECIMAL(10, 2) NULL COMMENT '预估总距离(公里)',
    total_duration  INT NULL COMMENT '预估总时长(分钟)',
    status          TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    edit_status     TINYINT NOT NULL DEFAULT 0 COMMENT '编辑状态：0-草稿(暂存)，1-已发布',
    create_time     DATETIME DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time     DATETIME DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
)
COMMENT '旅游向导地图路线表' COLLATE = utf8mb4_unicode_ci;

CREATE TABLE guide_route_points
(
    id           INT AUTO_INCREMENT PRIMARY KEY,
    route_id     INT NOT NULL COMMENT '所属路线ID',
    step_order   INT NOT NULL COMMENT '在路线中的顺序(从1开始递增)',
    name         VARCHAR(100) NOT NULL COMMENT '地点名称，例如：江北嘴大剧院',
    address      VARCHAR(255) NULL COMMENT '地点地址',
    latitude     DECIMAL(10, 6) NOT NULL COMMENT '纬度',
    longitude    DECIMAL(10, 6) NOT NULL COMMENT '经度',
    stay_minutes INT NULL COMMENT '建议停留时长(分钟)',
    remark       TEXT NULL COMMENT '备注说明，例如：拍照点、适合傍晚到达等',
    create_time  DATETIME DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time  DATETIME DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT uk_guide_route_points_route_order UNIQUE (route_id, step_order)
)
COMMENT '旅游向导地图路线节点表' COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_guide_route_points_route ON guide_route_points (route_id);
CREATE INDEX idx_guide_route_points_route_order ON guide_route_points (route_id, step_order);

INSERT INTO guide_routes (id, name, description, total_distance, total_duration, status, edit_status, create_time, update_time) VALUES
(1, '江北嘴滨江夜景步行路线', '沿江北嘴滨江步道欣赏两江夜景，适合傍晚散步拍照', 3.50, 120, 1, 1, NOW(), NOW()),
(2, '解放碑-洪崖洞经典夜游路线', '从解放碑步行前往洪崖洞，体验重庆夜景与美食', 4.20, 180, 1, 1, NOW(), NOW()),
(3, '大学城文旅半日游路线', '围绕大学城周边文旅资源设计的半日游路线', 5.80, 240, 0, 0, NOW(), NOW());

INSERT INTO guide_route_points (route_id, step_order, name, address, latitude, longitude, stay_minutes, remark, create_time, update_time) VALUES
(1, 1, '江北嘴地铁站', '重庆市江北区江北嘴', 29.571200, 106.530800, 10, '集合点，统一出发', NOW(), NOW()),
(1, 2, '江北嘴中央商务区观景台', '江北嘴CBD观景平台', 29.573500, 106.533200, 30, '俯瞰两江交汇夜景', NOW(), NOW()),
(1, 3, '大剧院广场', '重庆大剧院前广场', 29.575800, 106.538000, 20, '适合拍摄剧院与江景', NOW(), NOW()),
(1, 4, '滨江步道打卡点', '江北嘴滨江路', 29.577300, 106.541500, 30, '沿江步行拍照，建议慢行', NOW(), NOW()),
(1, 5, '江北嘴轻轨站', '轨道交通六号线江北城站', 29.579000, 106.544000, 10, '行程结束，可乘车返回', NOW(), NOW()),

(2, 1, '解放碑步行街入口', '渝中区解放碑八一路', 29.556900, 106.574400, 20, '集合与自由活动区域', NOW(), NOW()),
(2, 2, '解放碑人民解放纪念碑', '解放碑商圈中心', 29.557500, 106.575200, 15, '地标性打卡点', NOW(), NOW()),
(2, 3, '八一路好吃街', '解放碑八一路好吃街', 29.557900, 106.576300, 40, '品尝重庆特色小吃', NOW(), NOW()),
(2, 4, '洪崖洞观景平台', '渝中区嘉滨路洪崖洞', 29.564700, 106.582300, 45, '观看洪崖洞夜景，拍照打卡', NOW(), NOW()),
(2, 5, '千厮门大桥步行段', '千厮门大桥观景步道', 29.565800, 106.583800, 30, '俯瞰两江与城市夜景', NOW(), NOW()),

(3, 1, '大学城地铁站', '沙坪坝区大学城', 29.607000, 106.303000, 10, '集合点', NOW(), NOW()),
(3, 2, '四川美术学院大学城校区', '大学城四川美术学院', 29.606200, 106.304800, 60, '打卡艺术校园与雕塑', NOW(), NOW()),
(3, 3, '重庆大学虎溪校区', '大学城重庆大学虎溪校区', 29.605000, 106.310500, 60, '校园漫步，感受书香氛围', NOW(), NOW()),
(3, 4, '大学城印象商业街', '大学城熙街/印象城附近', 29.608300, 106.312800, 60, '用餐与休闲购物', NOW(), NOW()),
(3, 5, '大学城湿地公园', '大学城湿地公园', 29.610500, 106.318000, 50, '绿道散步，结束行程', NOW(), NOW());
