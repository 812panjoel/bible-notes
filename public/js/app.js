/**
 * 圣经笔记网页应用 - 主逻辑
 */

// 创建LaTeX解析器实例
const latexParser = new LatexParser();

document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const toc = document.getElementById('toc');
    const contentContainer = document.getElementById('content');
    const currentTitle = document.getElementById('current-title');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const fontSizeIncreaseBtn = document.getElementById('font-size-increase');
    const fontSizeDecreaseBtn = document.getElementById('font-size-decrease');
    const toggleThemeBtn = document.getElementById('toggle-theme');
    
    // 应用状态
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 16;
    let latexContent = ''; // 存储原始LaTeX内容
    let isDarkTheme = localStorage.getItem('theme') === 'dark';
    
    // 检查是否在本地文件系统中运行
    const isLocalFileSystem = window.location.protocol === 'file:';
    
    // 处理字体大小
    updateFontSize();
    
    // 处理主题
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // 初始化事件监听器
    initEventListeners();
    
    // 加载LaTeX内容
    if (isLocalFileSystem) {
        // 如果是通过file://协议打开的，直接显示上传文件选项
        showFileUploadPrompt();
    } else {
        // 通过HTTP/HTTPS协议访问，尝试fetch加载文件
        loadLatexContent();
    }
    
    /**
     * 初始化事件监听器
     */
    function initEventListeners() {
        // 移动端侧边栏切换
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
        
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
        
        // 字体大小调整
        fontSizeIncreaseBtn.addEventListener('click', () => {
            if (currentFontSize < 24) {
                currentFontSize += 1;
                updateFontSize();
            }
        });
        
        fontSizeDecreaseBtn.addEventListener('click', () => {
            if (currentFontSize > 12) {
                currentFontSize -= 1;
                updateFontSize();
            }
        });
        
        // 主题切换
        toggleThemeBtn.addEventListener('click', toggleTheme);
        
        // 搜索功能
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    /**
     * 更新字体大小
     */
    function updateFontSize() {
        document.documentElement.style.setProperty('--font-size-base', `${currentFontSize}px`);
        localStorage.setItem('fontSize', currentFontSize);
    }
    
    /**
     * 切换主题
     */
    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
        toggleThemeBtn.innerHTML = isDarkTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    }
    
    /**
     * 加载LaTeX内容
     */
    function loadLatexContent() {
        // 显示加载中状态
        toc.innerHTML = '<div class="loading">加载内容中...</div>';
        contentContainer.innerHTML = '<div class="loading">正在准备笔记内容...</div>';
        
        // 尝试多个可能的路径加载main.tex文件
        const possiblePaths = ['./main.tex', '../main.tex', '../../main.tex'];
        
        function tryLoadFile(pathIndex) {
            if (pathIndex >= possiblePaths.length) {
                // 所有路径都尝试失败，提供更友好的错误信息和解决方案
                toc.innerHTML = '<div class="error">加载目录失败</div>';
                contentContainer.innerHTML = `
                    <div class="error-message">
                        <h2>加载失败</h2>
                        <p>无法加载笔记内容。请确保main.tex文件存在并可访问。</p>
                        <p>您可以尝试以下解决方案：</p>
                        <ol>
                            <li>
                                <strong>使用本地服务器（推荐）：</strong>
                                <ul>
                                    <li>使用Python: <code>python -m http.server</code></li>
                                    <li>使用Node.js: <code>npx http-server</code></li>
                                    <li>使用VS Code的Live Server扩展</li>
                                </ul>
                            </li>
                            <li>
                                <strong>手动加载文件：</strong>
                                <div class="file-upload">
                                    <label for="file-input">选择main.tex文件：</label>
                                    <input type="file" id="file-input" accept=".tex">
                                </div>
                            </li>
                        </ol>
                        <p>详细说明请参阅README.md文件。</p>
                    </div>
                `;
                
                // 添加文件上传功能
                const fileInput = document.getElementById('file-input');
                fileInput?.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            latexContent = e.target.result;
                            renderTableOfContents();
                            
                            // 清除加载状态
                            contentContainer.innerHTML = `
                                <div class="success-message">
                                    <h2>加载成功</h2>
                                    <p>笔记内容已成功加载。请从左侧目录选择一篇笔记开始阅读。</p>
                                    <div class="scripture-quote">
                                        <blockquote>
                                            "惟喜爱耶和华的律法，昼夜思想，这人便为有福。"
                                            <cite>— 诗篇 1:2</cite>
                                        </blockquote>
                                    </div>
                                </div>
                            `;
                        };
                        reader.readAsText(file);
                    }
                });
                
                return;
            }
            
            fetch(possiblePaths[pathIndex])
                .then(response => {
                    if (!response.ok) {
                        throw new Error('文件不存在');
                    }
                    return response.text();
                })
                .then(content => {
                    latexContent = content;
                    renderTableOfContents();
                    
                    // 清除加载状态
                    contentContainer.innerHTML = `
                        <div class="welcome-message">
                            <h2>欢迎阅读圣经诗篇笔记</h2>
                            <p>请从左侧目录选择一篇诗篇开始阅读，或使用搜索功能查找特定内容。</p>
                            <div class="scripture-quote">
                                <blockquote>
                                    "惟喜爱耶和华的律法，昼夜思想，这人便为有福。"
                                    <cite>— 诗篇 1:2</cite>
                                </blockquote>
                            </div>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error(`尝试路径 ${possiblePaths[pathIndex]} 失败:`, error);
                    // 尝试下一个路径
                    tryLoadFile(pathIndex + 1);
                });
        }
        
        // 开始尝试加载
        tryLoadFile(0);
    }
    
    /**
     * 渲染目录
     */
    function renderTableOfContents() {
        if (!latexContent) {
            toc.innerHTML = '<div class="error">无法加载目录</div>';
            return;
        }
        
        const tocItems = latexParser.extractTableOfContents(latexContent);
        
        if (tocItems.length === 0) {
            toc.innerHTML = '<div class="error">未找到目录内容</div>';
            return;
        }
        
        let tocHTML = '';
        
        tocItems.forEach(section => {
            tocHTML += `
                <div class="toc-section">
                    <div class="toc-section-title" data-id="${section.id}">
                        ${section.title}
                        ${section.subsections.length > 0 ? '<i class="fas fa-chevron-down"></i>' : ''}
                    </div>
                    ${section.subsections.length > 0 ? `
                        <div class="toc-subsections">
                            ${section.subsections.map(subsection => `
                                <div class="toc-subsection">
                                    <a href="#" class="toc-link" data-parent-id="${section.id}" data-id="${subsection.id}">
                                        ${subsection.title}
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        toc.innerHTML = tocHTML;
        
        // 为目录项添加点击事件
        document.querySelectorAll('.toc-section-title').forEach(title => {
            title.addEventListener('click', () => {
                const sectionId = title.getAttribute('data-id');
                loadSection(sectionId);
                
                // 关闭移动端侧边栏
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
        
        document.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const parentId = link.getAttribute('data-parent-id');
                const subsectionId = link.getAttribute('data-id');
                loadSection(parentId, subsectionId);
                
                // 关闭移动端侧边栏
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }
    
    /**
     * 加载特定章节
     * @param {string} sectionId - 章节ID
     * @param {string} subsectionId - 子章节ID（可选）
     */
    function loadSection(sectionId, subsectionId = null) {
        if (!latexContent) {
            contentContainer.innerHTML = '<div class="error">无法加载内容</div>';
            return;
        }
        
        // 获取章节内容
        const sectionContent = latexParser.getSectionContent(sectionId, latexContent);
        const allSections = latexParser.extractTableOfContents(latexContent);
        const section = allSections.find(s => s.id === sectionId);
        
        if (!section) {
            contentContainer.innerHTML = '<div class="error">未找到章节内容</div>';
            return;
        }
        
        // 更新标题
        currentTitle.textContent = section.title;
        
        // 显示内容
        contentContainer.innerHTML = `<div class="note-content">${sectionContent}</div>`;
        
        // 如果有指定子章节，滚动到相应位置
        if (subsectionId) {
            const subsection = section.subsections.find(s => s.id === subsectionId);
            if (subsection) {
                const heading = Array.from(contentContainer.querySelectorAll('h3')).find(
                    h => h.textContent.trim() === subsection.title
                );
                
                if (heading) {
                    setTimeout(() => {
                        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        }
        
        // 高亮当前选中的目录项
        document.querySelectorAll('.toc-section-title, .toc-link').forEach(item => {
            item.classList.remove('active');
        });
        
        const sectionTitle = document.querySelector(`.toc-section-title[data-id="${sectionId}"]`);
        if (sectionTitle) {
            sectionTitle.classList.add('active');
        }
        
        if (subsectionId) {
            const subsectionLink = document.querySelector(`.toc-link[data-parent-id="${sectionId}"][data-id="${subsectionId}"]`);
            if (subsectionLink) {
                subsectionLink.classList.add('active');
            }
        }
        
        // 重新初始化MathJax以处理新内容中的数学公式
        if (window.MathJax) {
            window.MathJax.typeset();
        }
    }
    
    /**
     * 执行搜索
     */
    function performSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            alert('请输入搜索关键词');
            return;
        }
        
        if (!latexContent) {
            alert('内容尚未加载完成，请稍后再试');
            return;
        }
        
        const searchResults = latexParser.searchContent(query, latexContent);
        
        if (searchResults.length === 0) {
            contentContainer.innerHTML = `
                <div class="search-results">
                    <h2>搜索结果</h2>
                    <p>未找到与"${query}"相关的内容</p>
                </div>
            `;
            return;
        }
        
        let resultsHTML = `
            <div class="search-results">
                <h2>搜索结果</h2>
                <p>找到 ${searchResults.length} 个与"${query}"相关的结果：</p>
                <div class="results-list">
        `;
        
        searchResults.forEach(result => {
            resultsHTML += `
                <div class="result-item" data-section-id="${result.id}" ${result.parentId ? `data-parent-id="${result.parentId}"` : ''}>
                    <h3>${result.title}</h3>
                    ${result.context ? `<p class="result-context">${result.context}</p>` : ''}
                    <button class="view-btn">查看</button>
                </div>
            `;
        });
        
        resultsHTML += `
                </div>
            </div>
        `;
        
        contentContainer.innerHTML = resultsHTML;
        currentTitle.textContent = `搜索"${query}"的结果`;
        
        // 为搜索结果添加点击事件
        document.querySelectorAll('.result-item .view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const resultItem = btn.closest('.result-item');
                const sectionId = resultItem.getAttribute('data-section-id');
                const parentId = resultItem.getAttribute('data-parent-id');
                
                if (parentId) {
                    loadSection(parentId, sectionId.replace(`${parentId}-`, ''));
                } else {
                    loadSection(sectionId);
                }
            });
        });
    }

    /**
     * 显示文件上传提示
     */
    function showFileUploadPrompt() {
        toc.innerHTML = '<div class="error">等待文件加载</div>';
        contentContainer.innerHTML = `
            <div class="error-message">
                <h2>需要加载文件</h2>
                <p>检测到您正在通过本地文件系统访问此应用。由于浏览器安全限制，无法自动加载main.tex文件。</p>
                <p>请选择以下其中一种方式继续：</p>
                <ol>
                    <li>
                        <strong>手动选择文件：</strong>
                        <div class="file-upload">
                            <label for="file-input">选择main.tex文件：</label>
                            <input type="file" id="file-input" accept=".tex">
                        </div>
                    </li>
                    <li>
                        <strong>使用本地服务器（推荐）：</strong>
                        <ul>
                            <li>使用Python: <code>python -m http.server</code></li>
                            <li>使用Node.js: <code>npx http-server</code></li>
                            <li>使用VS Code的Live Server扩展</li>
                        </ul>
                        <p>然后通过本地服务器提供的URL访问应用（如http://localhost:8000）</p>
                    </li>
                </ol>
            </div>
        `;
        
        // 添加文件上传功能
        const fileInput = document.getElementById('file-input');
        fileInput?.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    latexContent = e.target.result;
                    renderTableOfContents();
                    
                    // 清除加载状态
                    contentContainer.innerHTML = `
                        <div class="success-message">
                            <h2>加载成功</h2>
                            <p>笔记内容已成功加载。请从左侧目录选择一篇笔记开始阅读。</p>
                            <div class="scripture-quote">
                                <blockquote>
                                    "惟喜爱耶和华的律法，昼夜思想，这人便为有福。"
                                    <cite>— 诗篇 1:2</cite>
                                </blockquote>
                            </div>
                        </div>
                    `;
                };
                reader.readAsText(file);
            }
        });
    }
}); 