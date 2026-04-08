const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取账单列表
router.get('/list', async (req, res) => {
  const { user_id, bill_status, bill_month, keyword } = req.query;
  try {
    let sql = `SELECT b.*, h.community_name, h.house_no, t.tenant_name, t.tenant_phone
      FROM bill_info b
      LEFT JOIN house_info h ON b.house_id = h.id
      LEFT JOIN tenant_info t ON b.tenant_id = t.id
      WHERE b.user_id = ?`;
    const params = [user_id];
    if (bill_status !== undefined && bill_status !== '') {
      sql += ' AND b.bill_status = ?';
      params.push(bill_status);
    }
    if (bill_month) {
      sql += ' AND b.bill_month = ?';
      params.push(bill_month);
    }
    if (keyword) {
      sql += ` AND (h.community_name LIKE ? OR h.house_no LIKE ? OR t.tenant_name LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY b.create_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败' });
  }
});

// 生成账单（自动计算水电费）
router.post('/generate', async (req, res) => {
  const { user_id, house_id, tenant_id, bill_month, rent, other_fee, due_date } = req.body;
  try {
    // 防止重复生成同月账单
    const [exist] = await pool.query(
      'SELECT id FROM bill_info WHERE house_id = ? AND tenant_id = ? AND bill_month = ?',
      [house_id, tenant_id, bill_month]
    );
    if (exist.length > 0) {
      return res.json({ code: 500, msg: '该月账单已存在' });
    }

    // 获取房源信息
    const [houses] = await pool.query('SELECT water_price, electric_price, share_coefficient FROM house_info WHERE id = ?', [house_id]);
    if (houses.length === 0) {
      return res.json({ code: 500, msg: '房源不存在' });
    }
    const house = houses[0];

    // 获取本期抄表记录
    const [readings] = await pool.query(
      'SELECT * FROM meter_reading WHERE house_id = ? ORDER BY reading_time DESC LIMIT 1',
      [house_id]
    );
    let waterFee = 0;
    let electricFee = 0;
    if (readings.length > 0) {
      const r = readings[0];
      electricFee = (r.current_electric - r.last_electric) * house.electric_price * (house.share_coefficient || 1);
      waterFee = (r.current_water - r.last_water) * house.water_price * (house.share_coefficient || 1);
    }

    const totalFee = (parseFloat(rent) || 0) + electricFee + waterFee + (parseFloat(other_fee) || 0);

    await pool.query(
      `INSERT INTO bill_info (user_id, house_id, tenant_id, bill_month, rent, water_fee, electric_fee, other_fee, total_fee, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, house_id, tenant_id, bill_month, rent || 0, Number(waterFee.toFixed(2)), Number(electricFee.toFixed(2)), other_fee || 0, Number(totalFee.toFixed(2)), due_date]
    );
    res.json({ code: 200, msg: '账单生成成功' });
  } catch (err) {
    res.json({ code: 500, msg: '生成失败' });
  }
});

// 编辑账单
router.post('/update', async (req, res) => {
  const { id, rent, water_fee, electric_fee, other_fee, late_fee, due_date } = req.body;
  try {
    const rentVal = parseFloat(rent) || 0;
    const waterVal = parseFloat(water_fee) || 0;
    const electricVal = parseFloat(electric_fee) || 0;
    const otherVal = parseFloat(other_fee) || 0;
    const lateVal = parseFloat(late_fee) || 0;
    const totalVal = rentVal + waterVal + electricVal + otherVal + lateVal;
    await pool.query(
      `UPDATE bill_info SET rent=?, water_fee=?, electric_fee=?, other_fee=?, late_fee=?, total_fee=?, due_date=? WHERE id=?`,
      [rentVal, waterVal, electricVal, otherVal, lateVal, Number(totalVal.toFixed(2)), due_date, id]
    );
    res.json({ code: 200, msg: '修改成功' });
  } catch (err) {
    res.json({ code: 500, msg: '修改失败' });
  }
});

// 标记缴费
router.post('/pay', async (req, res) => {
  const { id, payment_type, payment_remark } = req.body;
  try {
    await pool.query(
      `UPDATE bill_info SET bill_status = 1, payment_time = NOW(), payment_type = ?, payment_remark = ? WHERE id = ?`,
      [payment_type, payment_remark || '', id]
    );
    res.json({ code: 200, msg: '标记成功' });
  } catch (err) {
    res.json({ code: 500, msg: '标记失败' });
  }
});

// 自动计算滞纳金（基于 sys_setting.late_fee_rate 和逾期天数）
router.post('/calc-late-fee', async (req, res) => {
  const { user_id } = req.body;
  try {
    // 获取滞纳金费率
    const [settings] = await pool.query('SELECT late_fee_rate FROM sys_setting WHERE user_id = ?', [user_id]);
    const rate = settings.length > 0 ? parseFloat(settings[0].late_fee_rate) || 0 : 0;
    if (rate <= 0) {
      return res.json({ code: 200, msg: '未配置滞纳金费率，跳过计算', data: { count: 0 } });
    }
    // 查询所有逾期未缴账单
    const [overdues] = await pool.query(
      `SELECT id, total_fee, due_date FROM bill_info WHERE user_id = ? AND bill_status = 0 AND due_date < CURDATE()`,
      [user_id]
    );
    let count = 0;
    for (const bill of overdues) {
      const dueDate = new Date(bill.due_date);
      const today = new Date();
      const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      const lateFee = parseFloat(bill.total_fee) * rate / 100 * diffDays;
      const newTotal = parseFloat(bill.total_fee) + lateFee;
      await pool.query(
        'UPDATE bill_info SET late_fee = ?, total_fee = ?, bill_status = 2 WHERE id = ?',
        [Number(lateFee.toFixed(2)), Number(newTotal.toFixed(2)), bill.id]
      );
      count++;
    }
    res.json({ code: 200, msg: `已更新 ${count} 条逾期账单`, data: { count } });
  } catch (err) {
    res.json({ code: 500, msg: '计算失败' });
  }
});

// 删除账单
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM bill_info WHERE id = ?', [id]);
    res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '删除失败' });
  }
});

// 获取账单详情
router.get('/detail', async (req, res) => {
  const { id } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT b.*, h.community_name, h.house_no, t.tenant_name
       FROM bill_info b
       LEFT JOIN house_info h ON b.house_id = h.id
       LEFT JOIN tenant_info t ON b.tenant_id = t.id
       WHERE b.id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.json({ code: 500, msg: '账单不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败' });
  }
});

module.exports = router;
