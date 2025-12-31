SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS guide_route_points;
DROP TABLE IF EXISTS guide_routes;
DROP TABLE IF EXISTS guide_route_edges;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE guide_routes
(
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL COMMENT '路线名称，例如：江北嘴一日游',
    description     TEXT NULL COMMENT '路线描述、游玩说明',
    cover_image     VARCHAR(255) NULL COMMENT '封面图片地址',
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
    canvas_x     INT NULL COMMENT '画布X坐标',
    canvas_y     INT NULL COMMENT '画布Y坐标',
    create_time  DATETIME DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time  DATETIME DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT uk_guide_route_points_route_order UNIQUE (route_id, step_order)
)
COMMENT '旅游向导地图路线节点表' COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_guide_route_points_route ON guide_route_points (route_id);
CREATE INDEX idx_guide_route_points_route_order ON guide_route_points (route_id, step_order);

CREATE TABLE guide_route_edges
(
    id               INT AUTO_INCREMENT PRIMARY KEY,
    route_id         INT NOT NULL COMMENT '所属路线ID，对应 guide_routes.id',
    source_point_id  INT NOT NULL COMMENT '起点节点ID，对应 guide_route_points.id',
    target_point_id  INT NOT NULL COMMENT '终点节点ID，对应 guide_route_points.id',
    label            VARCHAR(255) NULL COMMENT '连线备注，例如：步行7分钟、乘车2站',
    create_time      DATETIME DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    update_time      DATETIME DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT uk_guide_route_edges UNIQUE (route_id, source_point_id, target_point_id)
)
COMMENT '旅游向导地图路线连线表（点与点之间的连接）' COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_guide_route_edges_route ON guide_route_edges (route_id);
CREATE INDEX idx_guide_route_edges_points ON guide_route_edges (source_point_id, target_point_id);

INSERT INTO guide_routes (id, name, description, cover_image, total_distance, total_duration, status, edit_status, create_time, update_time) VALUES
(1, '江北嘴滨江夜景步行路线', '沿江北嘴滨江步道欣赏两江夜景，适合傍晚散步拍照', 'guide_route_jiangbeizui_night.jpg', 3.50, 120, 1, 1, NOW(), NOW()),
(2, '解放碑-洪崖洞经典夜游路线', '从解放碑步行前往洪崖洞，体验重庆夜景与美食', 'guide_route_jiefangbei_hongyadong.jpg', 4.20, 180, 1, 1, NOW(), NOW()),
(3, '大学城文旅半日游路线', '围绕大学城周边文旅资源设计的半日游路线', 'guide_route_daxuecheng_halfday.jpg', 5.80, 240, 0, 0, NOW(), NOW()),
(4, '南山一棵树夜景观赏路线', '攀登南山一棵树观景台，俯瞰渝中半岛夜景', 'guide_route_nanshan_view.jpg', 2.80, 150, 1, 1, NOW(), NOW()),
(5, '磁器口古镇慢游路线', '穿梭磁器口古镇老街，感受巴渝传统风貌', 'guide_route_ciqikou_oldtown.jpg', 4.50, 210, 1, 0, NOW(), NOW());

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
(3, 5, '大学城湿地公园', '大学城湿地公园', 29.610500, 106.318000, 50, '绿道散步，结束行程', NOW(), NOW()),

(4, 1, '南山一棵树停车场', '南岸区南山风景区入口', 29.541500, 106.594300, 15, '车辆停放与集合', NOW(), NOW()),
(4, 2, '南山登山步道入口', '南山登山步道起点', 29.542800, 106.596200, 20, '开始登山，沿步道缓慢上行', NOW(), NOW()),
(4, 3, '观景中途平台', '南山观景中途平台', 29.544100, 106.598000, 20, '可俯瞰部分江景，短暂休息', NOW(), NOW()),
(4, 4, '南山一棵树观景台', '南山一棵树观景台', 29.545600, 106.600100, 40, '主观景点，俯瞰渝中半岛夜景', NOW(), NOW()),
(4, 5, '南山美食一条街', '南山美食街', 29.547000, 106.601800, 60, '周边美食小吃，结束行程', NOW(), NOW()),

(5, 1, '磁器口地铁站', '沙坪坝区磁器口地铁站', 29.582300, 106.467800, 10, '集合点', NOW(), NOW()),
(5, 2, '磁器口古镇正门', '磁器口古镇景区入口', 29.583200, 106.468900, 20, '进入古镇主街', NOW(), NOW()),
(5, 3, '古镇主街老字号小吃区', '磁器口古镇主街', 29.584100, 106.470200, 40, '品尝传统小吃与特产', NOW(), NOW()),
(5, 4, '嘉陵江观景栈道', '磁器口古镇江边栈道', 29.585000, 106.471500, 30, '沿江散步拍照', NOW(), NOW()),
(5, 5, '古镇后街文创区', '磁器口古镇后街', 29.585800, 106.472800, 30, '文创小店与咖啡馆，结束行程', NOW(), NOW());

INSERT INTO guide_route_edges (route_id, source_point_id, target_point_id, label, create_time, update_time) VALUES
(1, 1, 2, '步行约10分钟，穿过江北嘴地铁站广场', NOW(), NOW()),
(1, 2, 3, '沿商务区步道步行约8分钟', NOW(), NOW()),
(1, 3, 4, '从大剧院广场下行至滨江步道，约12分钟', NOW(), NOW()),
(1, 4, 5, '沿江边慢行返回轻轨站，约20分钟', NOW(), NOW()),

(2, 6, 7, '解放碑步行街内部移动，约5分钟', NOW(), NOW()),
(2, 7, 8, '沿步行街前往好吃街，约10分钟', NOW(), NOW()),
(2, 8, 9, '从好吃街步行至洪崖洞观景平台，约20分钟', NOW(), NOW()),
(2, 9, 10, '步行上桥，观赏两江夜景，约15分钟', NOW(), NOW()),
(2, 7, 9, '可选择直接前往洪崖洞观景平台，约18分钟', NOW(), NOW()),

(3, 11, 12, '步行前往四川美术学院，约15分钟', NOW(), NOW()),
(3, 12, 13, '从川美前往重大虎溪校区，约20分钟', NOW(), NOW()),
(3, 13, 14, '步行或乘车前往大学城商业街，约15分钟', NOW(), NOW()),
(3, 14, 15, '从商业街前往湿地公园，约15分钟', NOW(), NOW()),

(4, 16, 17, '从停车场步行至登山步道入口，约10分钟', NOW(), NOW()),
(4, 17, 18, '沿登山步道上行至中途平台，约20分钟', NOW(), NOW()),
(4, 18, 19, '继续上行至一棵树观景台，约15分钟', NOW(), NOW()),
(4, 19, 20, '下山前往南山美食一条街，约20分钟', NOW(), NOW()),
(4, 16, 20, '可驾车直接前往美食一条街，约10分钟', NOW(), NOW()),

(5, 21, 22, '从地铁站前往古镇正门，约8分钟', NOW(), NOW()),
(5, 22, 23, '进入主街区，慢行浏览店铺，约20分钟', NOW(), NOW()),
(5, 23, 24, '从主街穿行至江边栈道，约10分钟', NOW(), NOW()),
(5, 24, 25, '沿江边返回古镇后街文创区，约15分钟', NOW(), NOW());
