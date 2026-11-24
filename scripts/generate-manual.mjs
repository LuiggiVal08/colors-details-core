import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import PDFDocument from 'pdfkit';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
const mdPath = path.join(root, 'public/docs/manual.md');
const pdfPath = path.join(root, 'public/docs/manual.pdf');
const docxPath = path.join(root, 'public/docs/manual.docx');
const interactiveDataPath = path.join(root, 'public/js/data/manual-content.js');

async function main() {
    const blocks = parseMarkdown(fs.readFileSync(mdPath, 'utf8'));
    await generatePdf(blocks);
    generateDocx(blocks);
    generateInteractiveData(blocks);
    console.log(
        `Manual generado:\n- ${path.relative(root, pdfPath)}\n- ${path.relative(root, docxPath)}\n- ${path.relative(root, interactiveDataPath)}`
    );
}

function generateInteractiveData(items) {
    const intro = [];
    const sections = [];
    const usedIds = new Set();
    let currentSection = null;
    let currentSubsection = null;

    const uniqueId = (title) => {
        const base =
            title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || 'seccion';
        let id = base;
        let suffix = 2;
        while (usedIds.has(id)) {
            id = `${base}-${suffix}`;
            suffix += 1;
        }
        usedIds.add(id);
        return id;
    };

    const appendBlock = (block) => {
        if (currentSubsection) {
            currentSubsection.blocks.push(block);
        } else if (currentSection) {
            currentSection.blocks.push(block);
        } else {
            intro.push(block);
        }
    };

    for (const item of items) {
        switch (item.type) {
            case 'title':
                intro.push({ type: 'title', text: item.text });
                break;
            case 'cover':
                intro.push({ type: 'paragraph', text: item.text });
                break;
            case 'h1':
                currentSubsection = null;
                currentSection = { id: uniqueId(item.text), title: item.text, blocks: [] };
                sections.push(currentSection);
                break;
            case 'h2':
                if (!currentSection) break;
                currentSubsection = { type: 'subsection', id: uniqueId(item.text), title: item.text, blocks: [] };
                currentSection.blocks.push(currentSubsection);
                break;
            case 'h3':
                appendBlock({ type: 'heading', text: item.text });
                break;
            case 'bullet':
                appendBlock({ type: 'bullet', text: item.text });
                break;
            case 'number':
                appendBlock({ type: 'number', text: item.text });
                break;
            case 'note':
                appendBlock({ type: 'note', text: item.text });
                break;
            case 'image':
                appendBlock({ type: 'image', caption: item.caption, file: item.file });
                break;
            case 'break':
                break;
            default:
                appendBlock({ type: 'paragraph', text: item.text });
        }
    }

    const payload = { intro, sections };
    fs.mkdirSync(path.dirname(interactiveDataPath), { recursive: true });
    fs.writeFileSync(interactiveDataPath, `export const manualContent = ${JSON.stringify(payload, null, 4)};\n`);
}

function parseMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const parsed = [];
    let cover = true;

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) continue;

        if (line.startsWith('# ')) {
            parsed.push({ type: 'title', text: clean(line.slice(2)) });
            continue;
        }
        if (line.startsWith('## ')) {
            cover = false;
            parsed.push({ type: 'h1', text: clean(line.slice(3)) });
            continue;
        }
        if (line.startsWith('### ')) {
            parsed.push({ type: 'h2', text: clean(line.slice(4)) });
            continue;
        }
        if (line.startsWith('#### ')) {
            parsed.push({ type: 'h3', text: clean(line.slice(5)) });
            continue;
        }
        if (line.trim() === '---') {
            parsed.push({ type: 'break' });
            cover = false;
            continue;
        }
        if (line.startsWith('> ')) {
            parsed.push({ type: 'note', text: clean(line.slice(2)) });
            continue;
        }
        const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (image) {
            parsed.push({ type: 'image', caption: image[1], file: image[2] });
            continue;
        }
        if (/^[-*] /.test(line)) {
            parsed.push({ type: 'bullet', text: clean(line.slice(2)) });
            continue;
        }
        if (/^\d+\. /.test(line)) {
            parsed.push({ type: 'number', text: clean(line.replace(/^(\d+)\.\s*/, '$1. ')) });
            continue;
        }
        parsed.push({ type: cover ? 'cover' : 'paragraph', text: clean(line) });
    }

    return parsed;
}

