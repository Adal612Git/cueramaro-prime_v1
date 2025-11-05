import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency } from '../utils/format';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  header: { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }
});

interface SaleItem {
  product: string;
  quantity: number;
  price: number;
}

interface SaleTicketProps {
  folio: string;
  customer?: string;
  total: number;
  items: SaleItem[];
}

function SaleTicket({ folio, customer, total, items }: SaleTicketProps) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
      <Text style={styles.header}>Cuerámaro Prime</Text>
        <Text>Folio: {folio}</Text>
        {customer && <Text>Cliente: {customer}</Text>}
        <View style={{ marginTop: 12 }}>
          {items.map((item) => (
            <View key={item.product} style={styles.row}>
              <Text>
                {item.quantity} x {item.product}
              </Text>
              <Text>{formatCurrency(item.quantity * item.price)}</Text>
            </View>
          ))}
        </View>
        <Text style={{ marginTop: 16, textAlign: 'right' }}>Total: {formatCurrency(total)}</Text>
      </Page>
    </Document>
  );
}

export function SaleTicketLink(props: SaleTicketProps) {
  return (
    <PDFDownloadLink document={<SaleTicket {...props} />} fileName={`venta-${props.folio}.pdf`}>
      {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar nota de venta')}
    </PDFDownloadLink>
  );
}
