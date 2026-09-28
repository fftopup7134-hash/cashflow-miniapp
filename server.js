const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || "";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

function getUser(id, name = "Guest") {
  const key = String(id || "demo");
  if (!users.has(key)) {
    users.set(key, {
      id: key,
      name,
      balance: 0,
      adsWatched: 0,
      tasksDone: 0,
      referrals: 0,
      withdrawals: []
    });
  }
  return users.get(key);
}

function verifyTelegramInitData(initData) {
  if (!BOT_TOKEN || !initData) return false;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculated = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  return calculated === hash;
}

app.post("/api/session", (req, res) => {
  const { initData, user } = req.body || {};
  if (BOT_TOKEN && initData && !verifyTelegramInitData(initData)) {
    return res.status(401).json({ error: "Invalid Telegram session" });
  }
  const u = getUser(user?.id, user?.first_name || "Guest");
  res.json(u);
});

app.post("/api/watch-ad", (req, res) => {
  const u = getUser(req.body?.userId, req.body?.name);
  // DEMO MODE: replace this credit with a verified rewarded-ad callback in production.
  u.adsWatched += 1;
  u.balance = +(u.balance + 0.30).toFixed(2);
  res.json(u);
});

app.post("/api/task", (req, res) => {
  const u = getUser(req.body?.userId, req.body?.name);
  u.tasksDone += 1;
  u.balance = +(u.balance + 0.50).toFixed(2);
  res.json(u);
});

app.post("/api/referral", (req, res) => {
  const u = getUser(req.body?.userId, req.body?.name);
  u.referrals += 1;
  u.balance = +(u.balance + 1.00).toFixed(2);
  res.json(u);
});

app.post("/api/withdraw", (req, res) => {
  const u = getUser(req.body?.userId, req.body?.name);
  const amount = Number(req.body?.amount);
  const method = String(req.body?.method || "").trim();
  const account = String(req.body?.account || "").trim();

  if (!Number.isFinite(amount) || amount < 5) {
    return res.status(400).json({ error: "Minimum withdrawal is $5.00" });
  }
  if (amount > u.balance) {
    return res.status(400).json({ error: "Insufficient balance" });
  }
  if (!method || !account) {
    return res.status(400).json({ error: "Enter a withdrawal method and account" });
  }

  u.balance = +(u.balance - amount).toFixed(2);
  u.withdrawals.push({
    id: crypto.randomUUID(),
    amount,
    method,
    account,
    status: "Pending",
    createdAt: new Date().toISOString()
  });
  res.json(u);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`CashFlow running on http://localhost:${PORT}`));