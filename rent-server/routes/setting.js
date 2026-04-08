const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取系统设置
router.get('/detail', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM sys_setting WHERE user_id = ?', [user_id]);
    if (rows.length === 0) {
      // 自动创建默认设置
      await pool.query('INSERT INTO sys_setting (user_id) VALUES (?)', [user_id]);
      const [newRows] = await pool.query('SELECT * FROM sys_setting WHERE user_id = ?', [user_id]);
      return res.json({ code: 200, data: newRows[0] });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 修改系统设置
router.post('/update', async (req, res) => {
  const { user_id, default_water_price, default_electric_price, default_share_coefficient, reminder_days, late_fee_rate } = req.body;
  try {
    await pool.query(
      `UPDATE sys_setting SET default_water_price=?, default_electric_price=?, default_share_coefficient=?, reminder_days=?, late_fee_rate=? WHERE user_id=?`,
      [default_water_price || 0, default_electric_price || 0, default_share_coefficient || 1, reminder_days || '3,1,0', late_fee_rate || 0, user_id]
    );
    res.json({ code: 200, msg: '修改成功' });
  } catch (err) {
    res.json({ code: 500, msg: '修改失败', error: err.message });
  }
});

module.exports = router;
