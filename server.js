require("dotenv").config();

const crypto = require("node:crypto");
const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const Razorpay = require("razorpay");

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.");
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

const products = new Map([
  [1, { name: "Personalized Mug", price: 249 }],
  [2, { name: "Memory Photo Cushion", price: 499 }],
  [3, { name: "Custom T-shirt", price: 599 }],
  [4, { name: "Personalized Bottle", price: 399 }],
  [6, { name: "Personalized Greeting Card", price: 99 }],
  [7, { name: "Custom Travel Mug", price: 449 }],
  [8, { name: "Custom Tumbler", price: 599 }],
  [9, { name: "Custom Handkerchief", price: 199 }],
  [10, { name: "Custom Stickers", price: 149 }],
  [11, { name: "Custom Shirts", price: 699 }]
]);

const app = express();
app.use(express.json({ limit: "12mb" }));

const scrypt = promisify(crypto.scrypt);
const usersFile = path.join(__dirname, "accounts.json");
const uploadsDirectory = path.join(__dirname, "uploads");
const sessions = new Map();
const sessionDurationMs = 24 * 60 * 60 * 1000;

function readUsers() {
  try {
    const users = fs.readFileSync(usersFile, "utf8");
    const parsed = JSON.parse(users);
    if (!Array.isArray(parsed)) throw new Error("Account store must contain a list.");
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), {
    encoding: "utf8",
    flag: "w",
    mode: 0o600
  });
}

function createSession(email, res) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { email, expiresAt: now + sessionDurationMs });
  setSessionCookie(res, sessionId);
}

function setSessionCookie(res, sessionId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `customGiftsSession=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure}`
  );
}

app.post("/api/auth/signup", async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 100) {
    return res.status(400).json({ error: "Enter a name of 1 to 100 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "Password must be between 8 and 128 characters." });
  }

  const salt = crypto.randomBytes(16);
  const passwordHash = await scrypt(password, salt, 64);
  const users = readUsers();
  if (users.some(user => user.email === email)) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  users.push({
    name,
    email,
    salt: salt.toString("hex"),
    passwordHash: passwordHash.toString("hex")
  });
  saveUsers(users);

  createSession(email, res);
  return res.status(201).json({ name });
});

app.post("/api/auth/login", async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || password.length > 128) {
    return res.status(400).json({ error: "Enter your email and password." });
  }

  const user = readUsers().find(item => item.email === email);
  if (!user) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const actualHash = await scrypt(password, Buffer.from(user.salt, "hex"), 64);
  const expectedHash = Buffer.from(user.passwordHash, "hex");
  if (
    expectedHash.length !== actualHash.length ||
    !crypto.timingSafeEqual(actualHash, expectedHash)
  ) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  createSession(email, res);
  return res.json({ name: user.name });
});

