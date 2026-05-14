export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  monthlyBudget: number;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
  status: string;
  timestamp: number;
}

export interface Category {
  id: number;
  name: string;
  type: 'EXPENSE' | 'REVENUE';
  color: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: Category;
  createdAt: string;
}

export interface Revenue {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: Category;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageable: unknown;
}

export interface ExpenseSummary {
  year: number;
  month: number;
  totalRevenues: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: Record<string, number>;
}

export interface SavingsGoal {
  id: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  remaining: number;
  targetDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Alert {
  id: number;
  level: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AlertStats {
  total: number;
  unread: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  suggestions: string[];
  timestamp: string;
  processingTime: number;
  sessionId: string;
  metadata: {
    userId: number;
    n8nCalled: boolean;
  };
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  monthlyBudget?: number;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}