function clean(text) {
    return text.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

function pngSize(file) {
    const buffer = fs.readFileSync(file);
    if (buffer.length < 24 || buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
        throw new Error(`Imagen PNG inválida: ${file}`);
    }
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function renderImage(doc, item) {
    const file = path.join(root, item.file);
    const { width, height } = pngSize(file);
    const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const maxHeight = 300;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const displayWidth = width * scale;
    const displayHeight = height * scale;

    if (doc.y + displayHeight + 34 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }

    const x = doc.page.margins.left + (maxWidth - displayWidth) / 2;
    const imageY = doc.y + 4;
    doc.image(file, x, imageY, { width: displayWidth, height: displayHeight });

    doc.font('Montserrat-Italic').fontSize(8.5).fillColor('#6b7280');
    const captionY = imageY + displayHeight + 10;
    const captionHeight = doc.heightOfString(item.caption, { width: maxWidth });
    doc.text(item.caption, doc.page.margins.left, captionY, {
        width: maxWidth,
        align: 'center',
    });
    doc.y = captionY + captionHeight + 8;
}

async function generatePdf(items) {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 56,
        info: {
            Title: 'Manual de Usuario - Colores y Detalles',
            Author: 'Pavid Bracamonte, Leonela Gonzalez, Pedro Gonzalez',
            Subject: 'Manual de usuario de la aplicacion web de gestion administrativa',
        },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.registerFont('Montserrat', path.join(root, 'public/font/static/Montserrat-Regular.ttf'));
    doc.registerFont('Montserrat-Bold', path.join(root, 'public/font/static/Montserrat-Bold.ttf'));
    doc.registerFont('Montserrat-Italic', path.join(root, 'public/font/static/Montserrat-Italic.ttf'));

    let inCover = true;
    let firstH1 = true;

    for (const item of items) {
        switch (item.type) {
            case 'title':
                doc.moveDown(3);
                doc.font('Montserrat-Bold').fontSize(27).fillColor('#9d174d').text(item.text, { align: 'center', lineGap: 4 });
                doc.moveDown(0.5);
                break;
            case 'cover':
                doc.font(item.text.startsWith('Aplicación Web') ? 'Montserrat-Bold' : 'Montserrat')
                    .fontSize(item.text.startsWith('Aplicación Web') ? 15 : 11)
                    .fillColor(item.text.startsWith('Aplicación Web') ? '#374151' : '#6b7280')
                    .text(item.text, { align: 'center', lineGap: 2 });
                break;
            case 'bullet':
            case 'number': {
                if (inCover) {
                    doc.font('Montserrat').fontSize(10).fillColor('#6b7280').text(item.text, { align: 'center', lineGap: 1 });
                    break;
                }
                const marker = item.type === 'number' ? item.text.split(' ')[0] : '•';
                const content = item.type === 'number' ? item.text.slice(marker.length + 1) : item.text;
                const left = doc.page.margins.left;
                const width = doc.page.width - left - doc.page.margins.right;
                const y = doc.y;
                doc.font('Montserrat').fontSize(10).fillColor('#9d174d').text(marker, left, y, { width: 20, align: 'right' });
                doc.font('Montserrat').fontSize(10).fillColor('#374151').text(content, left + 28, y, { width: width - 28, lineGap: 2 });
                doc.moveDown(0.15);
                break;
            }
            case 'break':
                if (!inCover) doc.addPage();
                inCover = false;
                break;
            case 'h1':
                if (!firstH1) doc.addPage();
                firstH1 = false;
                inCover = false;
                doc.moveDown(0.5);
                doc.font('Montserrat-Bold').fontSize(19).fillColor('#9d174d').text(item.text, { lineGap: 3 });
                doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2).strokeColor('#fecdd3').lineWidth(1).stroke();
                doc.moveDown(0.9);
                break;
            case 'h2':
                doc.moveDown(0.6);
                doc.font('Montserrat-Bold').fontSize(13.5).fillColor('#be185d').text(item.text, { lineGap: 2 });
                doc.moveDown(0.35);
                break;
            case 'h3':
                doc.moveDown(0.4);
                doc.font('Montserrat-Bold').fontSize(11).fillColor('#374151').text(item.text, { lineGap: 1 });
                doc.moveDown(0.2);
                break;
            case 'note': {
                const left = doc.page.margins.left;
                const width = doc.page.width - left - doc.page.margins.right;
                doc.font('Montserrat').fontSize(9.5);
                const height = doc.heightOfString(item.text, { width: width - 24 }) + 20;
                const y = doc.y + 4;
                doc.roundedRect(left, y, width, height, 6).fillAndStroke('#fff1f2', '#fecdd3');
                doc.font('Montserrat').fontSize(9.5).fillColor('#9d174d').text(item.text, left + 12, y + 10, { width: width - 24, lineGap: 1 });
                doc.y = y + height + 8;
                break;
            }
            case 'image':
                renderImage(doc, item);
                break;
            default:
                doc.font('Montserrat').fontSize(10).fillColor('#374151').text(item.text, { lineGap: 2 });
                doc.moveDown(0.25);
        }
    }

    const done = new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
        doc.on('error', reject);
    });
    doc.end();
    await done;
}

