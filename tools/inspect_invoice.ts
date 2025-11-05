import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require('xlsx');

const templatePath = path.resolve(process.cwd(), 'Factura.xlsm');
if (!fs.existsSync(templatePath)) {
  console.error('No existe Factura.xlsm');
  process.exit(1);
}
const wb = XLSX.readFile(templatePath, { cellDates: true });
const sheetName = 'Formato';
const ws = wb.Sheets[sheetName];
if (!ws) {
  console.error('Hoja Formato no encontrada');
  process.exit(1);
}

const cells = ['E5','E7','B10','B11','B13','B14','E9','E11','E13','E15','A18','B18','C18','D18','E18','F18','F28','F30','F32'];
for (const c of cells) {
  const cell = ws[c];
  console.log(c, '=>', cell ? JSON.stringify(cell) : 'EMPTY');
}

// Detect first 10 rows of items area starting A18..F27
for (let r=18;r<=27;r++){
  const row: any = {};
  ['A','B','C','D','E','F'].forEach(col=>{ const addr = `${col}${r}`; row[col]= ws[addr] ? ws[addr].v ?? ws[addr].w ?? 'VAL' : null; });
  console.log('ROW', r, row);
}