app.post("/api/orders", async (req, res) => {
  const body = req.body || {};
  const items = body.items;
  const customisation = body.customisation;

  if (!Array.isArray(items) || items.length === 0 || items.length > products.size) {
    return res.status(400).json({ error: "Your cart is empty or invalid." });
  }
  if (
    customisation !== undefined &&
    (
      !customisation ||
      typeof customisation !== "object" ||
      Array.isArray(customisation) ||
      (customisation.text !== undefined &&
        (typeof customisation.text !== "string" || customisation.text.length > 150)) ||
      (customisation.instructions !== undefined &&
        (typeof customisation.instructions !== "string" || customisation.instructions.length > 500)) ||
      (customisation.image !== undefined &&
        customisation.image !== null &&
        (
          typeof customisation.image !== "object" ||
          Array.isArray(customisation.image) ||
          !["image/jpeg", "image/png", "image/webp"].includes(customisation.image.mimeType) ||
          typeof customisation.image.data !== "string"
        ))
    )
  ) {
    return res.status(400).json({ error: "Your customisation details are invalid." });
  }

  const quantities = new Map();
  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({ error: "Your cart contains an invalid item." });
    }

    const product = products.get(item.id);
    if (!product) {
      return res.status(400).json({ error: "Your cart contains an unavailable product." });
    }

    quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
  }

  const amountInRupees = [...quantities].reduce((total, [id, quantity]) => {
    return total + products.get(id).price * quantity;
  }, 0);
  const amount = amountInRupees * 100;

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "The order amount is invalid." });
  }

  let uploadedImagePath;
  let uploadedImageName;
  if (customisation?.image) {
    const { mimeType, data } = customisation.image;
    const extension = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp"
    }[mimeType];

    if (
      data.length > Math.ceil((8 * 1024 * 1024 * 4) / 3) + 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)
    ) {
      return res.status(400).json({ error: "The image must be smaller than 8 MB and valid." });
    }

    const imageBuffer = Buffer.from(data, "base64");
    const isPng = mimeType === "image/png" &&
      imageBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = mimeType === "image/jpeg" &&
      imageBuffer.length >= 3 &&
      imageBuffer[0] === 255 && imageBuffer[1] === 216 && imageBuffer[2] === 255;
    const isWebp = mimeType === "image/webp" &&
      imageBuffer.length >= 12 &&
      imageBuffer.toString("ascii", 0, 4) === "RIFF" &&
      imageBuffer.toString("ascii", 8, 12) === "WEBP";

    if (
      imageBuffer.length === 0 ||
      imageBuffer.length > 8 * 1024 * 1024 ||
      !(isPng || isJpeg || isWebp)
    ) {
      return res.status(400).json({ error: "The uploaded file is not a valid supported image." });
    }

    uploadedImageName = `${crypto.randomUUID()}${extension}`;
    uploadedImagePath = path.join(uploadsDirectory, uploadedImageName);
    await fs.promises.mkdir(uploadsDirectory, { recursive: true });
    await fs.promises.writeFile(uploadedImagePath, imageBuffer, { flag: "wx", mode: 0o600 });
  }

  const description = [...quantities].map(([id, quantity]) => {
    return `${products.get(id).name} x ${quantity}`;
  }).join(", ");

  const notes = { items: description.slice(0, 256) };
  if (customisation?.text?.trim()) {
    notes.custom_text = customisation.text.trim().slice(0, 256);
  }
  if (customisation?.instructions?.trim()) {
    notes.instructions = customisation.instructions.trim().slice(0, 256);
  }
  if (uploadedImageName) {
    notes.image_file = uploadedImageName;
  }

  let order;
  try {
    order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `cgs-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      notes
    });
  } catch (error) {
    if (uploadedImagePath) await fs.promises.unlink(uploadedImagePath);
    throw error;
  }

  return res.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID
  });
});

app.post("/api/payments/verify", async (req, res) => {
  const body = req.body || {};
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;

  if (
    typeof orderId !== "string" ||
    typeof paymentId !== "string" ||
    typeof signature !== "string" ||
    !/^[a-f\d]{64}$/i.test(signature)
  ) {
    return res.status(400).json({ error: "Payment details are invalid." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest();
  const receivedSignature = Buffer.from(signature, "hex");

  if (
    expectedSignature.length !== receivedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return res.status(400).json({ error: "Payment signature could not be verified." });
  }

  const payment = await razorpay.payments.fetch(paymentId);
  if (payment.order_id !== orderId || payment.status !== "captured") {
    return res.status(400).json({ error: "Payment has not been captured." });
  }

  const order = await razorpay.orders.fetch(orderId);
  if (
    order.status !== "paid" ||
    order.amount_paid !== payment.amount ||
    order.amount !== payment.amount
  ) {
    return res.status(400).json({ error: "Payment could not be confirmed." });
  }

  return res.json({ verified: true });
});

app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "signup.html"));
});
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});
app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((error, req, res, next) => {
  console.error("Request failed:", error.message);
  if (res.headersSent) return next(error);

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  return res.status(status).json({
    error: status === 400
      ? "The request body must contain valid JSON."
      : "The server could not complete your request."
  });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Custom Gifts Studio is running at http://localhost:${port}`);
});
