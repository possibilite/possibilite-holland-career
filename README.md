# 心向何方 · 霍兰德职业兴趣测评网站

一个温和、治愈风格的霍兰德（Holland SDS）职业兴趣测评网站。题目自动打乱、分页作答、自动计分，
并生成可保存为 PDF 的个性化报告。面向迷茫的年轻人，也让长辈毫不费力地完成。

## 功能

- **六部分完整测评**：理想职业填空 → 180 道是否题（第二/三/四部分，打乱顺序）→ 第五部分能力自评（1–7 分）。
- **打乱出题 + 分页**：所有是否题随机混排，每页 6 题，含进度条与「上一步 / 下一步」。
- **自动计分**：各 R/I/A/S/E/C 型得分 =（第二+三+四部分「是」计数）+ 第五A评分 + 第五B评分，得出前三高的霍兰德代码。
- **个性化报告**：六型解读（优势 / 适合职业 / 适合环境 / 需规避方向），并与你一开始写下的理想职业对照。
- **保存 PDF**：一键调用浏览器打印，选择「另存为 PDF」即可保存或分享。
- **断点续答**：进度自动存在浏览器本地（localStorage），关掉再打开可继续。
- **邮件发送**：已预留接口（见下），当前版本先用 PDF 保存。

## 项目结构

```
holland-test/
├── index.html          # 页面骨架
├── css/styles.css       # 治愈风样式（莎草绿 / 奶油 / 裸粉）
└── js/
    ├── questions.js     # 题库数据（由原始 Excel 自动导出，请勿改动顺序/type）
    ├── report.js        # 六型报告文案与组合解读
    └── app.js           # 流程、计分、报告渲染、PDF、邮件接口
```

## 本地预览

纯静态项目，无需构建。任选其一：

```bash
# 方式一：Python
cd holland-test && python3 -m http.server 8080
# 浏览器打开 http://localhost:8080

# 方式二：Node
npx serve holland-test
```

> 直接双击 index.html 也能打开，但用本地服务器打开更稳妥（避免个别浏览器的本地文件限制）。

## 部署上线（任选）

- **Vercel / Netlify**：拖入 `holland-test` 文件夹即可，无需任何配置。
- **GitHub Pages**：把文件夹推到仓库，在 Settings → Pages 选择分支根目录。
- 任意静态托管 / 对象存储（OSS、COS、S3）均可。

## 接入「发送到邮箱」

报告页已有邮箱输入框与按钮，逻辑入口在 `js/app.js` 的 `sendReportByEmail(email, scores)`。

**方案 A：EmailJS（纯前端，最快）**
1. 注册 https://www.emailjs.com ，创建 Email Service 与 Template。
2. 在 `index.html` 引入 SDK：
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser/dist/email.min.js"></script>
   <script>emailjs.init("你的 PUBLIC_KEY");</script>
   ```
3. 在 `sendReportByEmail` 中替换为：
   ```js
   emailjs.send("service_id","template_id",{
     to_email: email,
     code: scores.top3.join(""),
     report_html: document.querySelector(".card").innerHTML
   }).then(()=>alert("已发送到 "+email));
   ```
4. 把按钮的 `disabled` 去掉（在 `renderResults` 中 `id="emailBtn"` 处）。

**方案 B：自建后端**
部署一个 `/api/send-report` 接口（Node + Resend/SendGrid 等），在 `sendReportByEmail` 里 `fetch` 调用即可。
建议后端用无头浏览器把报告渲染成 PDF 附件发送，体验最佳。

## 关于测评

基于霍兰德（John Holland）职业兴趣理论的 RIASEC 六型：实际型(R)、研究型(I)、艺术型(A)、社会型(S)、企业型(E)、常规型(C)。
题库源自所提供的 Excel 原表，仅供自我探索参考，非专业职业测评结论。
