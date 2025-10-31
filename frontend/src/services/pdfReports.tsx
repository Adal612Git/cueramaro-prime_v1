import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { formatCurrency } from '../utils/format';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11 },
  h1: { fontSize: 18, marginBottom: 8, textAlign: 'center' },
  h2: { fontSize: 12, marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', borderBottom: '1px solid #e5e7eb' },
  th: { flex: 1, fontWeight: 700, paddingVertical: 6 },
  td: { flex: 1, paddingVertical: 6 },
  right: { textAlign: 'right' }
});

type Sale = { id: string; total: number; createdAt: string };

function DashboardSalesReport({
  title,
  rangeLabel,
  total,
  sales
}: { title: string; rangeLabel: string; total: number; sales: Sale[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{title}</Text>
        <Text style={styles.h2}>{rangeLabel}</Text>
        <View style={{ marginBottom: 10 }}>
          <Text>Total ventas: {formatCurrency(total)} · Operaciones: {sales.length}</Text>
        </View>
        <View style={[styles.row, { fontWeight: 700 }]}> 
          <Text style={[styles.th]}>ID</Text>
          <Text style={[styles.th]}>Fecha</Text>
          <Text style={[styles.th, styles.right]}>Total</Text>
        </View>
        {sales.map((s) => (
          <View key={s.id} style={styles.row} wrap={false}>
            <Text style={[styles.td]}>{s.id}</Text>
            <Text style={[styles.td]}>{new Date(s.createdAt).toLocaleString()}</Text>
            <Text style={[styles.td, styles.right]}>{formatCurrency(s.total)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function DashboardSalesReportLink({
  title,
  rangeLabel,
  total,
  sales,
  fileName
}: { title: string; rangeLabel: string; total: number; sales: Sale[]; fileName: string }) {
  return (
    <PDFDownloadLink document={<DashboardSalesReport title={title} rangeLabel={rangeLabel} total={total} sales={sales} />} fileName={fileName}>
      {({ loading }) => (
        <span className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white">
          {loading ? 'Generando PDF...' : 'Exportar'}
        </span>
      )}
    </PDFDownloadLink>
  );
}

