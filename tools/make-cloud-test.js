// 產生 _cloud_test.html：index.html 加上模擬的 Google 登入元件與 Drive／Sheets API（tools/cloud-mock.js），
// 用來在沒有真的 Google 帳號時測試試算表同步。用法見 docs/development.md。
// 產生的檔案已列在 .gitignore，測完刪掉。
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const mock = fs.readFileSync(path.join(__dirname, "cloud-mock.js"), "utf8");
const i = html.indexOf('<script>\n"use strict";');
if(i < 0) throw new Error("找不到主程式的 <script>");
fs.writeFileSync(path.join(root, "_cloud_test.html"), html.slice(0, i) + "<script>\n" + mock + "\n</script>\n" + html.slice(i));
console.log("已產生 _cloud_test.html");
