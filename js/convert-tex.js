/**
 * TEX到JSON转换器
 * 
 * 这个脚本用于将TEX文件预处理为JSON格式，
 * 这样应用就不需要每次都解析TEX文件。
 */

// 引入parser.js中的解析逻辑
// 注意：此脚本需要在Node.js环境中运行

// 模拟浏览器环境中的LatexParser类
const LatexParser = require('./parser.js');
const fs = require('fs');
const path = require('path');

// 创建转换函数
function convertTexToJson() {
    // 读取main.tex文件
    console.log('开始转换main.tex文件...');
    
    try {
        const texPath = path.join(__dirname, '..', 'main.tex');
        const latexContent = fs.readFileSync(texPath, 'utf8');
        
        // 创建解析器实例
        const parser = new LatexParser();
        
        // 提取内容
        console.log('正在解析TEX内容...');
        const toc = parser.extractTableOfContents(latexContent);
        
        // 创建最终JSON结构
        const result = {
            toc: toc,
            sections: {}
        };
        
        // 为每个章节提取内容
        console.log('正在提取各章节内容...');
        toc.forEach(section => {
            const sectionId = section.id;
            const sectionContent = parser.getSectionContent(sectionId, latexContent);
            result.sections[sectionId] = sectionContent;
        });
        
        // 写入JSON文件
        const outputPath = path.join(__dirname, '..', 'bible-notes.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        console.log('转换完成！');
        console.log(`已生成JSON文件: ${outputPath}`);
        console.log('现在您可以修改应用，使其直接加载此JSON文件，而不是每次解析TEX文件。');
        
    } catch (error) {
        console.error('转换过程中发生错误:', error);
    }
}

// 执行转换
convertTexToJson(); 