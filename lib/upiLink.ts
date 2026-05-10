interface UpiParams {
  upiId: string
  name: string
  amount: number
  note?: string
  transactionRef?: string
}

export function buildUpiLink({ upiId, name, amount, note = 'FinFlow Split', transactionRef }: UpiParams): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  })
  if (transactionRef) params.set('tr', transactionRef)
  return `upi://pay?${params.toString()}`
}

export function buildGPayLink(p: UpiParams): string {
  // GPay uses the standard UPI intent with a specific package
  const base = buildUpiLink(p)
  return `intent://pay?${new URLSearchParams({
    pa: p.upiId, pn: p.name, am: p.amount.toFixed(2), cu: 'INR', tn: p.note ?? 'FinFlow Split',
  }).toString()}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
}

export function buildPhonePeLink(p: UpiParams): string {
  return `intent://pay?${new URLSearchParams({
    pa: p.upiId, pn: p.name, am: p.amount.toFixed(2), cu: 'INR', tn: p.note ?? 'FinFlow Split',
  }).toString()}#Intent;scheme=upi;package=com.phonepe.app;end`
}

export function buildPaytmLink(p: UpiParams): string {
  return `intent://pay?${new URLSearchParams({
    pa: p.upiId, pn: p.name, am: p.amount.toFixed(2), cu: 'INR', tn: p.note ?? 'FinFlow Split',
  }).toString()}#Intent;scheme=upi;package=net.one97.paytm;end`
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}
