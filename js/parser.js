/**
 * LaTeX解析器 - 用于将LaTeX格式的圣经笔记转换为HTML
 */

class LatexParser {
    constructor() {
        // LaTeX命令对应的HTML标签映射
        this.commandMap = {
            'section': 'h2',
            'subsection': 'h3',
            'subsubsection': 'h4',
            'paragraph': 'h5',
            'textbf': 'strong',
            'textit': 'em',
            'underline': 'u'
        };
        
        // 预加载的诗篇内容
        this.psalmsContent = {};
        
        // 正则表达式
        this.sectionRegex = /\\section\{(.*?)\}/g;
        this.subsectionRegex = /\\subsection\*?\{(.*?)\}/g;
        this.subsubsectionRegex = /\\subsubsection\*?\{(.*?)\}/g;
        this.paragraphRegex = /\\paragraph\*?\{(.*?)\}/g;
        this.textbfRegex = /\\textbf\{(.*?)\}/g;
        this.textitRegex = /\\textit\{(.*?)\}/g;
        this.underlineRegex = /\\underline\{(.*?)\}/g;
        this.beginItemizeRegex = /\\begin\{itemize\}/g;
        this.endItemizeRegex = /\\end\{itemize\}/g;
        this.itemRegex = /\\item\s+(.*?)(?=\\item|\\end\{itemize\}|$)/gs;
        this.bibleVerseRegex = /"(.*?)"\s*\（(.*?)\）/g;
    }

    /**
     * 将LaTeX文本解析为HTML
     * @param {string} latexText - 原始LaTeX文本
     * @returns {string} - 转换后的HTML
     */
    parseLatex(latexText) {
        if (!latexText) return '';
        
        // 移除LaTeX文档的头尾
        let content = latexText
            .replace(/\\documentclass.*?\\begin\{document\}/s, '')
            .replace(/\\end\{document\}.*?$/s, '');
        
        // 处理章节标题
        content = content.replace(this.sectionRegex, '<h2>$1</h2>');
        content = content.replace(this.subsectionRegex, '<h3>$1</h3>');
        content = content.replace(this.subsubsectionRegex, '<h4>$1</h4>');
        content = content.replace(this.paragraphRegex, '<h5>$1</h5>');
        
        // 处理文本格式
        content = content.replace(this.textbfRegex, '<strong>$1</strong>');
        content = content.replace(this.textitRegex, '<em>$1</em>');
        content = content.replace(this.underlineRegex, '<u>$1</u>');
        
        // 处理列表
        content = content.replace(this.beginItemizeRegex, '<ul>');
        content = content.replace(this.endItemizeRegex, '</ul>');
        content = content.replace(this.itemRegex, '<li>$1</li>');
        
        // 处理换行和段落
        content = content.replace(/\n\n+/g, '</p><p>');
        content = content.replace(/\\newpage/g, '<hr>');
        
        // 处理圣经经文引用
        content = content.replace(this.bibleVerseRegex, '<blockquote class="bible-verse">"$1"<cite>— $2</cite></blockquote>');
        
        // 添加段落标签
        content = '<p>' + content + '</p>';
        
        // 清理多余的标签
        content = content.replace(/<p><h([2-5])>/g, '<h$1>');
        content = content.replace(/<\/h([2-5])><\/p>/g, '</h$1>');
        content = content.replace(/<p><ul>/g, '<ul>');
        content = content.replace(/<\/ul><\/p>/g, '</ul>');
        
        return content;
    }

    /**
     * 从完整的LaTeX文档中提取目录
     * @param {string} latexText - 原始LaTeX文本
     * @returns {Array} - 目录项数组
     */
    extractTableOfContents(latexText) {
        const toc = [];
        const sectionMatches = Array.from(latexText.matchAll(this.sectionRegex));
        
        sectionMatches.forEach(match => {
            const sectionTitle = match[1];
            const sectionId = this.generateId(sectionTitle);
            const section = {
                id: sectionId,
                title: sectionTitle,
                level: 1,
                subsections: []
            };
            
            // 找出当前section之后、下一个section之前的所有subsection
            const sectionStartIndex = match.index;
            const nextSectionMatch = sectionMatches.find(m => m.index > sectionStartIndex);
            const sectionEndIndex = nextSectionMatch ? nextSectionMatch.index : latexText.length;
            const sectionText = latexText.substring(sectionStartIndex, sectionEndIndex);
            
            // 提取子章节
            const subsectionMatches = Array.from(sectionText.matchAll(this.subsectionRegex));
            subsectionMatches.forEach(subMatch => {
                const subsectionTitle = subMatch[1];
                const subsectionId = this.generateId(subsectionTitle);
                section.subsections.push({
                    id: subsectionId,
                    title: subsectionTitle,
                    level: 2
                });
            });
            
            toc.push(section);
        });
        
        return toc;
    }

