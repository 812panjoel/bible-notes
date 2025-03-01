// 该文件提供了一种在项目启动前复制main.tex文件的方法
// 实际使用时，可以手动将main.tex复制到Bible-Notes-App目录中
// 或使用Node.js执行此脚本

const fs = require('fs');
const path = require('path');

try {
    // 源文件和目标文件路径
    const sourceFile = path.join(__dirname, '..', 'main.tex');
    const targetFile = path.join(__dirname, 'main.tex');
    
    // 检查源文件是否存在
    if (!fs.existsSync(sourceFile)) {
        console.error('源文件不存在:', sourceFile);
        process.exit(1);
    }
    
    // 复制文件
    fs.copyFileSync(sourceFile, targetFile);
    console.log('main.tex文件已成功复制到应用目录');
} catch (error) {
    console.error('复制文件时出错:', error);
    process.exit(1);
} 