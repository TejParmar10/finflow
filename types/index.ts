import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  displayName: string
  email: string
  photoURL: string
  upiId?: string
  createdAt: Timestamp
  preferences: { currency: 'INR'; theme: 'dark' }
}

export interface Budget {
  salary: number
  investPercent: number
  personalPercent: number
  investBudget: number
  personalBudget: number
  weeklyBudget: number
  rolloverAmount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'utilities'
  | 'subscription'
  | 'other'

export interface Expense {
  id: string
  category: ExpenseCategory
  amount: number
  description: string
  date: Timestamp
  month: string
  week: number
  aiCategorised: boolean
  importedFrom?: 'hdfc_statement'
  importedAt?: Timestamp
  receiptUrl?: string
  isPersonalShare?: boolean  // true when auto-created from a split expense
  splitId?: string           // groupId if isPersonalShare
  createdAt: Timestamp
}

export interface Goal {
  id: string
  title: string
  targetAmount: number
  savedAmount: number
  deadline: Timestamp
  weeklyTarget: number
  category: string
  createdAt: Timestamp
  completedAt?: Timestamp
}

export interface Subscription {
  name: string
  estimatedAmount: number
  frequency: 'monthly' | 'weekly' | 'yearly'
  lastDetected: Timestamp
  aiConfidence: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Timestamp
}

export interface ForecastResult {
  predictedMonthEnd: number
  safeToSpend: number
  weeklyBurnRate: number
  riskLevel: 'low' | 'medium' | 'high'
  advice: string
}

export interface MonthlyReport {
  month: string
  summary: string
  highlights: string[]
  lowlights: string[]
  creditScore: number
  recommendations: string[]
  categoryBreakdown: { category: string; amount: number; percent: number }[]
}

export interface CreditScoreData {
  score: number
  label: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor'
  color: string
}

export interface AlertType {
  type: 'warning' | 'danger'
  message: string
  category?: string
}

// ─── Splits ──────────────────────────────────────────────────────────────────

export interface SplitMember {
  uid: string | null        // null for non-FinFlow users
  displayName: string
  email?: string
  phone?: string
  photoURL?: string
  upiId?: string
  isFinFlowUser: boolean
  joinedAt?: Timestamp
}

export interface SplitShare {
  uid: string
  amount: number
  percent: number
  settled: boolean
  settledAt?: Timestamp
}

export interface SplitGroup {
  id: string
  name: string
  description?: string
  category: 'trip' | 'home' | 'food' | 'other'
  createdBy: string        // uid
  members: SplitMember[]
  totalExpenses: number
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
}

export interface SplitExpense {
  id: string
  groupId: string
  description: string
  amount: number
  paidBy: string           // uid
  category: string
  splits: SplitShare[]
  date: Timestamp
  createdAt: Timestamp
}

export interface Balance {
  fromUid: string
  toUid: string
  amount: number
  groupId: string
}

export interface SimplifiedDebt {
  fromUid: string
  fromName: string
  toUid: string
  toName: string
  toUpiId?: string
  amount: number
}

// ─── Parsed Transactions ─────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string
  description: string
  rawDescription: string
  amount: number
  type: 'debit' | 'credit'
  category: string
  confidence: number
  isDuplicate: boolean
  selected: boolean
}
