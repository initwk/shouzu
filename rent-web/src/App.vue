<template>
  <router-view />
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app { height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  color: var(--text-primary);
  background: var(--content-bg);
}

/* ===== 主题 1：经典亮白 ===== */
[data-theme="light"] {
  --sidebar-bg: #304156;
  --sidebar-logo-bg: #263445;
  --sidebar-text: #bfcbd9;
  --sidebar-active: #409EFF;
  --header-bg: #ffffff;
  --header-border: #e6e6e6;
  --content-bg: #f0f2f5;
  --card-bg: #ffffff;
  --text-primary: #303133;
  --text-secondary: #606266;
  --text-muted: #909399;
  --border-color: #e6e6e6;
  --login-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* ===== 主题 2：暗夜模式 ===== */
[data-theme="dark"] {
  --sidebar-bg: #1a1a2e;
  --sidebar-logo-bg: #16213e;
  --sidebar-text: #a8b2c1;
  --sidebar-active: #4fc3f7;
  --header-bg: #1e1e2f;
  --header-border: #333348;
  --content-bg: #121220;
  --card-bg: #1e1e2f;
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --text-muted: #808090;
  --border-color: #333348;
  --login-bg: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

/* ===== 主题 3：护眼绿 ===== */
[data-theme="green"] {
  --sidebar-bg: #2d4a3e;
  --sidebar-logo-bg: #1f362b;
  --sidebar-text: #c8d8cf;
  --sidebar-active: #66bb6a;
  --header-bg: #f5f7f0;
  --header-border: #d5ddd0;
  --content-bg: #eceee6;
  --card-bg: #f5f7f0;
  --text-primary: #2c3e2f;
  --text-secondary: #4a5e4d;
  --text-muted: #7a8e7d;
  --border-color: #d5ddd0;
  --login-bg: linear-gradient(135deg, #2d4a3e 0%, #1f362b 100%);
}

/* Element Plus 暗色主题覆盖 */
[data-theme="dark"] .el-card { background: var(--card-bg); border-color: var(--border-color); color: var(--text-primary); }
[data-theme="dark"] .el-table { --el-table-bg-color: #1e1e2f; --el-table-tr-bg-color: #1e1e2f; --el-table-header-bg-color: #252540; --el-table-row-hover-bg-color: #2a2a45; --el-table-border-color: #333348; --el-table-text-color: #e0e0e0; --el-table-header-text-color: #b0b0b0; }
[data-theme="dark"] .el-pagination { --el-pagination-bg-color: #1e1e2f; --el-pagination-text-color: #b0b0b0; --el-pagination-button-bg-color: #252540; }
[data-theme="dark"] .el-dialog { background: #1e1e2f; }
[data-theme="dark"] .el-form-item__label { color: var(--text-secondary); }
[data-theme="dark"] .el-input__wrapper { background: #252540; box-shadow: 0 0 0 1px var(--border-color) inset; }
[data-theme="dark"] .el-input__inner { color: var(--text-primary); }
[data-theme="dark"] .el-select .el-input__wrapper { background: #252540; }

/* Element Plus 护眼绿主题覆盖 */
[data-theme="green"] .el-card { background: var(--card-bg); border-color: var(--border-color); }
[data-theme="green"] .el-table { --el-table-bg-color: #f5f7f0; --el-table-tr-bg-color: #f5f7f0; --el-table-header-bg-color: #e8ebe2; --el-table-row-hover-bg-color: #e0e5d8; --el-table-border-color: #d5ddd0; }
</style>
