const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取抄表记录列表
router.get('/list', async (req, res) => {
  const { user_id, house_id } = req.query;
  try {
    let sql = `SELECT m.*, h.community_name, h.house_no
      FROM meter_reading m
      LEFT JOIN house_info h ON m.house_id = h.id
      WHERE m.user_id = ?`;
    const params = [user_id];
    if (house_id) {
      sql += ' AND m.house_id = ?';
      params.push(house_id);
    }
    sql += ' ORDER BY m.reading_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 添加抄表记录
router.post('/add', async (req, res) => {
  const { user_id, house_id, reading_time, last_electric, current_electric, last_water, current_water, operator } = req.body;
  try {
    await pool.query(
      `INSERT INTO meter_reading (user_id, house_id, reading_time, last_electric, current_electric, last_water, current_water, operator)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, house_id, reading_time, last_electric || 0, current_electric || 0, last_water || 0, current_water || 0, operator || '']
    );
    res.json({ code: 200, msg: '添加成功' });
  } catch (err) {
    res.json({ code: 500, msg: '添加失败', error: err.message });
  }
});

// 获取某房源最近一次抄表记录（用于自动填入上期读数）
router.get('/latest', async (req, res) => {
  const { house_id } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT current_electric, current_water FROM meter_reading WHERE house_id = ? ORDER BY reading_time DESC LIMIT 1',
      [house_id]
    );
    res.json({ code: 200, data: rows.length > 0 ? rows[0] : { current_electric: 0, current_water: 0 } });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 删除抄表记录
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM meter_reading WHERE id = ?', [id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '删除失败', error: err.message });
  }
});

module.exports = router;
