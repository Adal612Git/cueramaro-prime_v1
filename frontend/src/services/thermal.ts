import { formatCurrency } from '../utils/format';

export function printSaleTicket(params: {
  folio: string;
  date: Date;
  storeName?: string;
  vendor?: string;
  customer?: string;
  items: { name: string; qty: number; unit: string; price: number; total: number }[];
  total: number;
  paymentMethod: string;
}) {
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return;
  const styles = `
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body { font-family: monospace; font-size: 12px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .row { display: flex; justify-content: space-between; }
    .hr { border-top: 1px dashed #000; margin: 6px 0; }
    .small { font-size: 11px; }
  </style>`;
  const lines = params.items
    .map((it) => `
      <div>
        <div>${it.qty} ${it.unit} - ${it.name}</div>
        <div class="row"><span>@ ${formatCurrency(it.price)}</span><span>${formatCurrency(it.total)}</span></div>
      </div>
    `)
    .join('');

  const html = `
    <html><head><meta charset="utf-8"/>${styles}</head>
    <body>
      <div class="center bold">${params.storeName || 'Cuerámaro Prime POS'}</div>
      <div class="center">Folio: ${params.folio}</div>
      <div class="center small">${params.date.toLocaleString()}</div>
      <div class="hr"></div>
      <div class="small">Cliente: ${params.customer || 'Mostrador'}</div>
      ${params.vendor ? `<div class="small">Vendedor: ${params.vendor}</div>` : ''}
      <div class="small">Método: ${params.paymentMethod}</div>
      <div class="hr"></div>
      ${lines}
      <div class="hr"></div>
      <div class="row bold"><span>Total</span><span>${formatCurrency(params.total)}</span></div>
      <div class="center small" style="margin-top:8px;">Gracias por su compra</div>
      <script>window.print(); window.onafterprint = () => window.close();</script>
    </body></html>
  `;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

