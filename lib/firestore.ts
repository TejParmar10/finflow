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
import { Budget, Expense, Goal, Subscription, SplitGroup, SplitExpense, SplitShare } from '@/types'
import { format, subMonths } from 'date-fns'
import { where } from 'firebase/firestore'

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
  return onSnapshot(q,
    (snap) => {
      const all = snap.docs
        .map((d) => ({ ...(d.data() as Omit<Expense, 'id'>), id: d.id } as Expense))
        .filter((e) => e.month === month)
      callback(all)
    },
    (err) => console.error('[firestore] getExpenses snapshot error:', err.code, err.message)
  )
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
  return onSnapshot(q,
    (snap) => {
      const goals = snap.docs.map((d) => ({ ...(d.data() as Omit<Goal, 'id'>), id: d.id } as Goal))
      callback(goals)
    },
    (err) => console.error('[firestore] getGoals snapshot error:', err.code, err.message)
  )
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

// ─── Splits ──────────────────────────────────────────────────────────────────

// Remove undefined fields recursively — Firestore rejects undefined values
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export async function createSplitGroup(data: Omit<SplitGroup, 'id'>): Promise<string> {
  const ref = collection(db, 'splitGroups')
  const clean = stripUndefined(data)
  const docRef = await addDoc(ref, { ...clean, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return docRef.id
}

export async function getSplitGroup(groupId: string): Promise<SplitGroup | null> {
  const ref = doc(db, 'splitGroups', groupId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as SplitGroup) : null
}

export function getUserGroups(uid: string, callback: (groups: SplitGroup[]) => void): Unsubscribe {
  const ref = collection(db, 'splitGroups')
  const q = query(ref, orderBy('updatedAt', 'desc'))
  return onSnapshot(q,
    (snap) => {
      const groups = snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as SplitGroup))
        .filter((g) => g.members?.some((m) => m.uid === uid) || g.createdBy === uid)
      callback(groups)
    },
    (err) => console.error('[firestore] getUserGroups snapshot error:', err.code, err.message)
  )
}

export async function addSplitExpense(groupId: string, data: Omit<SplitExpense, 'id'>): Promise<string> {
  const ref = collection(db, 'splitExpenses', groupId, 'items')
  const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() })
  // Update group totalExpenses + updatedAt
  const groupRef = doc(db, 'splitGroups', groupId)
  const groupSnap = await getDoc(groupRef)
  if (groupSnap.exists()) {
    const current = groupSnap.data().totalExpenses ?? 0
    await updateDoc(groupRef, { totalExpenses: current + data.amount, updatedAt: serverTimestamp() })
  }
  return docRef.id
}

export function getSplitExpenses(groupId: string, callback: (expenses: SplitExpense[]) => void): Unsubscribe {
  const ref = collection(db, 'splitExpenses', groupId, 'items')
  const q = query(ref, orderBy('date', 'desc'))
  return onSnapshot(q,
    (snap) => { callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as SplitExpense))) },
    (err) => console.error('[firestore] getSplitExpenses snapshot error:', err.code, err.message)
  )
}

export async function updateSplitBalance(groupId: string, uid: string, balanceData: Record<string, number>): Promise<void> {
  const ref = doc(db, 'splitBalances', groupId, 'balances', uid)
  await setDoc(ref, { uid, balances: balanceData, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getGroupBalances(groupId: string): Promise<Record<string, Record<string, number>>> {
  const ref = collection(db, 'splitBalances', groupId, 'balances')
  const snap = await getDocs(ref)
  const result: Record<string, Record<string, number>> = {}
  snap.docs.forEach((d) => { result[d.id] = d.data().balances ?? {} })
  return result
}

export async function markShareSettled(groupId: string, expenseId: string, uid: string): Promise<void> {
  const ref = doc(db, 'splitExpenses', groupId, 'items', expenseId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const expense = snap.data() as SplitExpense
  const updatedSplits = expense.splits.map((s: SplitShare) =>
    s.uid === uid ? { ...s, settled: true, settledAt: serverTimestamp() } : s
  )
  await updateDoc(ref, { splits: updatedSplits })
}

export async function findUserByEmail(email: string): Promise<{ uid: string; displayName: string; photoURL: string; upiId?: string } | null> {
  const ref = collection(db, 'users')
  const q = query(ref, where('email', '==', email), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0].data()
  return { uid: snap.docs[0].id, displayName: d.displayName, photoURL: d.photoURL, upiId: d.upiId }
}

export async function findUserByPhone(phone: string): Promise<{ uid: string; displayName: string; photoURL: string; upiId?: string } | null> {
  const ref = collection(db, 'users')
  const q = query(ref, where('phone', '==', phone), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0].data()
  return { uid: snap.docs[0].id, displayName: d.displayName, photoURL: d.photoURL, upiId: d.upiId }
}

export async function updateUserUpiId(uid: string, upiId: string): Promise<void> {
  const trimmed = upiId.trim()
  // 1. Save to user profile
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { upiId: trimmed })
  // 2. Sync into every splitGroup where this user is a member
  await syncUserUpiInGroups(uid, trimmed)
}

export async function syncUserUpiInGroups(uid: string, upiId: string): Promise<void> {
  const ref = collection(db, 'splitGroups')
  const snap = await getDocs(ref)
  const updates: Promise<void>[] = []
  snap.docs.forEach((d) => {
    const members: { uid: string | null; upiId?: string }[] = d.data().members ?? []
    if (!members.some((m) => m.uid === uid)) return
    const updated = members.map((m) => m.uid === uid ? { ...m, upiId } : m)
    updates.push(updateDoc(doc(db, 'splitGroups', d.id), { members: updated }))
  })
  await Promise.all(updates)
}

export async function deleteSplitGroup(groupId: string): Promise<void> {
  const ref = doc(db, 'splitGroups', groupId)
  await deleteDoc(ref)
}

export async function addMembersToGroup(groupId: string, newMembers: import('@/types').SplitMember[]): Promise<void> {
  const ref = doc(db, 'splitGroups', groupId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const existing: import('@/types').SplitMember[] = snap.data().members ?? []
  const existingUids = new Set(existing.map((m) => m.uid ?? m.displayName))
  const toAdd = newMembers.filter((m) => !existingUids.has(m.uid ?? m.displayName))
  if (toAdd.length === 0) return
  const cleaned = JSON.parse(JSON.stringify([...existing, ...toAdd]))
  await updateDoc(ref, { members: cleaned, updatedAt: serverTimestamp() })
}
