const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber
} = require('docx');

const DOCS_DIR = path.join(__dirname, 'Docs');

// Executive color palette
const PRIMARY_COLOR = '1B4332'; // Forest Emerald
const SECONDARY_COLOR = '2D6A4F'; // Deep Green
const ACCENT_COLOR = '40916C'; // Mint Sage
const TEXT_COLOR = '222222';
const MUTED_TEXT = '555555';
const BG_CALLOUT = 'F4F9F4';
const BORDER_COLOR = 'D3D3D3';
const TH_BG = '1B4332';
const TR_ALT_BG = 'F8F9FA';

function parseInlineFormatting(text) {
  const runs = [];
  // Tokenize bold, code, regular text
  const regex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)|([^*`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // Bold **text**
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          color: TEXT_COLOR,
          font: 'Segoe UI'
        })
      );
    } else if (match[3]) {
      // Code `text`
      runs.push(
        new TextRun({
          text: match[4],
          font: 'Consolas',
          size: 20,
          color: '9B2226'
        })
      );
    } else if (match[5]) {
      // Italic *text*
      runs.push(
        new TextRun({
          text: match[6],
          italics: true,
          color: TEXT_COLOR,
          font: 'Segoe UI'
        })
      );
    } else if (match[7]) {
      // Plain text
      runs.push(
        new TextRun({
          text: match[7],
          color: TEXT_COLOR,
          font: 'Segoe UI'
        })
      );
    }
  }

  if (runs.length === 0 && text) {
    runs.push(new TextRun({ text, font: 'Segoe UI', color: TEXT_COLOR }));
  }
  return runs;
}

function markdownToDocxElements(mdContent, docTitle) {
  const lines = mdContent.split(/\r?\n/);
  const elements = [];

  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];
  let inBlockquote = false;
  let blockquoteLines = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;

    // Filter out markdown separator lines like |---|---|
    const cleanRows = tableRows.filter((r) => {
      return !r.every((cell) => /^[:\s-]+$/.test(cell.trim()));
    });

    if (cleanRows.length === 0) {
      tableRows = [];
      inTable = false;
      return;
    }

    const docxRows = cleanRows.map((rowCells, rowIndex) => {
      const isHeader = rowIndex === 0;
      const isAltRow = !isHeader && rowIndex % 2 === 1;

      return new TableRow({
        tableHeader: isHeader,
        children: rowCells.map((cellText) => {
          return new TableCell({
            width: {
              size: Math.floor(100 / rowCells.length),
              type: WidthType.PERCENTAGE
            },
            shading: {
              type: ShadingType.CLEAR,
              fill: isHeader ? TH_BG : isAltRow ? TR_ALT_BG : 'FFFFFF'
            },
            margins: {
              top: convertInchesToTwip(0.08),
              bottom: convertInchesToTwip(0.08),
              left: convertInchesToTwip(0.12),
              right: convertInchesToTwip(0.12)
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: isHeader
                  ? [
                      new TextRun({
                        text: cellText.trim(),
                        bold: true,
                        color: 'FFFFFF',
                        font: 'Segoe UI',
                        size: 20
                      })
                    ]
                  : parseInlineFormatting(cellText.trim())
              })
            ]
          });
        })
      });
    });

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: docxRows
      })
    );
    elements.push(new Paragraph({ spacing: { after: 150 } }));

    tableRows = [];
    inTable = false;
  };

  const flushCode = () => {
    if (codeLines.length === 0) return;
    const codeParagraphs = codeLines.map(
      (line) =>
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: line,
              font: 'Consolas',
              size: 18,
              color: '1E293B'
            })
          ]
        })
    );

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
                margins: {
                  top: convertInchesToTwip(0.1),
                  bottom: convertInchesToTwip(0.1),
                  left: convertInchesToTwip(0.15),
                  right: convertInchesToTwip(0.15)
                },
                borders: {
                  left: { style: BorderStyle.SINGLE, size: 16, color: '64748B' },
                  top: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE }
                },
                children: codeParagraphs
              })
            ]
          })
        ]
      })
    );
    elements.push(new Paragraph({ spacing: { after: 150 } }));
    codeLines = [];
    inCodeBlock = false;
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length === 0) return;
    const bqParagraphs = blockquoteLines.map((line) => {
      return new Paragraph({
        spacing: { before: 40, after: 40 },
        children: parseInlineFormatting(line)
      });
    });

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: BG_CALLOUT },
                margins: {
                  top: convertInchesToTwip(0.1),
                  bottom: convertInchesToTwip(0.1),
                  left: convertInchesToTwip(0.15),
                  right: convertInchesToTwip(0.15)
                },
                borders: {
                  left: { style: BorderStyle.SINGLE, size: 24, color: PRIMARY_COLOR },
                  top: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE }
                },
                children: bqParagraphs
              })
            ]
          })
        ]
      })
    );
    elements.push(new Paragraph({ spacing: { after: 150 } }));
    blockquoteLines = [];
    inBlockquote = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
      } else {
        if (inTable) flushTable();
        if (inBlockquote) flushBlockquote();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // Table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (inBlockquote) flushBlockquote();
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Blockquote line
    if (trimmed.startsWith('>')) {
      inBlockquote = true;
      blockquoteLines.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Empty line
    if (!trimmed) {
      continue;
    }

    // Horizontal Rule
    if (/^---+$|^\*\*\*+$/.test(trimmed)) {
      elements.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_COLOR }
          },
          spacing: { before: 120, after: 120 }
        })
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.TITLE,
          spacing: { before: 240, after: 80 },
          children: [
            new TextRun({
              text: trimmed.replace(/^#\s+/, ''),
              bold: true,
              size: 36,
              color: PRIMARY_COLOR,
              font: 'Segoe UI'
            })
          ]
        })
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 80 },
          children: [
            new TextRun({
              text: trimmed.replace(/^##\s+/, ''),
              bold: true,
              size: 28,
              color: PRIMARY_COLOR,
              font: 'Segoe UI'
            })
          ]
        })
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 60 },
          children: [
            new TextRun({
              text: trimmed.replace(/^###\s+/, ''),
              bold: true,
              size: 24,
              color: SECONDARY_COLOR,
              font: 'Segoe UI'
            })
          ]
        })
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 40 },
          children: [
            new TextRun({
              text: trimmed.replace(/^####\s+/, ''),
              bold: true,
              size: 21,
              color: ACCENT_COLOR,
              font: 'Segoe UI'
            })
          ]
        })
      );
      continue;
    }

    // Bullet lists
    if (/^[-*•]\s+/.test(trimmed)) {
      const listContent = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 30, after: 30 },
          children: parseInlineFormatting(listContent)
        })
      );
      continue;
    }

    // Numbered lists
    if (/^\d+\.\s+/.test(trimmed)) {
      const numContent = trimmed.replace(/^\d+\.\s+/, '');
      elements.push(
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: trimmed.match(/^\d+\.\s+/)[0],
              bold: true,
              color: PRIMARY_COLOR,
              font: 'Segoe UI'
            }),
            ...parseInlineFormatting(numContent)
          ]
        })
      );
      continue;
    }

    // Standard paragraph
    elements.push(
      new Paragraph({
        spacing: { before: 60, after: 80, line: 276 },
        children: parseInlineFormatting(trimmed)
      })
    );
  }

  if (inTable) flushTable();
  if (inCodeBlock) flushCode();
  if (inBlockquote) flushBlockquote();

  return elements;
}

async function convertAllMdToDocx() {
  const files = [
    {
      md: '01_Executive_Concept_Note_and_Brochure.md',
      docx: '01_Executive_Concept_Note_and_Brochure.docx',
      title: 'ScholarHub — Executive Concept Note & Brochure'
    },
    {
      md: '02_Software_Requirements_Specification_SRS.md',
      docx: '02_Software_Requirements_Specification_SRS.docx',
      title: 'ScholarHub — Software Requirements Specification (SRS)'
    },
    {
      md: '03_Technical_Architecture_and_Security.md',
      docx: '03_Technical_Architecture_and_Security.docx',
      title: 'ScholarHub — Technical Architecture & Security Blueprint'
    },
    {
      md: '04_Implementation_and_Pilot_Roadmap.md',
      docx: '04_Implementation_and_Pilot_Roadmap.docx',
      title: 'ScholarHub — Institutional Implementation & Pilot Roadmap'
    },
    {
      md: '05_Commercial_and_SLA_Framework.md',
      docx: '05_Commercial_and_SLA_Framework.docx',
      title: 'ScholarHub — Commercial Terms, Licensing & SLA Framework'
    },
    {
      md: 'email_to_be_sent.md',
      docx: 'email_to_be_sent.docx',
      title: 'ScholarHub — Institutional Outreach Email Templates'
    }
  ];

  for (const f of files) {
    const mdPath = path.join(DOCS_DIR, f.md);
    const docxPath = path.join(DOCS_DIR, f.docx);

    if (!fs.existsSync(mdPath)) {
      console.log(`Skipping missing file: ${mdPath}`);
      continue;
    }

    console.log(`Generating ${f.docx}...`);
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const docElements = markdownToDocxElements(mdContent, f.title);

    const doc = new Document({
      creator: 'ScholarHub Academic Solutions',
      title: f.title,
      description: 'Institutional Documentation & Proposal for Higher Education',
      styles: {
        default: {
          document: {
            run: {
              font: 'Segoe UI',
              size: 21,
              color: TEXT_COLOR
            }
          }
        }
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.8),
                bottom: convertInchesToTwip(0.8),
                left: convertInchesToTwip(0.9),
                right: convertInchesToTwip(0.9)
              }
            }
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: f.title,
                      size: 16,
                      color: MUTED_TEXT,
                      font: 'Segoe UI',
                      italics: true
                    })
                  ]
                })
              ]
            })
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.SPACE_BETWEEN,
                  children: [
                    new TextRun({
                      text: 'SCHOLARHUB™ — Confidential University Proposal',
                      size: 16,
                      color: MUTED_TEXT,
                      font: 'Segoe UI'
                    }),
                    new TextRun({
                      text: '    Page ',
                      size: 16,
                      color: MUTED_TEXT,
                      font: 'Segoe UI'
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 16,
                      color: MUTED_TEXT,
                      font: 'Segoe UI'
                    })
                  ]
                })
              ]
            })
          },
          children: docElements
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docxPath, buffer);
    console.log(`✅ Successfully created: ${docxPath}`);
  }
}

convertAllMdToDocx()
  .then(() => console.log('🎉 All DOCX files generated successfully!'))
  .catch((err) => console.error('Error generating docx:', err));
