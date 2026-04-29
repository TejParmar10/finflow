import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  displayName: string
  email: string
  photoURL: string
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
