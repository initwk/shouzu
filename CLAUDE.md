# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

房东收租管理系统 (Landlord Rent Collection Management System) — a lightweight, landlord-only backend management tool for tracking properties, tenants, utility meter readings, bills, and payments. No tenant-facing app; no payment gateway integration (landlords mark payments manually).

## Tech Stack

- **Frontend**: Vue 3 + Vite + Element Plus + Axios
- **Backend**: Node.js + Express + mysql2 + CORS
- **Database**: MySQL 5.7, database name `rent_system`, charset `utf8mb4`
- **Ports**: Frontend 5173, Backend 3000

## Commands

```bash
# Backend (from rent-server/)
npm install express mysql2 cors
node index.js              # starts backend on :3000

# Frontend (from rent-web/)
npm install
npm install element-plus axios
npm run dev                # starts frontend on :5173
```

## Database Schema (8 tables)

All tables use `utf8mb4_general_ci`, auto-increment `id` PK, and `create_time`/`update_time` timestamps.

| Table | Purpose | Key Fields |
|---|---|---|
| `sys_user` | Landlord accounts | `user_level` (0=free, 1=standard, 2=pro), `expire_time` |
| `house_info` | Properties | `user_id` FK, `house_status` (0=vacant, 1=rented), `current_tenant_id` FK, `water_price`, `electric_price`, `share_coefficient` |
| `tenant_info` | Tenants | `house_id` FK (1:1 binding), `check_in_time`, `contract_end_time`, `deposit` |
| `meter_reading` | Utility readings | `house_id` FK, `last_electric`/`current_electric`, `last_water`/`current_water` |
| `bill_info` | Bills (core table) | `house_id` + `tenant_id` FKs, `bill_month`, auto-calc fees, `bill_status` (0=unpaid, 1=paid, 2=overdue), `payment_type` (1=WeChat, 2=Alipay, 3=bank, 4=cash) |
| `reminder_template` | Rent reminder templates | Supports placeholders: `{tenant_name}`, `{house_no}`, `{total_fee}`, `{due_date}` |
| `check_out_settle` | Move-out settlements | `refund_fee = deposit - unpaid_fee - deduct_fee` |
| `sys_setting` | Per-user settings | Default water/electric prices, reminder days, late fee rate |

## Key Business Rules

- **Bill auto-calculation**: `electric_fee = (current_reading - last_reading) * electric_price * share_coefficient`; water fee same formula
- **Total fee**: `rent + water_fee + electric_fee + other_fee + late_fee`
- **Late fee**: configurable daily rate from `sys_setting.late_fee_rate`
- **Bill status flow**: unpaid (0) → paid (1) or overdue (2)
- **Move-out settlement**: `refund_fee = deposit - unpaid_fee - deduct_fee`; also sets `house_info.house_status` back to 0 and `current_tenant_id` to NULL
- **Tenant-house binding**: one tenant bound to one house via `house_id`; one house has one `current_tenant_id`
- **No payment gateway**: all payments happen offline; landlord manually marks bills as paid

## API Convention

- Base path: `/api/`
- Response format: `{ code: 200, msg: '...', data: ... }` (200=success, 401=auth fail, 500=error)
- Auth: `user_id` passed as query param (GET) or body field (POST) — single-user backend, no JWT/token auth
- Axios base URL: `http://localhost:3000/api`

## Frontend Architecture

- Layout: top navbar + left sidebar + main content area (PC-oriented)
- Sidebar modules: Dashboard, Houses, Tenants, Bills, Meter Readings, Reminders, Contracts, Finance, Settings
- All list pages: search bar at top, table with pagination (default 10/page), CRUD via dialogs
- Router guards: redirect to `/login` if no user in localStorage
- User state stored in `localStorage` under key `user`
