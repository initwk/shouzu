const express = require('express');
const router = express.Router();
const pool = require('../db');

// 仪表盘统计
router.get('/stats', async (req, res) => {
  const { user_id } = req.query;
  try {
    // 总房源数、在租、空置
    const [houseStats] = await pool.query(
      'SELECT COUNT(*) AS total, SUM(house_status=1) AS rented, SUM(house_status=0) AS vacant FROM house_info WHERE user_id = ?',
      [user_id]
    );

    // 今日到期账单数
    const [todayDue] = await pool.query(
      'SELECT COUNT(*) AS count FROM bill_info WHERE user_id = ? AND bill_status = 0 AND due_date = CURDATE()',
      [user_id]
    );

    // 逾期账单数
    const [overdue] = await pool.query(
      'SELECT COUNT(*) AS count FROM bill_info WHERE user_id = ? AND bill_status = 0 AND due_date < CURDATE()',
      [user_id]
    );

    // 本月总收入
    const [monthIncome] = await pool.query(
      'SELECT IFNULL(SUM(total_fee), 0) AS total FROM bill_info WHERE user_id = ? AND bill_status = 1 AND payment_time >= DATE_FORMAT(CURDATE(), "%Y-%m-01")',
      [user_id]
    );

    // 待缴账单列表
    const [unpaidBills] = await pool.query(
      `SELECT b.*, h.community_name, h.house_no, t.tenant_name
       FROM bill_info b
       LEFT JOIN house_info h ON b.house_id = h.id
       LEFT JOIN tenant_info t ON b.tenant_id = t.id
       WHERE b.user_id = ? AND b.bill_status = 0
       ORDER BY b.due_date ASC LIMIT 10`,
      [user_id]
    );

    // 即将到期合同（30天内）
    const [expiringContracts] = await pool.query(
      `SELECT t.*, h.community_name, h.house_no
       FROM tenant_info t
       LEFT JOIN house_info h ON t.house_id = h.id
       WHERE t.user_id = ? AND t.contract_end_time BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       ORDER BY t.contract_end_time ASC`,
      [user_id]
    );

    // 最近缴费记录
    const [recentPayments] = await pool.query(
      `SELECT b.*, h.community_name, h.house_no, t.tenant_name
       FROM bill_info b
       LEFT JOIN house_info h ON b.house_id = h.id
       LEFT JOIN tenant_info t ON b.tenant_id = t.id
       WHERE b.user_id = ? AND b.bill_status = 1
       ORDER BY b.payment_time DESC LIMIT 5`,
      [user_id]
    );

    res.json({
      code: 200,
      data: {
        houseStats: houseStats[0],
        todayDue: todayDue[0].count,
        overdue: overdue[0].count,
        monthIncome: monthIncome[0].total,
        unpaidBills,
        expiringContracts,
        recentPayments
      }
    });
  } catch (err) {
    res.json({ code: 500, msg: '查询失败', error: err.message });
  }
});

module.exports = router;
