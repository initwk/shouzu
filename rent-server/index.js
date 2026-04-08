const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/user', require('./routes/user'));
app.use('/api/house', require('./routes/house'));
app.use('/api/tenant', require('./routes/tenant'));
app.use('/api/meter', require('./routes/meter'));
app.use('/api/bill', require('./routes/bill'));
app.use('/api/reminder', require('./routes/reminder'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/setting', require('./routes/setting'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 测试接口
app.get('/', (req, res) => {
  res.send('房东收租管理系统 - 后端服务运行中');
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ code: 404, msg: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ code: 500, msg: '服务器内部错误' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`后端服务已启动：http://localhost:${PORT}`);
});
