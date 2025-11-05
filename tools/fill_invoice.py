#!/usr/bin/env python3
import sys, os, json, zipfile, shutil, tempfile, re
import xml.etree.ElementTree as ET

NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
ET.register_namespace('', NS_MAIN)
ET.register_namespace('r', NS_REL)

def col_to_addr(col_idx):
    s = ''
    while col_idx:
        col_idx, r = divmod(col_idx - 1, 26)
        s = chr(65 + r) + s
    return s

def find_sheet_target(zf: zipfile.ZipFile, sheet_name: str) -> str:
    wb = ET.fromstring(zf.read('xl/workbook.xml'))
    rid = None
    for sheet in wb.findall(f'{{{NS_MAIN}}}sheets/{{{NS_MAIN}}}sheet'):
        if sheet.get('name') == sheet_name:
            rid = sheet.get(f'{{{NS_REL}}}id')
            break
    if not rid:
        raise RuntimeError(f'Hoja {sheet_name} no encontrada')
    rels = ET.fromstring(zf.read('xl/_rels/workbook.xml.rels'))
    for rel in rels.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
        if rel.get('Id') == rid:
            return 'xl/' + rel.get('Target').lstrip('/')
    raise RuntimeError('Relación de hoja no encontrada')

def ensure_row(sheet: ET.Element, row_num: int) -> ET.Element:
    sheetData = sheet.find(f'{{{NS_MAIN}}}sheetData')
    assert sheetData is not None
    for row in sheetData.findall(f'{{{NS_MAIN}}}row'):
        if int(row.get('r')) == row_num:
            return row
    # create new row at the end
    row = ET.SubElement(sheetData, f'{{{NS_MAIN}}}row', {'r': str(row_num)})
    return row

def find_cell(row: ET.Element, addr: str):
    for c in row.findall(f'{{{NS_MAIN}}}c'):
        if c.get('r') == addr:
            return c
    return None

def set_cell_str(sheet: ET.Element, addr: str, value: str):
    # addr like E3
    m = re.match(r'([A-Z]+)(\d+)$', addr)
    if not m:
        return
    rown = int(m.group(2))
    row = ensure_row(sheet, rown)
    c = find_cell(row, addr)
    if c is None:
        c = ET.SubElement(row, f'{{{NS_MAIN}}}c', {'r': addr, 't': 'inlineStr'})
    else:
        # preserve style if present
        for child in list(c):
            c.remove(child)
        c.attrib.pop('t', None)
        c.set('t', 'inlineStr')
    isel = ET.SubElement(c, f'{{{NS_MAIN}}}is')
    tel = ET.SubElement(isel, f'{{{NS_MAIN}}}t')
    tel.text = value or ''

def set_cell_num(sheet: ET.Element, addr: str, num):
    m = re.match(r'([A-Z]+)(\d+)$', addr)
    if not m:
        return
    rown = int(m.group(2))
    row = ensure_row(sheet, rown)
    c = find_cell(row, addr)
    if c is None:
        c = ET.SubElement(row, f'{{{NS_MAIN}}}c', {'r': addr})
    else:
        for child in list(c):
            c.remove(child)
        c.attrib.pop('t', None)
    v = ET.SubElement(c, f'{{{NS_MAIN}}}v')
    try:
        val = float(num)
    except Exception:
        val = 0
    v.text = str(val)

def clear_cell(sheet: ET.Element, addr: str):
    m = re.match(r'([A-Z]+)(\d+)$', addr)
    if not m:
        return
    rown = int(m.group(2))
    sheetData = sheet.find(f'{{{NS_MAIN}}}sheetData')
    for row in sheetData.findall(f'{{{NS_MAIN}}}row'):
        if int(row.get('r')) == rown:
            for c in row.findall(f'{{{NS_MAIN}}}c'):
                if c.get('r') == addr:
                    # keep attributes but remove children, and remove type
                    for child in list(c):
                        row.remove(child) if False else c.remove(child)
                    c.attrib.pop('t', None)
                    return