function generateDocx(items) {
    const entries = readZipEntries(fs.readFileSync(docxPath));
    const target = entries.find((entry) => entry.name === 'word/document.xml');
    if (!target) throw new Error('No se encontró word/document.xml en el DOCX base');

    const relsEntry = entries.find((entry) => entry.name === 'word/_rels/document.xml.rels');
    if (!relsEntry) throw new Error('No se encontró word/_rels/document.xml.rels en el DOCX base');
    let relsXml = relsEntry.data.toString('utf8');

    for (let index = entries.length - 1; index >= 0; index--) {
        if (/^word\/media\//.test(entries[index].name)) entries.splice(index, 1);
    }
    relsXml = relsXml.replace(/<Relationship\b[^>]*\/>/g, (tag) => {
        const type = tag.match(/Type="([^"]+)"/)?.[1] ?? '';
        const target = tag.match(/Target="([^"]+)"/)?.[1] ?? '';
        return type.endsWith('/image') || target.startsWith('media/') ? '' : tag;
    });

    const contentTypesEntry = entries.find((entry) => entry.name === '[Content_Types].xml');
    if (!contentTypesEntry) throw new Error('No se encontró [Content_Types].xml en el DOCX base');
    let contentTypesXml = contentTypesEntry.data.toString('utf8');
    if (!contentTypesXml.includes('Extension="png"')) {
        contentTypesXml = contentTypesXml.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
        contentTypesEntry.data = Buffer.from(contentTypesXml, 'utf8');
    }

    const relMap = new Map();
    items.filter((item) => item.type === 'image').forEach((item, index) => {
        if (relMap.has(item.file)) return;
        const number = index + 1;
        const relId = `rIdManual${number}`;
        const mediaName = `word/media/manual-${String(number).padStart(2, '0')}.png`;
        entries.push({ name: mediaName, data: fs.readFileSync(path.join(root, item.file)) });
        relMap.set(item.file, relId);
        relsXml = relsXml.replace(
            '</Relationships>',
            `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/manual-${String(number).padStart(2, '0')}.png"/></Relationships>`,
        );
    });

    relsEntry.data = Buffer.from(relsXml, 'utf8');
    target.data = Buffer.from(buildDocumentXml(items, relMap), 'utf8');
    fs.writeFileSync(docxPath, writeZip(entries));
}

