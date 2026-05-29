import fs from 'fs';
import path from 'path';

export interface ChapterMeta {
  slug: string;
  number: string;
  title: string;
  description?: string;
  filePath: string;
}

const chaptersDir = path.join(process.cwd(), 'chapters');

export function getAllChapters(): ChapterMeta[] {
  const files = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md'));

  const chapters = files.map(file => {
    const fullPath = path.join(chaptersDir, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');

    // 从第一行 h1 提取标题
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const fullTitle = titleMatch ? titleMatch[1].trim() : file;

    // 提取编号和标题："第一章：xxx" → number: "01", title: "xxx"
    const numMatch = fullTitle.match(/^第([一二三四五六七八九十]+)章[：:]\s*(.+)/);
    const number = numMatch ? chineseToNumber(numMatch[1]) : null;
    const shortTitle = numMatch ? numMatch[2] : fullTitle;

    // 从号数映射到文件编号
    const numStr = number ? String(number).padStart(2, '0') : file.slice(0, 2);

    return {
      slug: file.replace('.md', ''),
      number: numStr,
      title: shortTitle,
      filePath: fullPath,
    };
  });

  // 按编号排序
  chapters.sort((a, b) => {
    const na = parseInt(a.number, 10) || 99;
    const nb = parseInt(b.number, 10) || 99;
    return na - nb;
  });

  return chapters;
}

export function getChapterContent(slug: string): string | null {
  const filePath = path.join(chaptersDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function chineseToNumber(cn: string): number {
  const map: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13,
  };
  return map[cn] || 0;
}

// 提取 markdown 内容中的 h2/h3 标题用于 TOC
export function extractTOC(content: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: { level: number; text: string; id: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`~]|<!--.*?-->/g, '').trim();
    const id = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w一-鿿-]/g, '');
    toc.push({ level, text, id });
  }

  return toc;
}
