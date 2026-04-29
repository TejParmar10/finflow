'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { MonthlyReport } from '@/types'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0D0F1A',
    color: '#E8EAF6',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 22,
    color: '#E8EAF6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(78,205,196,0.08)',
    padding: 12,
    borderRadius: 8,
  },
  scoreLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginRight: 8 },
  scoreValue: { fontSize: 20, color: '#4ECDC4', fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    color: '#E8EAF6',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  bodyText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 },
  row: { flexDirection: 'row', marginBottom: 4 },
  bullet: { fontSize: 10, color: '#4ECDC4', marginRight: 6 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  catAmt: { fontSize: 10, color: '#E8EAF6' },
  highlight: { color: '#00C896' },
  lowlight: { color: '#FF6B6B' },
  recNum: {
    fontSize: 10, color: '#4ECDC4', marginRight: 6,
    backgroundColor: 'rgba(78,205,196,0.12)', paddingHorizontal: 4, borderRadius: 4,
  },
})

interface ReportDocumentProps {
  report: MonthlyReport
  userName: string
}

export function ReportDocument({ report, userName }: ReportDocumentProps) {
  const monthLabel = format(new Date(report.month + '-01'), 'MMMM yyyy')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FinFlow — {monthLabel}</Text>
          <Text style={styles.subtitle}>
            {userName} · Generated {format(new Date(), 'dd MMM yyyy')}
          </Text>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Financial Health Score</Text>
          <Text style={styles.scoreValue}>{report.creditScore}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.bodyText}>{report.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.highlight]}>What You Did Well</Text>
          {report.highlights.map((h, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.bullet, styles.highlight]}>✓</Text>
              <Text style={styles.bodyText}>{h}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.lowlight]}>Areas to Improve</Text>
          {report.lowlights.map((l, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.bullet, styles.lowlight]}>•</Text>
              <Text style={styles.bodyText}>{l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Breakdown</Text>
          {report.categoryBreakdown.map(({ category, amount, percent }) => (
            <View key={category} style={styles.catRow}>
              <Text style={styles.catLabel}>{category.charAt(0).toUpperCase() + category.slice(1)} ({percent}%)</Text>
              <Text style={styles.catAmt}>₹{amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {report.recommendations.map((rec, i) => (
            <View key={i} style={[styles.row, { marginBottom: 6 }]}>
              <Text style={styles.recNum}>{i + 1}</Text>
              <Text style={styles.bodyText}>{rec}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
