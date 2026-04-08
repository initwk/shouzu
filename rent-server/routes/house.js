const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取房源列表（带租客信息）
router.get('/list', async (req, res) => {
  const { user_id, keyword, house_status } = req.query;
  try {
    let sql = `SELECT h.*, t.tenant_name, t.tenant_phone
      FROM house_info h
      LEFT JOIN tenant_info t ON h.current_tenant_id = t.id
      WHERE h.user_id = ?`;
    const params = [user_id];
    if (keyword) {
      sql += ` AND (h.community_name LIKE ? OR h.house_no LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (house_status !== undefined && house_status !== '') {
      sql += ` AND h.house_status = ?`;
      params.push(house_status);
    }
    sql += ' ORDER BY h.create_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 获取房源详情
router.get('/detail', async (req, res) => {
  const { id } = req.query;
  try {
    const [rows] = await pool.query('SELECT * FROM house_info WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.json({ code: 500, msg: '房源不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 添加房源
router.post('/add', async (req, res) => {
  const { user_id, community_name, house_no, area, house_type, rent_price, water_price, electric_price, share_coefficient } = req.body;
  try {
    await pool.query(
      `INSERT INTO house_info (user_id, community_name, house_no, area, house_type, rent_price, water_price, electric_price, share_coefficient)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, community_name, house_no, area || 0, house_type || '', rent_price, water_price, electric_price, share_coefficient || 1]
    );
    res.json({ code: 200, msg: '添加成功' });
  } catch (err) {
    res.json({ code: 500, msg: '添加失败', error: err.message });
  }
});

// 修改房源
router.post('/update', async (req, res) => {
  const { id, community_name, house_no, area, house_type, rent_price, water_price, electric_price, share_coefficient } = req.body;
  try {
    await pool.query(
      `UPDATE house_info SET community_name=?, house_no=?, area=?, house_type=?, rent_price=?, water_price=?, electric_price=?, share_coefficient=? WHERE id=?`,
      [community_name, house_no, area || 0, house_type || '', rent_price, water_price, electric_price, share_coefficient || 1, id]
    );
    res.json({ code: 200, msg: '修改成功' });
  } catch (err) {
    res.json({ code: 500, msg: '修改失败', error: err.message });
  }
});

// 删除房源
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    const [houses] = await pool.query('SELECT house_status FROM house_info WHERE id = ?', [id]);
    if (houses.length > 0 && houses[0].house_status === 1) {
      return res.json({ code: 500, msg: '已出租的房源不能删除' });
    }
    await pool.query('DELETE FROM house_info WHERE id = ?', [id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '删除失败', error: err.message });
  }
});

// 空置房源下拉列表（绑定租客用）
router.get('/vacant', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT id, community_name, house_no FROM house_info WHERE user_id = ? AND house_status = 0 ORDER BY id',
      [user_id]
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

module.exports = router;
