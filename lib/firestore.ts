import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe,
  updateDoc,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'
import { Budget, Expense, Goal, Subscription } from '@/types'
import { format, subMonths } from 'date-fns'

export async function saveBudget(uid: string, month: string, data: Partial<Budget>) {
  const ref = doc(db, 'budgets', uid, 'months', month)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getBudget(uid: string, month: string): Promise<Budget | null> {
  const ref = doc(db, 'budgets', uid, 'months', month)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as Budget) : null
}

export async function addExpense(uid: string, data: Omit<Expense, 'id'>): Promise<string> {
  const ref = collection(db, 'expenses', uid, 'records')
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export function getExpenses(
  uid: string,
  month: string,
  callback: (expenses: Expense[]) => void
): Unsubscribe {
  const ref = collection(db, 'expenses', uid, 'records')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const all = snap.docs
      .map((d) => ({ ...(d.data() as Omit<Expense, 'id'>), id: d.id } as Expense))
      .filter((e) => e.month === month)
    callback(all)
  })
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const ref = doc(db, 'expenses', uid, 'records', expenseId)
  await deleteDoc(ref)
}

export async function saveGoal(uid: string, data: Omit<Goal, 'id'>): Promise<string> {
  const ref = collection(db, 'goals', uid, 'items')
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export function getGoals(uid: string, callback: (goals: Goal[]) => void): Unsubscribe {
  const ref = collection(db, 'goals', uid, 'items')
  const q = query(ref, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const goals = snap.docs.map((d) => ({ ...(d.data() as Omit<Goal, 'id'>), id: d.id } as Goal))
    callback(goals)
  })
}

export async function updateGoalProgress(
  uid: string,
  goalId: string,
  amount: number
): Promise<void> {
  const ref = doc(db, 'goals', uid, 'items', goalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const goal = snap.data() as Goal
  const newSaved = goal.savedAmount + amount
  const update: Record<string, unknown> = { savedAmount: newSaved }
  if (newSaved >= goal.targetAmount) {
    update.completedAt = serverTimestamp()
  }
  await updateDoc(ref, update)
}

export async function saveSubscriptions(uid: string, subs: Subscription[]): Promise<void> {
  for (const sub of subs) {
    const ref = collection(db, 'subscriptions', uid, 'detected')
    await addDoc(ref, { ...sub, lastDetected: serverTimestamp() })
  }
}

export async function getSubscriptions(uid: string): Promise<Subscription[]> {
  const ref = collection(db, 'subscriptions', uid, 'detected')
  const snap = await getDocs(ref)
  return snap.docs.map((d) => d.data() as Subscription)
}

export async function getMonthHistory(
  uid: string,
  lastNMonths: number
): Promise<{ month: string; budget: Budget | null; totalSpent: number }[]> {
  const results = []
  const now = new Date()
  for (let i = 0; i < lastNMonths; i++) {
    const d = subMonths(now, i)
    const month = format(d, 'yyyy-MM')
    const budget = await getBudget(uid, month)
    const expRef = collection(db, 'expenses', uid, 'records')
    const snap = await getDocs(expRef)
    const spent = snap.docs
      .map((d) => d.data() as Expense)
      .filter((e) => e.month === month)
      .reduce((sum, e) => sum + e.amount, 0)
    results.push({ month, budget, totalSpent: spent })
  }
  return results
}

export async function getAllExpensesForMonths(uid: string, months: string[]): Promise<Expense[]> {
  const ref = collection(db, 'expenses', uid, 'records')
  const snap = await getDocs(ref)
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Expense, 'id'>), id: d.id } as Expense))
    .filter((e) => months.includes(e.month))
}
