const express = require('express');
const router = express.Router();
const pool = require('../db');

// 注册
router.post('/register', async (req, res) => {
  const { username, password, nickname, phone } = req.body;
  try {
    const [exist] = await pool.query('SELECT id FROM sys_user WHERE username = ?', [username]);
    if (exist.length > 0) {
      return res.json({ code: 500, msg: '账号已存在' });
    }
    const [result] = await pool.query(
      'INSERT INTO sys_user (username, password, nickname, phone) VALUES (?, ?, ?, ?)',
      [username, password, nickname || '', phone || '']
    );
    // 自动创建用户系统设置
    await pool.query(
      'INSERT INTO sys_setting (user_id) VALUES (?)',
      [result.insertId]
    );
    res.json({ code: 200, msg: '注册成功' });
  } catch (err) {
    res.json({ code: 500, msg: '注册失败', error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, phone, user_level, expire_time FROM sys_user WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length === 0) {
      return res.json({ code: 401, msg: '账号或密码错误' });
    }
    res.json({ code: 200, msg: '登录成功', data: rows[0] });
  } catch (err) {
    res.json({ code: 500, msg: '登录失败', error: err.message });
  }
});

// 获取用户信息
router.get('/info', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, phone, user_level, expire_time FROM sys_user WHERE id = ?',
      [user_id]
    );
    if (rows.length === 0) {
      return res.json({ code: 401, msg: '用户不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 修改用户信息
router.post('/update', async (req, res) => {
  const { user_id, nickname, phone, password } = req.body;
  try {
    if (password) {
      await pool.query(
        'UPDATE sys_user SET nickname = ?, phone = ?, password = ? WHERE id = ?',
        [nickname, phone, password, user_id]
      );
    } else {
      await pool.query(
        'UPDATE sys_user SET nickname = ?, phone = ? WHERE id = ?',
        [nickname, phone, user_id]
      );
    }
    res.json({ code: 200, msg: '修改成功' });
  } catch (err) {
    res.json({ code: 500, msg: '修改失败', error: err.message });
  }
});

module.exports = router;
