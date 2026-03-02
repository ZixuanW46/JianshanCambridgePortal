# Jianshan Scholarship — Application Form Requirements Specification

> **Version:** 1.0  
> **Date:** 2 March 2026  
> **Purpose:** 提供给技术工程师的完整实现文档，包含所有问题文案、输入类型、交互逻辑与功能需求。

---

## 全局功能需求

| ID | 需求 | 说明 |
|----|------|------|
| G-1 | **分 Section 展示** | 表单分 5 个 Section，建议采用多步表单（multi-step form）或锚点导航，顶部显示进度条，标注 "Section X of 5" |
| G-2 | **进度保存** | 用户可保存草稿，下次登录后继续编辑 |
| G-3 | **校验反馈** | 所有必填项未填时阻止提交，并高亮提示；字数限制实时显示剩余字数 |
| G-4 | **响应式布局** | 表单需适配 Desktop + Tablet + Mobile |
| G-5 | **提交确认** | 提交后展示确认页面，并发送确认邮件至申请者填写的邮箱 |

---

## Section 1 — Personal Details

> 本节收集申请者的基本个人信息。所有字段均为**必填**。

### 字段清单

| # | 字段标签 | 输入类型 | 校验规则 | 备注 |
|---|---------|---------|---------|------|
| 1.1 | **Full Name** | 文本框 `<input type="text">` | 必填，非空 | |
| 1.2 | **Nationality** | 文本框 `<input type="text">` | 必填，非空 | 显示提示文字：*"If you hold multiple nationalities, please list all."* |
| 1.3 | **Date of Birth** | 日期选择器 `<input type="date">` | 必填，合法日期 | |
| 1.4 | **Phone Number** | 文本框 `<input type="tel">` | 必填，格式校验（接受国际号码格式） | 建议增加国家区号选择器 |
| 1.5 | **Personal Email** | 文本框 `<input type="email">` | 必填，邮箱格式校验 | |
| 1.6 | **Cambridge Email** | 文本框 `<input type="email">` | 必填，必须以 `@cam.ac.uk` 结尾 | 占位符 Placeholder: `abc123@cam.ac.uk` |
| 1.7 | **College** | 下拉选择 `<select>` | 必填 | 选项见[附录 A](#附录-a--college-列表) |
| 1.8 | **Subject / Programme** | 搜索式下拉选择 | 必填 | 选项见[附录 B](#附录-b--subject--programme-列表)；支持模糊搜索过滤；按学科分类分组显示（`<optgroup>`）；末尾有 "Other" 选项 |
| 1.8a | **Subject — Other (specify)** | 文本框 `<input type="text">` | 当 1.8 选择 "Other" 时必填 | **条件渲染**：仅在 1.8 选择 "Other" 时显示 |
| 1.9 | **Degree Level** | 下拉选择 `<select>` | 必填 | 选项：`Undergraduate` / `Master's` / `PhD` / `Postdoc` |
| 1.10 | **Year of Study** | 下拉选择 `<select>` | 必填 | 选项：`1st Year` / `2nd Year` / `3rd Year` / `4th Year` / `Master's` / `PhD` / `Postdoc` / `Other` |
| 1.10a | **Year of Study — Other (specify)** | 文本框 `<input type="text">` | 当 1.10 选择 "Other" 时必填 | **条件渲染**：仅在 1.10 选择 "Other" 时显示；Placeholder: *"Please specify your current year or stage of study"* |

### 功能需求

| ID | 需求 | 说明 |
|----|------|------|
| S1-1 | **搜索式下拉** | Subject 字段需实现可搜索的下拉菜单（如 `react-select` 或类似组件），用户输入关键词时实时过滤选项 |
| S1-2 | **分组标题** | Subject 下拉内选项按分类加标题分组：Sciences & Engineering / Medicine / Arts, Humanities & Social Sciences / Interdisciplinary & Other |
| S1-3 | **条件渲染** | 当 Subject 或 Year of Study 选择 "Other" 时，动态显示对应文本框 |

---

## Section 2 — About You

> 本节让申请者展示个人特质和过往经历。

### 问题清单

#### Q2.1 — Tell Us About Yourself

- **问题文案：**

  > **Tell us about yourself.**
  >
  > This is your chance to help us understand who you are beyond your academic profile. You may wish to touch on any of the following (but are not limited to):
  > - Academic achievements you're proud of
  > - Unique experiences that have shaped who you are
  > - Moments or accomplishments you're most proud of
  > - Personal qualities, interests, or anything else that helps us get to know you better

- **输入类型：** 多行文本框 `<textarea>`
- **字数限制：** 300 words max
- **必填：** ✅ 是
- **UI 要求：** 右下角实时显示 `XX / 300 words`

#### Q2.2 — Additional Materials (Optional)

- **问题文案：**

  > **Upload your CV or any additional material you'd like to share.** *(Optional)*

- **输入类型：** 文件上传 `<input type="file">`
- **必填：** ❌ 否
- **文件限制：** 接受 PDF / DOC / DOCX / PNG / JPG，单文件最大 10MB

### 功能需求

| ID | 需求 | 说明 |
|----|------|------|
| S2-1 | **实时字数统计** | 按 word 计数（以空格分割），达到上限后阻止继续输入或变红提醒 |
| S2-2 | **文件上传** | 支持拖拽上传 + 点击上传；上传后显示文件名和删除按钮 |

---

## Section 3 — Teaching

> 本节了解申请者对 Academy 教学项目的兴趣和相关经历。

### Section 引言（仅展示，不含问题）

在本 Section 顶部显示以下介绍文字：

> *As part of the Jianshan Scholarship, selected participants will join our Academy programme, where you will have the opportunity to engage with local students through cultural exchange sessions. This is a core part of the experience, and we'd love to learn more about your interest and background in this area.*

### 问题清单

#### Q3.1 — Interest & Motivation

- **问题文案：**

  > **What draws you to the Academy programme, and why are you interested in engaging with students through cultural exchange?**

- **输入类型：** 多行文本框 `<textarea>`
- **字数限制：** 250 words max
- **必填：** ✅ 是

#### Q3.2 — Experience & Strengths

- **问题文案：**

  > **What relevant experience or strengths would you bring to the programme?**
  >
  > *This could include teaching, tutoring, mentoring, public speaking, workshop facilitation, or any experience working with young people.*

- **输入类型：** 多行文本框 `<textarea>`
- **字数限制：** 200 words max
- **必填：** ✅ 是

### 功能需求

| ID | 需求 | 说明 |
|----|------|------|
| S3-1 | **Section 引言** | 引言文字以视觉上区别于问题的方式呈现（如浅色背景卡片 / 斜体 / 不同字号） |
| S3-2 | **实时字数统计** | 同 S2-1 |

---

## Section 4 — Travel & China

> 本节了解申请者对旅行部分的期待和团队协作能力。

### 问题清单

#### Q4.1 — Excitement About China

- **问题文案：**

  > **What excites you most about visiting China?**

- **输入类型：** 多行文本框 `<textarea>`
- **字数限制：** 200 words max
- **必填：** ✅ 是

#### Q4.2 — Group Dynamics

- **问题文案：**

  > **As a group of 15–20 people, we'll be travelling together across China for around two weeks. What kind of energy and personality would you bring to the group?**
  >
  > *For example, you could tell us about your role in group settings, your travel style, or how you connect with others on the road.*

- **输入类型：** 多行文本框 `<textarea>`
- **字数限制：** 250 words max
- **必填：** ✅ 是

### 功能需求

| ID | 需求 | 说明 |
|----|------|------|
| S4-1 | **实时字数统计** | 同 S2-1 |

---

## Section 5 — Availability & Logistics

> 本节收集申请者的可用日期和其他后勤信息。

### 问题清单

#### Q5.1 — Availability Calendar

- **问题文案：**

  > **Please select all dates you are available in July and August 2026.**
  >
  > *You can click individual dates, drag to select a range, or use the quick-select options below. If your availability is uncertain, you may leave this blank for now.*

- **输入类型：** 自定义日历组件（详见下方功能需求）
- **必填：** ❌ 否

#### Q5.2 — Dietary Restrictions

- **问题文案：**

  > **Do you have any dietary restrictions or allergies?**

- **输入类型：** 多选复选框 + Other
- **选项：** `None` / `Vegetarian` / `Vegan` / `Halal` / `Gluten-free` / `Other`
- **Other 逻辑：** 选择 "Other" 后显示文本框供自填
- **必填：** ✅ 是（至少选一项，或选 None）

#### Q5.3 — Additional Notes

- **问题文案：**

  > **Is there anything else you would like us to know?** *(Optional)*

- **输入类型：** 多行文本框 `<textarea>`
- **字数限制：** 不限
- **必填：** ❌ 否

### 功能需求 — 日历组件

| ID | 需求 | 说明 |
|----|------|------|
| S5-1 | **双月日历** | 并排展示 July 2026 和 August 2026 两个月的日历网格 |
| S5-2 | **日期选择** | 支持点击单日切换选中/取消；支持拖动选择连续日期范围 |
| S5-3 | **选中高亮** | 已选日期使用高亮背景色（如蓝色 / 绿色），未选日期为默认色 |
| S5-4 | **快捷选项** | 日历上方放置三个复选框快捷按钮：|
|  |  | ☐ `I'm available for the entire month of July` → 勾选后自动选中 7 月全部日期 |
|  |  | ☐ `I'm available for the entire month of August` → 勾选后自动选中 8 月全部日期 |
|  |  | ☐ `I'm available for both July and August` → 勾选后自动选中全部日期 |
| S5-5 | **快捷联动** | 勾选 "both months" 时自动勾选上面两个月度选项；取消任一单日时自动取消对应月度和双月快捷选项 |
| S5-6 | **移动端适配** | 在移动端日历可上下堆叠（7 月在上，8 月在下），触摸支持点击和长按拖动 |

---

## 附录 A — College 列表

以下为剑桥大学 31 个学院，按字母排序，供下拉选择使用：

```
Christ's College
Churchill College
Clare College
Clare Hall
Corpus Christi College
Darwin College
Downing College
Emmanuel College
Fitzwilliam College
Girton College
Gonville and Caius College
Homerton College
Hughes Hall
Jesus College
King's College
Lucy Cavendish College
Magdalene College
Murray Edwards College
Newnham College
Pembroke College
Peterhouse
Queens' College
Robinson College
Selwyn College
Sidney Sussex College
St Catharine's College
St Edmund's College
St John's College
Trinity College
Trinity Hall
Wolfson College
```

---

## 附录 B — Subject / Programme 列表

### 分组：Sciences & Engineering

```
Aerospace and Aerothermal Engineering
Astronomy
Biochemistry
Biological and Biomedical Sciences
Biotechnology
Chemical Engineering
Chemistry
Civil, Structural and Environmental Engineering
Computer Science
Earth Sciences (Geology)
Electrical and Electronic Engineering
Energy Technologies
Engineering
Environmental Science / Policy
Genetics
Information and Computer Engineering
Manufacturing Engineering
Materials Science and Metallurgy
Mathematics
Mechanical Engineering
Natural Sciences
Nuclear Energy
Pathology
Pharmacology
Physics
Physiology, Development and Neuroscience
Plant Sciences
Psychology
Systems Biology
Veterinary Medicine
Zoology
```

### 分组：Medicine

```
Clinical Medicine
Medicine (Pre-clinical / Graduate)
Public Health
```

### 分组：Arts, Humanities & Social Sciences

```
Anglo-Saxon, Norse and Celtic
Archaeology
Architecture
Asian and Middle Eastern Studies
Classics / Classical Tripos
Criminology
Development Studies
Economics
Education
English
Film and Screen Studies
Geography
History
History and Philosophy of Science
History and Politics
History of Art
Human, Social and Political Sciences (HSPS)
International Relations
Land Economy
Law
Linguistics
Management Studies / MBA
Modern and Medieval Languages (MML)
Music
Philosophy
Politics and International Studies (POLIS)
Social Anthropology
Sociology
Theology, Religion and Philosophy of Religion
```

### 分组：Interdisciplinary & Other

```
Cognitive Science
Data Science
Digital Humanities
Finance / Financial Engineering
Machine Learning and Machine Intelligence
Multi-disciplinary Gender Studies
Planning, Growth and Regeneration
Real Estate Finance
Sustainability Leadership
Other → (显示文本框：Please specify your subject or programme)
```

---

## 数据结构参考

以下为建议的表单数据提交结构（JSON 格式），供后端工程师参考：

```json
{
  "section1_personal": {
    "full_name": "string",
    "nationality": "string",
    "date_of_birth": "YYYY-MM-DD",
    "phone_number": "string",
    "personal_email": "string",
    "cambridge_email": "string",
    "college": "string",
    "subject": "string",
    "subject_other": "string | null",
    "degree_level": "Undergraduate | Master's | PhD | Postdoc",
    "year_of_study": "string",
    "year_of_study_other": "string | null"
  },
  "section2_about_you": {
    "tell_us_about_yourself": "string (max 300 words)",
    "additional_file_url": "string | null"
  },
  "section3_teaching": {
    "interest_and_motivation": "string (max 250 words)",
    "experience_and_strengths": "string (max 200 words)"
  },
  "section4_travel": {
    "excitement_about_china": "string (max 200 words)",
    "group_dynamics": "string (max 250 words)"
  },
  "section5_availability": {
    "available_dates": ["YYYY-MM-DD", "..."],
    "dietary_restrictions": ["string"],
    "dietary_other": "string | null",
    "additional_notes": "string | null"
  }
}
```