    /**
     * 生成用于HTML的ID
     * @param {string} text - 章节标题
     * @returns {string} - 用于HTML的ID
     */
    generateId(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * 获取特定诗篇章节的内容
     * @param {string} sectionId - 章节ID
     * @param {string} latexText - 原始LaTeX文本
     * @returns {string} - 章节HTML内容
     */
    getSectionContent(sectionId, latexText) {
        // 查找匹配的章节
        const allSections = this.extractTableOfContents(latexText);
        const section = allSections.find(s => s.id === sectionId);
        
        if (!section) return '<p>找不到此章节内容</p>';
        
        // 找到章节的开始和结束位置
        const sectionRegex = new RegExp(`\\\\section\\{${section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
        const match = sectionRegex.exec(latexText);
        
        if (!match) return '<p>无法解析章节内容</p>';
        
        const sectionStartIndex = match.index;
        const nextSectionMatch = allSections.find(s => s.id !== sectionId && latexText.indexOf(`\\section{${s.title}}`, sectionStartIndex) > -1);
        
        let sectionEndIndex;
        if (nextSectionMatch) {
            const nextSectionRegex = new RegExp(`\\\\section\\{${nextSectionMatch.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
            const nextMatch = nextSectionRegex.exec(latexText);
            sectionEndIndex = nextMatch ? nextMatch.index : latexText.length;
        } else {
            sectionEndIndex = latexText.indexOf('\\end{document}', sectionStartIndex);
            if (sectionEndIndex === -1) sectionEndIndex = latexText.length;
        }
        
        // 提取章节内容并解析
        const sectionText = latexText.substring(sectionStartIndex, sectionEndIndex);
        return this.parseLatex(sectionText);
    }

    /**
     * 搜索内容
     * @param {string} query - 搜索关键词
     * @param {string} latexText - 原始LaTeX文本
     * @returns {Array} - 搜索结果
     */
    searchContent(query, latexText) {
        if (!query || !latexText) return [];
        
        const results = [];
        const allSections = this.extractTableOfContents(latexText);
        
        // 规范化搜索关键词
        const normalizedQuery = query.toLowerCase();
        
        allSections.forEach(section => {
            // 搜索章节标题
            if (section.title.toLowerCase().includes(normalizedQuery)) {
                results.push({
                    id: section.id,
                    title: section.title,
                    match: 'title',
                    level: 1
                });
            }
            
            // 搜索子章节标题
            section.subsections.forEach(subsection => {
                if (subsection.title.toLowerCase().includes(normalizedQuery)) {
                    results.push({
                        id: `${section.id}-${subsection.id}`,
                        title: `${section.title} > ${subsection.title}`,
                        match: 'subtitle',
                        level: 2,
                        parentId: section.id
                    });
                }
            });
            
            // 搜索章节内容
            const sectionContent = this.getSectionContent(section.id, latexText);
            const textContent = sectionContent.replace(/<[^>]+>/g, ' ');
            
            if (textContent.toLowerCase().includes(normalizedQuery)) {
                // 如果标题已经匹配，则不重复添加
                if (!results.some(r => r.id === section.id && r.match === 'title')) {
                    results.push({
                        id: section.id,
                        title: section.title,
                        match: 'content',
                        level: 1,
                        context: this.extractContext(textContent, normalizedQuery, 100)
                    });
                }
            }
        });
        
        return results;
    }

    /**
     * 提取关键词周围的上下文
     * @param {string} text - 文本内容
     * @param {string} query - 搜索关键词
     * @param {number} contextLength - 上下文长度
     * @returns {string} - 上下文内容
     */
    extractContext(text, query, contextLength) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return '';
        
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + query.length + contextLength);
        
        let context = text.substring(start, end);
        
        // 添加省略号
        if (start > 0) context = '...' + context;
        if (end < text.length) context += '...';
        
        return context;
    }
}

// 导出解析器实例
const latexParser = new LatexParser(); 