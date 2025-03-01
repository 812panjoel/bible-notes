/**
 * 圣经笔记网页应用 - 主逻辑 (JSON版本)
 * 
 * 这个版本的app.js直接加载预处理好的JSON数据，
 * 而不是每次都解析TEX文件，提高了加载速度和可靠性。
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const collapseSidebarBtn = document.getElementById('collapse-sidebar');
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
    let bibleData = null; // 存储JSON数据
    let isDarkTheme = localStorage.getItem('theme') === 'dark';
    let isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    // 初始化侧边栏状态
    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }
    
    // 处理字体大小
    updateFontSize();
    
    // 处理主题
    if (isDarkTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // 初始化事件监听器
    initEventListeners();
    
    // 加载JSON数据
    loadBibleData();
    
    /**
     * 初始化事件监听器
     */
    function initEventListeners() {
        // 移动端侧边栏切换
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
        
        // 侧边栏折叠/展开 - 合并为一个按钮
        collapseSidebarBtn.addEventListener('click', () => {
            // 切换折叠状态
            isSidebarCollapsed = !isSidebarCollapsed;
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
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
     * 简化章节标题，提取诗篇编号
     * @param {string} title - 原始标题文本
     * @returns {string} 简化后的标题
     */
    function simplifyTitle(title) {
        // 匹配"诗篇第xx篇"或"诗篇 xx"格式的标题
        const match = title.match(/诗篇(?:第)?(\s*\d+)\s*(?:篇)?/i);
        if (match) {
            return `诗篇/${match[1].trim()}`;
        }
        return title;
    }
    
    /**
     * 清理内容，去掉多余的分隔符等
     * @param {string} content - 原始内容HTML
     * @returns {string} 清理后的内容
     */
    function cleanContent(content) {
        // 移除 %------- 类型的分隔符
        let cleaned = content.replace(/%-+/g, '');
        
        // 移除 \hspace{0.6cm} 和其他类似的 LaTeX 空格命令
        cleaned = cleaned.replace(/\\hspace\{\d+\.?\d*cm\}/g, ' ');
        
        // 移除多余的空行
        cleaned = cleaned.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');
        
        return cleaned;
    }
    
    /**
     * 加载JSON数据
     */
    function loadBibleData() {
        // 显示加载中状态
        toc.innerHTML = '<div class="loading">加载内容中...</div>';
        contentContainer.innerHTML = '<div class="loading">正在准备笔记内容...</div>';
        
        // 首先尝试从localStorage读取数据
        const savedData = localStorage.getItem('bibleNotesData');
        if (savedData) {
            try {
                bibleData = JSON.parse(savedData);
                renderTableOfContents();
                
                // 显示成功加载的消息
                contentContainer.innerHTML = `
                    <div class="success-message glass-effect">
                        <h2 class="text-xl font-semibold mb-4">欢迎阅读圣经诗篇笔记</h2>
                        <p class="mb-3">笔记内容已从本地存储成功加载。请从左侧目录选择一篇诗篇开始阅读，或使用搜索功能查找特定内容。</p>
                        <div class="scripture-quote">
                            <blockquote>
                                "惟喜爱耶和华的律法，昼夜思想，这人便为有福。"
                                <cite>— 诗篇 1:2</cite>
                            </blockquote>
                        </div>
                        <div class="action-buttons mt-6">
                            <button id="export-json-btn" class="action-btn">
                                <i class="fas fa-download"></i> 导出JSON文件
                            </button>
                            <button id="clear-storage-btn" class="action-btn" style="background-color: #e74c3c;">
                                <i class="fas fa-trash"></i> 清除本地存储
                            </button>
                            <p class="note">数据已保存在浏览器中，下次打开无需重新加载文件</p>
                        </div>
                    </div>
                `;
                
                // 添加导出JSON功能
                document.getElementById('export-json-btn')?.addEventListener('click', () => {
                    exportJsonData();
                });
                
                // 添加清除存储功能
                document.getElementById('clear-storage-btn')?.addEventListener('click', () => {
                    if (confirm('确定要清除本地存储的数据吗？这将需要您重新加载JSON或TEX文件。')) {
                        localStorage.removeItem('bibleNotesData');
                        alert('本地数据已清除，页面将刷新');
                        window.location.reload();
                    }
                });
                
                return; // 直接返回，不再尝试加载外部文件
            } catch (error) {
                console.error('解析本地存储数据出错:', error);
                // 出错时继续执行后面的代码尝试其他加载方式
            }
        }
        
        // 尝试加载内置JSON数据
        const jsonPath = './bible-notes.json';
        
        fetch(jsonPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('无法加载数据文件');
                }
                return response.json();
            })
            .then(data => {
                bibleData = data;
                
                // 保存到localStorage
                try {
                    localStorage.setItem('bibleNotesData', JSON.stringify(bibleData));
                } catch (error) {
                    console.warn('无法保存到本地存储:', error);
                }
                
                renderTableOfContents();
                
                // 清除加载状态
                contentContainer.innerHTML = `
                    <div class="success-message glass-effect">
                        <h2 class="text-xl font-semibold mb-4">欢迎阅读圣经诗篇笔记</h2>
                        <p class="mb-3">笔记内容已成功加载。请从左侧目录选择一篇诗篇开始阅读，或使用搜索功能查找特定内容。</p>
                        <div class="scripture-quote">
                            <blockquote>
                                "惟喜爱耶和华的律法，昼夜思想，这人便为有福。"
                                <cite>— 诗篇 1:2</cite>
                            </blockquote>
                        </div>
                        <div class="action-buttons mt-6">
                            <button id="export-json-btn" class="action-btn">
                                <i class="fas fa-download"></i> 导出JSON文件
                            </button>
                            <p class="note">导出后可保存此文件，下次直接加载，避免重新处理</p>
                        </div>
                        <div class="storage-notice">
                            <i class="fas fa-info-circle"></i> 数据已自动保存到浏览器，下次访问无需重新加载
                        </div>
                    </div>
                `;
                
                // 添加导出JSON功能
                document.getElementById('export-json-btn')?.addEventListener('click', () => {
                    exportJsonData();
                });
            })
            .catch(error => {
                console.error('加载数据失败:', error);
                
                // 显示错误信息和备选上传方案
                toc.innerHTML = '<div class="error">加载目录失败</div>';
                contentContainer.innerHTML = `
                    <div class="error-message glass-effect">
                        <h2 class="text-xl font-semibold mb-4">加载失败</h2>
                        <p class="mb-3">无法加载笔记内容。在线数据文件不可用或格式不正确。</p>
                        <p class="mb-4">您可以尝试以下解决方案：</p>
                        <ol class="space-y-4">
                            <li>
                                <strong>使用预处理JSON文件：</strong>
                                <div class="file-upload mt-2">
                                    <label for="json-input">选择bible-notes.json文件：</label>
                                    <input type="file" id="json-input" accept=".json">
                                </div>
                            </li>
                            <li>
                                <strong>手动加载TEX文件：</strong>
                                <div class="file-upload mt-2">
                                    <label for="tex-input">选择main.tex文件：</label>
                                    <input type="file" id="tex-input" accept=".tex">
                                </div>
                                <p class="note">注：这将在浏览器中处理TEX文件，可能较慢。</p>
                            </li>
                        </ol>
                    </div>
                `;
                
                // 添加JSON文件上传功能
                const jsonInput = document.getElementById('json-input');
                jsonInput?.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            try {
                                bibleData = JSON.parse(e.target.result);
                                
                                // 保存到localStorage
                                try {
                                    localStorage.setItem('bibleNotesData', JSON.stringify(bibleData));
                                } catch (storageError) {
                                    console.warn('无法保存到本地存储:', storageError);
                                }
                                
                                renderTableOfContents();
                                
                                // 清除加载状态
                                contentContainer.innerHTML = `
                                    <div class="success-message glass-effect">
                                        <h2 class="text-xl font-semibold mb-4">加载成功</h2>
                                        <p class="mb-3">笔记内容已成功加载并保存到浏览器存储中。请从左侧目录选择一篇笔记开始阅读。</p>
                                        <div class="storage-notice">
                                            <i class="fas fa-info-circle"></i> 下次访问时将自动加载，无需再次选择文件
                                        </div>
                                    </div>
                                `;
                            } catch (error) {
                                alert('JSON文件格式不正确，请确保使用正确的bible-notes.json文件');
                            }
                        };
                        reader.readAsText(file);
                    }
                });
                
                // 添加TEX文件上传功能（需要页面中引入parser.js）
                const texInput = document.getElementById('tex-input');
                texInput?.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            try {
                                const latexContent = e.target.result;
                                // 使用在线版本的解析器
                                if (typeof LatexParser === 'undefined') {
                                    alert('无法找到LatexParser，请确保已加载parser.js');
                                    return;
                                }
                                
                                const parser = new LatexParser();
                                const toc = parser.extractTableOfContents(latexContent);
                                
                                // 创建bibleData对象
                                bibleData = {
                                    toc: toc,
                                    sections: {}
                                };
                                
                                // 为每个章节提取内容
                                toc.forEach(section => {
                                    const sectionId = section.id;
                                    const sectionContent = parser.getSectionContent(sectionId, latexContent);
                                    // 在这里清理内容
                                    bibleData.sections[sectionId] = cleanContent(sectionContent);
                                });
                                
                                // 保存到localStorage
                                try {
                                    localStorage.setItem('bibleNotesData', JSON.stringify(bibleData));
                                } catch (storageError) {
                                    console.warn('无法保存到本地存储:', storageError);
                                }
                                
                                renderTableOfContents();
                                
                                // 清除加载状态
                                contentContainer.innerHTML = `
                                    <div class="success-message glass-effect">
                                        <h2 class="text-xl font-semibold mb-4">加载成功</h2>
                                        <p class="mb-3">TEX文件已成功解析并保存到浏览器存储中。请从左侧目录选择一篇笔记开始阅读。</p>
                                        <div class="action-buttons mt-6">
                                            <button id="export-json-btn" class="action-btn">
                                                <i class="fas fa-download"></i> 导出为JSON文件
                                            </button>
                                            <p class="note">导出后下次可直接加载此JSON文件，无需再次处理TEX文件</p>
                                        </div>
                                        <div class="storage-notice">
                                            <i class="fas fa-info-circle"></i> 下次访问时将自动加载，无需再次选择文件
                                        </div>
                                    </div>
                                `;
                                
                                // 添加导出JSON功能
                                document.getElementById('export-json-btn')?.addEventListener('click', () => {
                                    exportJsonData();
                                });
                            } catch (error) {
                                alert('TEX文件处理失败: ' + error.message);
                            }
                        };
                        reader.readAsText(file);
                    }
                });
            });
    }
    
    /**
     * 渲染目录
     */
    function renderTableOfContents() {
        if (!bibleData || !bibleData.toc) {
            toc.innerHTML = '<div class="error">无法加载目录</div>';
            return;
        }
        
        const tocItems = bibleData.toc;
        
        if (tocItems.length === 0) {
            toc.innerHTML = '<div class="error">未找到目录内容</div>';
            return;
        }
        
        let tocHTML = '';
        
        tocItems.forEach(section => {
            // 简化显示的标题
            const simplifiedTitle = simplifyTitle(section.title);
            
            tocHTML += `
                <div class="toc-section">
                    <div class="toc-section-title" data-id="${section.id}" data-original-title="${section.title}">
                        ${simplifiedTitle}
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
            // 注意：我们拆分标题点击事件为两个部分 - 切换展开和内容加载
            title.addEventListener('click', (e) => {
                // 首先检查是否点击的是下拉图标
                const isChevronClick = e.target.closest('.fas');
                
                if (isChevronClick) {
                    // 只处理展开/收缩
                    e.stopPropagation(); // 阻止冒泡
                    toggleTocSubsection(title);
                } else {
                    // 点击的是标题文本，加载内容
                    const sectionId = title.getAttribute('data-id');
                    loadSection(sectionId);
                    
                    // 关闭移动端侧边栏
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                    }
                }
            });
            
            // 确保下拉图标可点击
            const chevron = title.querySelector('.fas');
            if (chevron) {
                chevron.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleTocSubsection(title);
                });
            }
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
     * 切换目录项的展开/折叠状态
     * @param {HTMLElement} titleElement - 目录标题元素
     */
    function toggleTocSubsection(titleElement) {
        // 检查是否有子目录
        const subsections = titleElement.nextElementSibling;
        if (!subsections || !subsections.classList.contains('toc-subsections')) {
            return;
        }
        
        // 切换展开状态
        const isExpanded = titleElement.classList.toggle('expanded');
        
        // 改变图标
        const icon = titleElement.querySelector('.fas');
        if (icon) {
            icon.className = isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        }
    }
    
    /**
     * 加载特定章节
     * @param {string} sectionId - 章节ID
     * @param {string} subsectionId - 子章节ID（可选）
     */
    function loadSection(sectionId, subsectionId = null) {
        if (!bibleData || !bibleData.sections) {
            contentContainer.innerHTML = '<div class="error">无法加载内容</div>';
            return;
        }
        
        // 获取章节内容
        let sectionContent = bibleData.sections[sectionId];
        if (!sectionContent) {
            contentContainer.innerHTML = '<div class="error">未找到章节内容</div>';
            return;
        }
        
        // 清理内容，移除多余的分隔符等
        sectionContent = cleanContent(sectionContent);
        
        const section = bibleData.toc.find(s => s.id === sectionId);
        if (!section) {
            contentContainer.innerHTML = '<div class="error">未找到章节信息</div>';
            return;
        }
        
        // 更新标题 - 使用原始标题
        const sectionTitle = document.querySelector(`.toc-section-title[data-id="${sectionId}"]`);
        const originalTitle = sectionTitle ? sectionTitle.getAttribute('data-original-title') : section.title;
        currentTitle.textContent = simplifyTitle(originalTitle);
        
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
        
        if (!bibleData || !bibleData.toc) {
            alert('内容尚未加载完成，请稍后再试');
            return;
        }
        
        // 简单搜索实现
        const searchResults = [];
        
        // 规范化搜索关键词
        const normalizedQuery = query.toLowerCase();
        
        // 在标题中搜索
        bibleData.toc.forEach(section => {
            // 搜索章节标题
            if (section.title.toLowerCase().includes(normalizedQuery)) {
                searchResults.push({
                    id: section.id,
                    title: simplifyTitle(section.title),
                    originalTitle: section.title,
                    match: 'title',
                    level: 1
                });
            }
            
            // 搜索子章节标题
            section.subsections.forEach(subsection => {
                if (subsection.title.toLowerCase().includes(normalizedQuery)) {
                    searchResults.push({
                        id: `${section.id}-${subsection.id}`,
                        title: `${simplifyTitle(section.title)} > ${subsection.title}`,
                        originalTitle: `${section.title} > ${subsection.title}`,
                        match: 'subtitle',
                        level: 2,
                        parentId: section.id
                    });
                }
            });
            
            // 搜索章节内容
            const sectionContent = bibleData.sections[section.id];
            if (sectionContent) {
                const textContent = sectionContent.replace(/<[^>]+>/g, ' ');
                
                if (textContent.toLowerCase().includes(normalizedQuery)) {
                    // 如果标题已经匹配，则不重复添加
                    if (!searchResults.some(r => r.id === section.id && r.match === 'title')) {
                        // 提取上下文
                        const index = textContent.toLowerCase().indexOf(normalizedQuery);
                        const contextStart = Math.max(0, index - 50);
                        const contextEnd = Math.min(textContent.length, index + normalizedQuery.length + 50);
                        const context = textContent.substring(contextStart, contextEnd).replace(/^\S*\s/, '').replace(/\s\S*$/, '');
                        
                        searchResults.push({
                            id: section.id,
                            title: simplifyTitle(section.title),
                            originalTitle: section.title,
                            match: 'content',
                            level: 1,
                            context: '...' + context + '...'
                        });
                    }
                }
            }
        });
        
        if (searchResults.length === 0) {
            contentContainer.innerHTML = `
                <div class="search-results">
                    <h2 class="text-xl font-semibold mb-4">搜索结果</h2>
                    <p>未找到与"${query}"相关的内容</p>
                </div>
            `;
            return;
        }
        
        let resultsHTML = `
            <div class="search-results">
                <h2 class="text-xl font-semibold mb-4">搜索结果</h2>
                <p class="mb-3">找到 ${searchResults.length} 个与"${query}"相关的结果：</p>
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
     * 导出JSON数据到文件
     */
    function exportJsonData() {
        if (!bibleData) {
            alert('没有可导出的数据');
            return;
        }
        
        try {
            // 创建数据URL
            const jsonString = JSON.stringify(bibleData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // 创建一个临时下载链接
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'bible-notes.json';
            
            // 模拟点击下载
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // 清理
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
            
            alert('JSON文件已导出，下次可直接加载此文件');
        } catch (error) {
            console.error('导出JSON失败:', error);
            alert('导出失败: ' + error.message);
        }
    }
}); 