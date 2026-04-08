const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取租客列表
router.get('/list', async (req, res) => {
  const { user_id, keyword } = req.query;
  try {
    let sql = `SELECT t.*, h.community_name, h.house_no
      FROM tenant_info t
      LEFT JOIN house_info h ON t.house_id = h.id
      WHERE t.user_id = ?`;
    const params = [user_id];
    if (keyword) {
      sql += ` AND (t.tenant_name LIKE ? OR t.tenant_phone LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY t.create_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 添加租客（同时绑定房源）
router.post('/add', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { user_id, tenant_name, tenant_phone, id_card, house_id, check_in_time, contract_end_time, deposit } = req.body;
    const [result] = await conn.query(
      `INSERT INTO tenant_info (user_id, tenant_name, tenant_phone, id_card, house_id, check_in_time, contract_end_time, deposit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, tenant_name, tenant_phone, id_card || '', house_id, check_in_time, contract_end_time, deposit || 0]
    );
    // 更新房源状态为已租，绑定当前租客
    await conn.query(
      'UPDATE house_info SET house_status = 1, current_tenant_id = ? WHERE id = ?',
      [result.insertId, house_id]
    );
    await conn.commit();
    res.json({ code: 200, msg: '添加成功' });
  } catch (err) {
    await conn.rollback();
    res.json({ code: 500, msg: '添加失败', error: err.message });
  } finally {
    conn.release();
  }
});

// 修改租客
router.post('/update', async (req, res) => {
  const { id, tenant_name, tenant_phone, id_card, check_in_time, contract_end_time, deposit } = req.body;
  try {
    await pool.query(
      `UPDATE tenant_info SET tenant_name=?, tenant_phone=?, id_card=?, check_in_time=?, contract_end_time=?, deposit=? WHERE id=?`,
      [tenant_name, tenant_phone, id_card || '', check_in_time, contract_end_time, deposit || 0, id]
    );
    res.json({ code: 200, msg: '修改成功' });
  } catch (err) {
    res.json({ code: 500, msg: '修改失败', error: err.message });
  }
});

// 删除租客
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    // 查询租客绑定的房源
    const [tenants] = await pool.query('SELECT house_id FROM tenant_info WHERE id = ?', [id]);
    if (tenants.length > 0) {
      // 释放房源
      await pool.query(
        'UPDATE house_info SET house_status = 0, current_tenant_id = NULL WHERE id = ?',
        [tenants[0].house_id]
      );
    }
    await pool.query('DELETE FROM tenant_info WHERE id = ?', [id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '删除失败', error: err.message });
  }
});

// 获取租客详情
router.get('/detail', async (req, res) => {
  const { id } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT t.*, h.community_name, h.house_no FROM tenant_info t LEFT JOIN house_info h ON t.house_id = h.id WHERE t.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.json({ code: 500, msg: '租客不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

module.exports = router;
