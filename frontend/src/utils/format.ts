export function formatCurrency(value: number): string {
  if (value == null || isNaN(value as any)) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Convierte a "Sentence case": primera letra mayúscula, resto minúsculas
export function sentenceCase(text: string): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Convierte un número a letras (moneda MXN) en mayúsculas
export function numberToSpanishCurrencyWords(amount: number): string {
  const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];
  const decenas = ['','', 'treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  const centenas = ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];

  const toWords = (n: number): string => {
    n = Math.floor(n);
    if (n === 0) return 'cero';
    if (n === 100) return 'cien';
    if (n < 30) return unidades[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const r = n % 10;
      return r ? `${decenas[d]} y ${unidades[r]}` : decenas[d];
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const r = n % 100;
      return r ? `${centenas[c]} ${toWords(r)}` : (c === 1 ? 'cien' : centenas[c]);
    }
    if (n < 1000000) {
      const miles = Math.floor(n / 1000);
      const r = n % 1000;
      const milesStr = miles === 1 ? 'mil' : `${toWords(miles)} mil`;
      return r ? `${milesStr} ${toWords(r)}` : milesStr;
    }
    if (n < 1000000000000) {
      const millones = Math.floor(n / 1000000);
      const r = n % 1000000;
      const millStr = millones === 1 ? 'un millón' : `${toWords(millones)} millones`;
      return r ? `${millStr} ${toWords(r)}` : millStr;
    }
    return String(n);
  };

  const entero = Math.floor(Math.abs(amount));
  const cent = Math.round((Math.abs(amount) - entero) * 100);
  const cents = cent.toString().padStart(2, '0');
  const words = toWords(entero);
  const moneda = entero === 1 ? 'peso' : 'pesos';
  return `${words} ${moneda} ${cents}/100 M.N.`.toUpperCase();
}
