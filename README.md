# CashFlow Telegram Mini App

A working starter for a Telegram Mini App with:
- CashFlow dashboard
- Watch Ads demo credit
- Tasks
- Invite button
- Withdrawal request validation
- Telegram WebApp user detection
- Backend API

## Run locally

1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run:
   npm install
   npm start
4. Open http://localhost:3000

## Telegram setup

Create a bot with BotFather and configure its Mini App/Web App URL to your HTTPS deployment URL.

Set the environment variable:
BOT_TOKEN=your_real_bot_token

The backend verifies Telegram WebApp initData when BOT_TOKEN is set.

## Important

The Watch Ad endpoint is DEMO MODE. It credits $0.30 for testing the UI. For a real earning service, replace this with a legitimate rewarded-ad provider and server-side verification/callback. Do not claim or display real earnings unless the underlying ad network/task has actually generated revenue.

The in-memory database is for testing only. For production, use PostgreSQL/MySQL and add authentication, rate limiting, audit logs, admin controls, and a real payout provider.

## Monetag
The Mini App includes the Monetag SDK zone 11916419. The Watch Ad action calls `show_11916419()` and only sends the reward request after the promise resolves.