def to_words_mx(value: float) -> str:
    # simple Spanish converter (same as TS logic)
    def number_to_words_es(n: int) -> str:
        if n == 0: return 'cero'
        unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
        especiales = ['diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve']
        decenas = ['', 'diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
        centenas = ['', 'ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos']
        def tens(num):
            if num < 10: return unidades[num]
            if num < 20: return especiales[num-10]
            if num < 30: return 'veinte' if num==20 else 'veinti'+unidades[num-20]
            d, u = divmod(num, 10)
            return f"{decenas[d]} y {unidades[u]}" if u else decenas[d]
        def hundreds(num):
            if num == 100: return 'cien'
            c, r = divmod(num, 100)
            cent = centenas[c]
            return (f"{cent} {tens(r)}" if r else cent) if c else tens(r)
        if n >= 1_000_000:
            m, r = divmod(n, 1_000_000)
            pref = 'un millón' if m == 1 else f"{number_to_words_es(m)} millones"
            return f"{pref} {number_to_words_es(r)}" if r else pref
        if n >= 1000:
            m, r = divmod(n, 1000)
            pref = 'mil' if m == 1 else f"{hundreds(m)} mil"
            return f"{pref} {hundreds(r)}" if r else pref
        return hundreds(n)
    entero = int(max(0, value or 0))
    centavos = int(round((value - entero) * 100))
    return f"{number_to_words_es(entero)} pesos {centavos:02d}/100 M.N."

def main():
    if len(sys.argv) < 4:
        print('Usage: fill_invoice.py <template.xlsm> <out.xlsm> <sale.json>', file=sys.stderr)
        sys.exit(2)
    template, outpath, sale_json = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(sale_json, 'r', encoding='utf-8') as f:
        data = json.load(f)

    vendor = data.get('vendorName') or ''
    sale = data['sale']
    expedida_en = data.get('expedidaEn') or 'Cuerámaro, Guanajuato'

    tmpd = tempfile.mkdtemp(prefix='invxlsm-')
    try:
        # Copy template to tmp and unpack
        with zipfile.ZipFile(template, 'r') as z:
            z.extractall(tmpd)

        # Load sheet xml
        with zipfile.ZipFile(template, 'r') as z:
            sheet_rel = find_sheet_target(z, 'Formato')
        sheet_path = os.path.join(tmpd, sheet_rel)
        tree = ET.parse(sheet_path)
        sheet = tree.getroot()

        # Helpers
        from datetime import datetime
        def format_date_es(dt: datetime) -> str:
            months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
            return f"{dt.day:02d} {months[dt.month-1]} {dt.year}"

        is_credit = sale.get('paymentMethod') == 'credito'
        created_at = sale.get('createdAt')
        created_dt = datetime.fromisoformat(created_at.replace('Z','+00:00')) if created_at else datetime.now()

        # Header
        # EXPEDIDA EN -> F5
        set_cell_str(sheet, 'F5', expedida_en)
        # FECHA DE VENCIMIENTO -> F7
        if is_credit and sale.get('creditDueDate'):
            due = datetime.fromisoformat(sale['creditDueDate'].replace('Z','+00:00'))
            set_cell_str(sheet, 'F7', format_date_es(due))
        else:
            clear_cell(sheet, 'F7')
        set_cell_str(sheet, 'E3', format_date_es(created_dt))
        set_cell_num(sheet, 'F3', created_dt.year)
        clear_cell(sheet, 'G2')

        cust = sale.get('customer') or {}
        set_cell_str(sheet, 'B10', cust.get('name') or 'Mostrador')
        if 'code' in cust and isinstance(cust.get('code'), int):
            set_cell_num(sheet, 'B9', cust['code'])
        addr = cust.get('businessAddress') or cust.get('personalAddress') or ''
        cp = cust.get('businessPostalCode') or cust.get('personalPostalCode') or ''
        if addr: set_cell_str(sheet, 'B11', addr)
        if cp:
            set_cell_str(sheet, 'B12', str(cp))
        rfc = cust.get('rfcCurp') or ''
        if rfc: set_cell_str(sheet, 'B13', rfc)
        phone = (
            cust.get('phoneBusiness') or
            cust.get('phonePersonal') or
            cust.get('phone') or
            cust.get('whatsappBusiness') or
            cust.get('whatsappPersonal') or
            cust.get('whatsapp') or
            ''
        )
        if phone: set_cell_str(sheet, 'B14', phone)
        if addr: set_cell_str(sheet, 'B15', addr)

        method_map = {
            'efectivo': 'Pago de contado',
            'transferencia': 'Pago por transferencia',
            'credito': 'Crédito',
            'tarjeta': 'Pago con tarjeta',
            'otro': 'Otro método',
        }
        text_method = method_map.get(sale.get('paymentMethod'), 'Pago de contado')
        # MÉTODO DE PAGO -> F9
        set_cell_str(sheet, 'F9', text_method)
        if is_credit:
            plazo = f"{cust.get('creditDays') or 0} días"
            # PLAZO DE PAGO -> F11
            set_cell_str(sheet, 'F11', plazo)
        else:
            set_cell_str(sheet, 'F11', 'Contado')
        # MONEDA -> F13
        set_cell_str(sheet, 'F13', 'M.N. MXN')
        if vendor:
            # VENDEDOR -> F15
            set_cell_str(sheet, 'F15', vendor)

        # Items
        start = 18
        items = sale.get('items') or []
        for idx, it in enumerate(items):
            row = start + idx
            set_cell_num(sheet, f'A{row}', float(it.get('quantity') or 0))
            set_cell_str(sheet, f'B{row}', (it.get('product') or {}).get('sku') or it.get('productId') or '')
            set_cell_str(sheet, f'C{row}', (it.get('product') or {}).get('unit') or '')
            set_cell_str(sheet, f'D{row}', (it.get('product') or {}).get('name') or '')
            set_cell_num(sheet, f'E{row}', float(it.get('unitPrice') or 0))
            set_cell_num(sheet, f'F{row}', float(it.get('lineTotal') or 0))
        for r in range(start + len(items), 28):
            for col in ['A','B','C','D','E','F']:
                clear_cell(sheet, f'{col}{r}')

        # Totals
        subtotal = sum(float(it.get('lineTotal') or 0) for it in items)
        set_cell_num(sheet, 'F28', subtotal)
        set_cell_num(sheet, 'F30', float(sale.get('total') or 0))
        set_cell_num(sheet, 'F32', float(sale.get('total') or 0))
        total_val = float(sale.get('total') or 0)
        # Importe en letra (área de subtotales)
        set_cell_str(sheet, 'D28', to_words_mx(total_val))
        # Área de pagaré: C36 debe mostrar el importe con letras
        set_cell_str(sheet, 'C36', to_words_mx(total_val))

        # Pagaré
        if is_credit:
            set_cell_str(sheet, 'B33', f"En {expedida_en} {format_date_es(created_dt)}")
            due_dt = created_dt
            if sale.get('creditDueDate'):
                from datetime import datetime
                due_dt = datetime.fromisoformat(sale['creditDueDate'].replace('Z','+00:00'))
            set_cell_str(sheet, 'A35', f"en {expedida_en} el {format_date_es(due_dt)}")
            set_cell_str(sheet, 'A36', f"La Cantidad  de: ${float(sale.get('total') or 0):,.2f}")
            set_cell_str(sheet, 'B43', cust.get('name') or 'Mostrador')
            if addr: set_cell_str(sheet, 'B44', addr)
            set_cell_str(sheet, 'B45', expedida_en)

        tree.write(sheet_path, encoding='utf-8', xml_declaration=True)

        # Repack all to outpath
        with zipfile.ZipFile(outpath, 'w', zipfile.ZIP_DEFLATED) as zout:
            for root, _, files in os.walk(tmpd):
                for name in files:
                    full = os.path.join(root, name)
                    # path inside zip
                    rel = os.path.relpath(full, tmpd)
                    zout.write(full, rel)
    finally:
        shutil.rmtree(tmpd, ignore_errors=True)

if __name__ == '__main__':
    main()
