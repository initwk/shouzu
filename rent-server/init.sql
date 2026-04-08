-- 房东收租管理系统 数据库初始化脚本
-- 使用方式：mysql -u root -p < init.sql

CREATE DATABASE IF NOT EXISTS rent_system CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE rent_system;

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  phone VARCHAR(20),
  user_level TINYINT DEFAULT 0,
  expire_time DATETIME NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 房源表
CREATE TABLE IF NOT EXISTS house_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  community_name VARCHAR(100) NOT NULL,
  house_no VARCHAR(50) NOT NULL,
  area DECIMAL(10,2) DEFAULT 0.00,
  house_type VARCHAR(20),
  rent_price DECIMAL(10,2) NOT NULL,
  water_price DECIMAL(5,2) NOT NULL,
  electric_price DECIMAL(5,2) NOT NULL,
  share_coefficient DECIMAL(5,2) DEFAULT 1.00,
  house_status TINYINT DEFAULT 0,
  current_tenant_id INT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 租客表
CREATE TABLE IF NOT EXISTS tenant_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tenant_name VARCHAR(50) NOT NULL,
  tenant_phone VARCHAR(20) NOT NULL,
  id_card VARCHAR(20),
  id_card_img VARCHAR(255),
  house_id INT NOT NULL,
  check_in_time DATE NOT NULL,
  contract_end_time DATE NOT NULL,
  deposit DECIMAL(10,2) NOT NULL,
  contract_img VARCHAR(255),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 抄表记录表
CREATE TABLE IF NOT EXISTS meter_reading (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  house_id INT NOT NULL,
  reading_time DATE NOT NULL,
  last_electric DECIMAL(10,2) DEFAULT 0.00,
  current_electric DECIMAL(10,2) DEFAULT 0.00,
  last_water DECIMAL(10,2) DEFAULT 0.00,
  current_water DECIMAL(10,2) DEFAULT 0.00,
  electric_img VARCHAR(255),
  water_img VARCHAR(255),
  operator VARCHAR(50),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 账单表
CREATE TABLE IF NOT EXISTS bill_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  house_id INT NOT NULL,
  tenant_id INT NOT NULL,
  bill_month VARCHAR(20) NOT NULL,
  rent DECIMAL(10,2) DEFAULT 0.00,
  water_fee DECIMAL(10,2) DEFAULT 0.00,
  electric_fee DECIMAL(10,2) DEFAULT 0.00,
  other_fee DECIMAL(10,2) DEFAULT 0.00,
  late_fee DECIMAL(10,2) DEFAULT 0.00,
  total_fee DECIMAL(10,2) DEFAULT 0.00,
  due_date DATE NOT NULL,
  bill_status TINYINT DEFAULT 0,
  payment_time DATETIME NULL,
  payment_type TINYINT NULL,
  payment_remark VARCHAR(255),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 催租模板表
CREATE TABLE IF NOT EXISTS reminder_template (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL DEFAULT 0,
  template_name VARCHAR(50) NOT NULL,
  template_content TEXT NOT NULL,
  reminder_type TINYINT DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 退房结算表
CREATE TABLE IF NOT EXISTS check_out_settle (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  house_id INT NOT NULL,
  tenant_id INT NOT NULL,
  check_out_time DATE NOT NULL,
  deposit DECIMAL(10,2) DEFAULT 0.00,
  unpaid_fee DECIMAL(10,2) DEFAULT 0.00,
  deduct_fee DECIMAL(10,2) DEFAULT 0.00,
  refund_fee DECIMAL(10,2) DEFAULT 0.00,
  refund_time DATETIME NULL,
  remark VARCHAR(255),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS sys_setting (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  default_water_price DECIMAL(5,2) DEFAULT 0.00,
  default_electric_price DECIMAL(5,2) DEFAULT 0.00,
  default_share_coefficient DECIMAL(5,2) DEFAULT 1.00,
  reminder_days VARCHAR(50) DEFAULT '3,1,0',
  late_fee_rate DECIMAL(5,2) DEFAULT 0.00,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入默认催租模板
INSERT IGNORE INTO reminder_template (id, user_id, template_name, template_content, reminder_type) VALUES
(1, 0, '到期前3天提醒', '{tenant_name}您好，您租住的{house_no}本月租金{total_fee}元，将于{due_date}到期，请及时缴纳。', 0),
(2, 0, '到期当天提醒', '{tenant_name}您好，您租住的{house_no}本月租金{total_fee}元今日到期，请尽快缴纳。', 1),
(3, 0, '逾期提醒', '{tenant_name}您好，您租住的{house_no}本月租金{total_fee}元已逾期，请尽快缴纳，以免产生滞纳金。', 2);
