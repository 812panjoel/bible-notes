# 圣经笔记网页应用

这是一个用于查看圣经笔记的网页应用，支持手机和电脑浏览。应用从LaTeX格式的main.tex文件中提取内容，并以美观易读的方式呈现。

## 特性

- 📱 响应式设计，支持手机和电脑
- 🌙 明暗主题切换
- 🔍 内容搜索功能
- 📖 完整的目录导航
- 📝 优雅的笔记展示
- 🔤 字体大小调整

## 使用方法

### 方法一：直接打开HTML文件

1. 确保 `main.tex` 文件位于 `Bible-Notes-App` 目录中（或者手动复制）
2. 在浏览器中打开 `index.html` 文件

### 方法二：使用本地服务器（推荐）

由于浏览器安全限制，直接打开HTML文件可能无法加载main.tex文件。推荐使用以下方法：

1. 如果你有Node.js环境：
   ```
   npm install -g serve
   serve Bible-Notes-App
   ```

2. 如果你有Python环境：
   ```
   # Python 3
   python -m http.server
   
   # Python 2
   python -m SimpleHTTPServer
   ```

3. 然后在浏览器中访问提示的URL（通常是 http://localhost:8000 或 http://localhost:5000）

## 自定义

- **修改笔记内容**：更新main.tex文件
- **调整样式**：修改css/styles.css文件
- **增强功能**：修改js/app.js和js/parser.js文件

## 技术说明

- 纯静态HTML/CSS/JavaScript，无需后端服务器
- 使用MathJax处理数学公式
- 自定义LaTeX解析器用于将LaTeX格式转换为HTML

## 注意事项

- 应用需要使用现代浏览器（Chrome、Firefox、Safari、Edge等）
- 在移动设备上，建议使用Chrome或Safari获得最佳体验

## 运行应用程序

### 直接打开HTML文件的限制

如果直接在浏览器中打开`index.html`文件，由于浏览器的安全限制，JavaScript无法直接加载本地的`main.tex`文件，即使该文件与`index.html`在同一目录下。这会导致出现"加载失败"的错误提示：

```
加载失败
无法加载笔记内容。请确保main.tex文件存在并可访问。
您可以将main.tex文件复制到应用程序目录，然后刷新页面。
```

### 解决方案：使用本地服务器

要正确运行应用程序，您需要使用本地开发服务器来提供这些文件。以下是几种简单的方法：

#### 方法1：使用Python自带的HTTP服务器

如果您已安装Python，可以在命令行中执行：

```bash
# Python 3.x
cd 到应用程序目录
python -m http.server

# Python 2.x
cd 到应用程序目录
python -m SimpleHTTPServer
```

然后在浏览器中访问 `http://localhost:8000`

#### 方法2：使用Node.js和http-server

如果您已安装Node.js，可以使用http-server包：

```bash
# 全局安装http-server
npm install -g http-server

# 启动服务器
cd 到应用程序目录
http-server
```

然后在浏览器中访问 `http://localhost:8080`

#### 方法3：使用VS Code的Live Server扩展

1. 在VS Code中安装"Live Server"扩展
2. 在VS Code中打开项目文件夹
3. 右键点击`index.html`文件，选择"Open with Live Server"

这样应用就能正确加载main.tex文件，显示笔记内容了。 

## 优化版本和TEX预处理

为了避免每次启动应用都需要重新解析TEX文件，我们提供了一种预处理方案，可以将TEX文件一次性转换为JSON格式，然后直接加载。这种方式有如下优势：

1. **更快的加载速度**：无需每次都解析TEX文件
2. **离线可用**：减少对外部资源的依赖
3. **更好的兼容性**：避免因网络问题导致的加载失败

### 使用预处理功能

#### 方法1: 使用浏览器内导出功能（推荐，无需Node.js）

1. 在浏览器中打开`index-optimized.html`文件
2. 通过"选择main.tex文件"上传您的TEX文件
3. 文件成功加载后，点击"导出JSON文件"按钮
4. 保存生成的`bible-notes.json`文件到安全位置
5. 下次使用时，可以直接上传此JSON文件，无需再处理TEX文件

#### 方法2: 使用Node.js转换脚本

首先，您需要安装Node.js，然后运行以下命令：

```bash
# 进入项目目录
cd Bible-Notes-App

# 安装必要的依赖
npm install fs path

# 执行转换脚本
node js/convert-tex.js
```

这将生成一个`bible-notes.json`文件，其中包含所有预处理好的内容。

#### 步骤3: 使用优化版本的应用

您可以通过以下两种方式之一使用优化版本：

1. **直接打开优化版本**：
   在浏览器中打开`index-optimized.html`文件

2. **替换原始文件**：
   ```bash
   # 备份原始app.js
   mv js/app.js js/app-original.js
   
   # 使用优化版本
   cp js/app-json.js js/app.js
   ```

### 解决"polyfill.io连接失败"和"latexParser重复声明"问题

优化版本还解决了以下常见问题：

- **polyfill.io连接失败**：优化版本不再依赖外部polyfill
- **latexParser重复声明**：修复了JavaScript变量重复声明的问题
- **离线使用**：添加了图标和样式的本地备用方案

如果您仍然遇到任何问题，可以尝试：

1. 在Node.js环境中预处理TEX文件
2. 使用生成的JSON文件
3. 在优化版本的应用中加载JSON文件 