const express = require('express');
const router = express.Router();
const pool = require('../db');

// 格式化日期为 YYYY-MM-DD
const formatDate = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.split('T')[0];
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 获取催租模板列表
router.get('/list', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reminder_template WHERE user_id = 0 OR user_id = ? ORDER BY id',
      [user_id]
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 添加催租模板
router.post('/add', async (req, res) => {
  const { user_id, template_name, template_content, reminder_type } = req.body;
  try {
    await pool.query(
      'INSERT INTO reminder_template (user_id, template_name, template_content, reminder_type) VALUES (?, ?, ?, ?)',
      [user_id, template_name, template_content, reminder_type || 0]
    );
    res.json({ code: 200, msg: '添加成功' });
  } catch (err) {
    res.json({ code: 500, msg: '添加失败', error: err.message });
  }
});

// 修改催租模板
router.post('/update', async (req, res) => {
  const { id, template_name, template_content, reminder_type } = req.body;
  try {
    await pool.query(
      'UPDATE reminder_template SET template_name=?, template_content=?, reminder_type=? WHERE id=?',
      [template_name, template_content, reminder_type || 0, id]
    );
    res.json({ code: 200, msg: '修改成功' });
  } catch (err) {
    res.json({ code: 500, msg: '修改失败', error: err.message });
  }
});

// 删除催租模板
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM reminder_template WHERE id = ? AND user_id != 0', [id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '删除失败', error: err.message });
  }
});

// 生成催租内容（替换占位符）
router.post('/render', async (req, res) => {
  const { template_id, tenant_id } = req.body;
  try {
    const [templates] = await pool.query('SELECT * FROM reminder_template WHERE id = ?', [template_id]);
    if (templates.length === 0) {
      return res.json({ code: 500, msg: '模板不存在' });
    }
    const [tenants] = await pool.query(
      `SELECT t.*, h.community_name, h.house_no FROM tenant_info t LEFT JOIN house_info h ON t.house_id = h.id WHERE t.id = ?`,
      [tenant_id]
    );
    if (tenants.length === 0) {
      return res.json({ code: 500, msg: '租客不存在' });
    }

    // 获取租客未缴账单
    const [bills] = await pool.query(
      'SELECT total_fee, due_date FROM bill_info WHERE tenant_id = ? AND bill_status = 0 ORDER BY due_date ASC LIMIT 1',
      [tenant_id]
    );

    const t = tenants[0];
    let content = templates[0].template_content;
    content = content.replace(/\{tenant_name\}/g, t.tenant_name);
    content = content.replace(/\{house_no\}/g, t.house_no || '');
    content = content.replace(/\{total_fee\}/g, bills.length > 0 ? bills[0].total_fee : '0.00');
    content = content.replace(/\{due_date\}/g, bills.length > 0 ? formatDate(bills[0].due_date) : '');

    res.json({ code: 200, data: { content, tenant_phone: t.tenant_phone } });
  } catch (err) {
    res.json({ code: 500, msg: '生成失败', error: err.message });
  }
});

module.exports = router;
