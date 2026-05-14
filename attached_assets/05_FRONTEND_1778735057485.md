# 🎨 Frontend — React

## Dépendances (`package.json`)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.0",
    "recharts": "^2.12.0",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.383.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## Structure des fichiers

```
src/
│
├── main.jsx                        # Point d'entrée
├── App.jsx                         # Router principal
│
├── api/
│   ├── axios.js                    # Instance Axios + intercepteurs
│   ├── authApi.js
│   ├── expenseApi.js
│   ├── revenueApi.js
│   ├── savingsApi.js
│   ├── categoryApi.js
│   ├── alertApi.js
│   ├── dashboardApi.js
│   └── chatApi.js
│
├── context/
│   └── AuthContext.jsx             # Contexte global auth (user + token)
│
├── hooks/
│   ├── useAuth.js                  # useContext(AuthContext)
│   ├── useDashboard.js
│   ├── useExpenses.js
│   ├── useRevenues.js
│   └── useSavings.js
│
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── ExpensesPage.jsx
│   ├── RevenuesPage.jsx
│   ├── SavingsPage.jsx
│   ├── ChatPage.jsx
│   └── ProfilePage.jsx
│
├── components/
│   ├── layout/
│   │   ├── Layout.jsx              # Sidebar + Header wrappé
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx              # Cloche alertes + profil
│   │
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── Card.jsx
│   │
│   ├── dashboard/
│   │   ├── SummaryCards.jsx        # Revenus / Dépenses / Balance / Budget
│   │   ├── BudgetProgressBar.jsx   # Barre de progression % budget
│   │   └── ExpensesPieChart.jsx    # Graphique par catégorie (Recharts)
│   │
│   ├── expenses/
│   │   ├── ExpenseList.jsx
│   │   ├── ExpenseForm.jsx         # Modal ajout/édition
│   │   └── ExpenseItem.jsx
│   │
│   ├── revenues/
│   │   ├── RevenueList.jsx
│   │   ├── RevenueForm.jsx
│   │   └── RevenueItem.jsx
│   │
│   ├── savings/
│   │   ├── SavingsGoalCard.jsx     # Carte avec barre de progression
│   │   ├── SavingsGoalForm.jsx
│   │   └── DepositModal.jsx
│   │
│   ├── alerts/
│   │   └── AlertDropdown.jsx       # Dropdown depuis header
│   │
│   └── chat/
│       ├── ChatWindow.jsx
│       ├── ChatMessage.jsx
│       └── ChatInput.jsx
│
└── utils/
    ├── formatCurrency.js           # "1250.50" → "1 250,50 €"
    ├── formatDate.js
    └── constants.js                # Couleurs, niveaux d'alerte
```

---

## Fichiers clés

### `api/axios.js` — Instance Axios centrale

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rediriger vers login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### `context/AuthContext.jsx`

```jsx
import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/me')
        .then(res => setUser(res.data.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

---

### `App.jsx` — Routing

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import RevenuesPage from './pages/RevenuesPage';
import SavingsPage from './pages/SavingsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={
            <PrivateRoute><Layout /></PrivateRoute>
          }>
            <Route index                element={<DashboardPage />} />
            <Route path="expenses"      element={<ExpensesPage />} />
            <Route path="revenues"      element={<RevenuesPage />} />
            <Route path="savings"       element={<SavingsPage />} />
            <Route path="chat"          element={<ChatPage />} />
            <Route path="profile"       element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

### `pages/DashboardPage.jsx`

```jsx
import { useEffect, useState } from 'react';
import api from '../api/axios';
import SummaryCards from '../components/dashboard/SummaryCards';
import BudgetProgressBar from '../components/dashboard/BudgetProgressBar';
import ExpensesPieChart from '../components/dashboard/ExpensesPieChart';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      <SummaryCards data={data} />
      <BudgetProgressBar
        percent={data.budgetUsedPercent}
        spent={data.totalExpenses}
        budget={data.monthlyBudget}
      />
      <ExpensesPieChart categories={data.expensesByCategory} />
    </div>
  );
}
```

---

### `components/dashboard/BudgetProgressBar.jsx`

```jsx
import { formatCurrency } from '../../utils/formatCurrency';