function buildDocumentXml(items, relMap) {
    let imageId = 0;
    const body = items.map((item) => {
        switch (item.type) {
            case 'title':
                return paragraph(item.text, 'Title');
            case 'h1':
                return paragraph(item.text, 'Heading1');
            case 'h2':
                return paragraph(item.text, 'Heading2');
            case 'h3':
                return paragraph(item.text, 'Heading3');
            case 'bullet':
                return paragraph(`• ${item.text}`, 'ListParagraph');
            case 'number':
                return paragraph(item.text, 'ListParagraph');
            case 'note':
                return paragraph(`Nota: ${item.text}`, 'Normal');
            case 'image':
                imageId += 1;
                return imageParagraph(item, relMap.get(item.file), imageId) + captionParagraph(item.caption);
            case 'break':
                return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            default:
                return paragraph(item.text, 'Normal');
        }
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>`;
}

function paragraph(text, style) {
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function captionParagraph(text) {
    return `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="6B7280"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function imageParagraph(item, relId, id) {
    if (!relId) throw new Error(`Falta relationship para la imagen ${item.file}`);
    const { width, height } = pngSize(path.join(root, item.file));
    const scale = Math.min(550 / width, 1);
    const cx = Math.round(width * scale * 9525);
    const cy = Math.round(height * scale * 9525);

    return `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Captura ${id}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="Captura ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function readZipEntries(buffer) {
    let eocd = -1;
    for (let i = buffer.length - 22; i >= 0; i--) {
        if (buffer.readUInt32LE(i) === 0x06054b50) {
            eocd = i;
            break;
        }
    }
    if (eocd < 0) throw new Error('No se encontró el directorio central del DOCX');

    const count = buffer.readUInt16LE(eocd + 10);
    let offset = buffer.readUInt32LE(eocd + 16);
    const entries = [];

    for (let i = 0; i < count; i++) {
        if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Encabezado central inválido');
        const method = buffer.readUInt16LE(offset + 10);
        const compressedSize = buffer.readUInt32LE(offset + 20);
        const nameLength = buffer.readUInt16LE(offset + 28);
        const extraLength = buffer.readUInt16LE(offset + 30);
        const commentLength = buffer.readUInt16LE(offset + 32);
        const localOffset = buffer.readUInt32LE(offset + 42);
        const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
        const localNameLength = buffer.readUInt16LE(localOffset + 26);
        const localExtraLength = buffer.readUInt16LE(localOffset + 28);
        const dataStart = localOffset + 30 + localNameLength + localExtraLength;
        const raw = buffer.subarray(dataStart, dataStart + compressedSize);
        const data = method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
        entries.push({ name, data });
        offset += 46 + nameLength + extraLength + commentLength;
    }

    return entries;
}

function writeZip(entries) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    for (const entry of entries) {
        const name = Buffer.from(entry.name, 'utf8');
        const compressed = deflateRawSync(entry.data);
        const crc = crc32(entry.data);
        const local = Buffer.alloc(30 + name.length);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(8, 8);
        local.writeUInt16LE(time, 10);
        local.writeUInt16LE(date, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(compressed.length, 18);
        local.writeUInt32LE(entry.data.length, 22);
        local.writeUInt16LE(name.length, 26);
        local.writeUInt16LE(0, 28);
        name.copy(local, 30);
        locals.push(local, compressed);

        const central = Buffer.alloc(46 + name.length);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(8, 10);
        central.writeUInt16LE(time, 12);
        central.writeUInt16LE(date, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(compressed.length, 20);
        central.writeUInt32LE(entry.data.length, 24);
        central.writeUInt16LE(name.length, 28);
        central.writeUInt16LE(0, 30);
        central.writeUInt16LE(0, 32);
        central.writeUInt16LE(0, 34);
        central.writeUInt16LE(0, 36);
        central.writeUInt32LE(0, 38);
        central.writeUInt32LE(offset, 42);
        name.copy(central, 46);
        centrals.push(central);

        offset += local.length + compressed.length;
    }

    const centralSize = centrals.reduce((sum, chunk) => sum + chunk.length, 0);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralSize, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...locals, ...centrals, eocd]);
}

const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let value = i;
        for (let bit = 0; bit < 8; bit++) {
            value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        }
        table[i] = value >>> 0;
    }
    return table;
})();

function crc32(buffer) {
    let crc = 0xffffffff;
    for (const byte of buffer) {
        crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

await main();
