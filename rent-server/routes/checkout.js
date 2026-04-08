const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取退房结算列表
router.get('/list', async (req, res) => {
  const { user_id } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT c.*, h.community_name, h.house_no, t.tenant_name
       FROM check_out_settle c
       LEFT JOIN house_info h ON c.house_id = h.id
       LEFT JOIN tenant_info t ON c.tenant_id = t.id
       WHERE c.user_id = ? ORDER BY c.create_time DESC`,
      [user_id]
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

// 退房结算
router.post('/settle', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { user_id, house_id, tenant_id, check_out_time, deduct_fee, remark } = req.body;

    // 获取押金
    const [tenants] = await conn.query('SELECT deposit FROM tenant_info WHERE id = ?', [tenant_id]);
    const deposit = tenants.length > 0 ? parseFloat(tenants[0].deposit) || 0 : 0;

    // 获取未缴费用
    const [bills] = await conn.query(
      'SELECT IFNULL(SUM(total_fee), 0) AS unpaid FROM bill_info WHERE tenant_id = ? AND bill_status = 0',
      [tenant_id]
    );
    const unpaidFee = parseFloat(bills[0].unpaid) || 0;
    const deductFee = parseFloat(deduct_fee) || 0;
    const refundFee = deposit - unpaidFee - deductFee;

    // 插入结算记录
    await conn.query(
      `INSERT INTO check_out_settle (user_id, house_id, tenant_id, check_out_time, deposit, unpaid_fee, deduct_fee, refund_fee, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, house_id, tenant_id, check_out_time, deposit, unpaidFee, deductFee, refundFee, remark || '']
    );

    // 释放房源
    await conn.query(
      'UPDATE house_info SET house_status = 0, current_tenant_id = NULL WHERE id = ?',
      [house_id]
    );

    // 将租客所有未缴账单标记为已缴
    await conn.query(
      'UPDATE bill_info SET bill_status = 1, payment_time = NOW() WHERE tenant_id = ? AND bill_status = 0',
      [tenant_id]
    );

    // 删除租客记录
    await conn.query('DELETE FROM tenant_info WHERE id = ?', [tenant_id]);

    await conn.commit();
    res.json({ code: 200, msg: '退房结算成功', data: { deposit, unpaidFee, deductFee, refundFee } });
  } catch (err) {
    await conn.rollback();
    res.json({ code: 500, msg: '结算失败', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