export default function BudgetProgressBar({ percent, spent, budget }) {
  const color =
    percent >= 100 ? 'bg-red-500' :
    percent >= 90  ? 'bg-orange-500' :
    percent >= 80  ? 'bg-yellow-400' :
                     'bg-green-500';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex justify-between mb-2">
        <span className="font-medium text-gray-700">Budget mensuel</span>
        <span className="text-sm text-gray-500">
          {formatCurrency(spent)} / {formatCurrency(budget)}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-right font-semibold" style={{
        color: percent >= 100 ? '#ef4444' : percent >= 80 ? '#f97316' : '#22c55e'
      }}>
        {percent.toFixed(1)}% utilisé
      </p>
    </div>
  );
}
```

---

### `pages/ChatPage.jsx`

```jsx
import { useState } from 'react';
import api from '../api/axios';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant budget. Comment puis-je vous aider ?' }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await api.post('/chat', {
        message: text,
        conversationHistory: messages,
      });
      setMessages([...newMessages, { role: 'assistant', content: res.data.data.reply }]);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: "Désolé, je rencontre une difficulté. Réessayez dans un instant."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-pulse">Assistant en train de répondre...</div>
          </div>
        )}
      </div>
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
```

---

### `components/savings/SavingsGoalCard.jsx`

```jsx
import { formatCurrency } from '../../utils/formatCurrency';

export default function SavingsGoalCard({ goal, onDeposit, onDelete }) {
  const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const done = percent >= 100;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">{goal.name}</h3>
          {goal.deadline && (
            <p className="text-xs text-gray-400">Échéance : {goal.deadline}</p>
          )}
        </div>
        {done && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Atteint</span>}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${done ? 'bg-green-500' : 'bg-indigo-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <span>{formatCurrency(goal.currentAmount)}</span>
        <span className="font-medium">{percent.toFixed(0)}%</span>
        <span>{formatCurrency(goal.targetAmount)}</span>
      </div>

      <div className="flex gap-2">
        {!done && (
          <button
            onClick={() => onDeposit(goal)}
            className="flex-1 bg-indigo-600 text-white text-sm py-2 rounded-lg hover:bg-indigo-700"
          >
            + Verser
          </button>
        )}
        <button
          onClick={() => onDelete(goal.id)}
          className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
```

---

### `utils/formatCurrency.js`

```javascript
export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount ?? 0);
}
```

---

## Pages et navigation

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Formulaire de connexion |
| `/register` | RegisterPage | Formulaire d'inscription |
| `/` | DashboardPage | Résumé du mois, graphiques |
| `/expenses` | ExpensesPage | Liste + ajout dépenses |
| `/revenues` | RevenuesPage | Liste + ajout revenus |
| `/savings` | SavingsPage | Objectifs d'épargne |
| `/chat` | ChatPage | Assistant IA conversationnel |
| `/profile` | ProfilePage | Profil + budget mensuel |

---

## Sidebar (`components/layout/Sidebar.jsx`)

```jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingDown, TrendingUp,
  PiggyBank, MessageCircle, User
} from 'lucide-react';

const links = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses',  icon: TrendingDown,    label: 'Dépenses' },
  { to: '/revenues',  icon: TrendingUp,      label: 'Revenus' },
  { to: '/savings',   icon: PiggyBank,       label: 'Épargne' },
  { to: '/chat',      icon: MessageCircle,   label: 'Assistant IA' },
  { to: '/profile',   icon: User,            label: 'Profil' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-white border-r flex flex-col py-6 px-4 gap-1">
      <div className="text-xl font-bold text-indigo-600 mb-8 px-2">💰 BudgetSmart</div>
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
             ${isActive
               ? 'bg-indigo-50 text-indigo-600'
               : 'text-gray-600 hover:bg-gray-50'}`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
```
