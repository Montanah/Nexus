const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const test = require("node:test");
const bcrypt = require("bcrypt");
const bcryptjs = require("bcryptjs");
const multer = require("multer");
const nodemailer = require("nodemailer");
const Users = require("../models/Users");
const Client = require("../models/Client");
const { upload, convertToBase64 } = require("../middlewares/uploadMiddleware");

function parseUpload(middleware, field, contents, complete = true) {
  const boundary = "nexus-dependency-test";
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="proof.png"\r\nContent-Type: image/png\r\n\r\n`),
    contents,
    Buffer.from(complete ? `\r\n--${boundary}--\r\n` : ""),
  ]);
  const req = new PassThrough();
  req.method = "POST";
  req.headers = {
    "content-type": `multipart/form-data; boundary=${boundary}`,
    "content-length": String(body.length),
  };
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve({ req, error }));
    req.end(body);
  });
}

test("existing bcrypt hashes still authenticate users and clients", async () => {
  const password = "Nexus migration test password";
  // The existing bcryptjs 2.x dependency produces legacy $2a$ hashes.
  const legacyHash = bcryptjs.hashSync(password, 4);
  for (const Model of [Users, Client]) {
    const account = new Model({ name: "Test", email: "user@example.com", password: legacyHash });
    assert.equal(await account.comparePassword(password), true);
    assert.equal(await account.comparePassword("incorrect password"), false);
  }
  const newHash = await bcrypt.hash(password, 4);
  assert.equal(await bcrypt.compare(password, newHash), true);
  assert.equal(bcryptjs.compareSync(password, newHash), true);
});

test("Nodemailer retains Gmail configuration and composes text/HTML messages offline", async () => {
  const gmail = nodemailer.createTransport({
    service: "Gmail",
    auth: { user: "noreply@example.com", pass: "test-only" },
  });
  assert.equal(gmail.transporter.options.host, "smtp.gmail.com");
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const mail = await transport.sendMail({
    from: '"Nexus" <noreply@example.com>',
    to: '"Test User" <user@example.com>',
    subject: "Nexus Verification Code",
    text: "Your verification code is 123456.",
    html: "<p>Your verification code is <strong>123456</strong>.</p>",
  });
  assert.deepEqual(mail.envelope, { from: "noreply@example.com", to: ["user@example.com"] });
  assert.match(mail.message.toString(), /multipart\/alternative/);
  assert.match(mail.message.toString(), /<strong>123456<\/strong>/);
});

test("image upload middleware preserves binary content and base64 conversion", { timeout: 2000 }, async () => {
  const contents = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
  const { req, error } = await parseUpload(upload, "image", contents);
  assert.ifError(error);
  assert.deepEqual(req.file.buffer, contents);
  let continued = false;
  convertToBase64(req, {}, () => { continued = true; });
  assert.equal(continued, true);
  assert.equal(req.fileBase64, `data:image/png;base64,${contents.toString("base64")}`);
});

test("image upload middleware rejects unexpected file fields", { timeout: 2000 }, async () => {
  const { error } = await parseUpload(upload, "unexpected", Buffer.from("test"));
  assert.equal(error.code, "LIMIT_UNEXPECTED_FILE");
});

test("delivery-proof uploads retain the 5 MB size limit", { timeout: 2000 }, async () => {
  const middleware = multer({ limits: { fileSize: 5 * 1024 * 1024 } }).single("deliveryProof");
  const accepted = await parseUpload(middleware, "deliveryProof", Buffer.from("proof"));
  assert.ifError(accepted.error);
  assert.equal(accepted.req.file.buffer.toString(), "proof");
  const rejected = await parseUpload(middleware, "deliveryProof", Buffer.alloc(5 * 1024 * 1024 + 1));
  assert.equal(rejected.error.code, "LIMIT_FILE_SIZE");
});

test("incomplete multipart uploads return an error", { timeout: 2000 }, async () => {
  const { error } = await parseUpload(upload, "image", Buffer.from("truncated"), false);
  assert.ok(error instanceof Error);
});
