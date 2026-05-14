# 📡 Contrat API REST — BudgetSmart (Implémentation de Production)

## Conventions générales

- **Base URL** : `https://budgetsmart-backend.onrender.com/api`
- **Format** : JSON
- **Auth** : Header `Authorization: Bearer <JWT_TOKEN>` (sauf endpoints publics)
- **Dates** : ISO 8601 — `YYYY-MM-DD`
- **Montants** : Décimal

> **⚠️ NOTE IMPORTANTE** : Contrairement à la conception initiale, l'API retourne directement les DTOs (sans wrapper global `{"success":true, "data": ...}`). Les erreurs utilisent le format standard de Spring Boot ou le `GlobalExceptionHandler`.

---

## 🛠️ Endpoints de Santé et Info (Publics)

### `GET /api/health` — Santé de l'API
Endpoint de monitoring pour vérifier que l'application fonctionne correctement.
**Réponse 200 OK**
```json
{
  "application": "BudgetSmart",
  "version": "1.0.0", 
  "status": "UP",
  "timestamp": 1778551774976
}
```

### `GET /api/info` — Informations Système
**Réponse 200 OK**
```json
{
  "name": "BudgetSmart",
  "version": "1.0.0",
  "description": "Système de Gestion de Budget Intelligent",
  "java_version": "21.0.10",
  "os_name": "Linux"
}
```

---

## 🔐 1. Authentification

### `POST /api/auth/register` — Inscription
**Body**
```json
{
  "firstName": "Alice",
  "lastName": "Dupont",
  "email": "alice@example.com",
  "password": "MonMotDePasse123!"
}
```
**Réponse 200 OK**
```json
{
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "firstName": "Alice",
    "lastName": "Dupont",
    "fullName": "Alice Dupont",
    "email": "alice@example.com",
    "createdAt": "2025-05-11T12:00:00"
  },
  "status": "success",
  "timestamp": 1715000000000
}
```

### `POST /api/auth/login` — Connexion
**Body**
```json
{
  "email": "alice@example.com",
  "password": "MonMotDePasse123!"
}
```
**Réponse 200 OK** (Même structure que Register)

### `GET /api/auth/me` — Profil courant
**Réponse 200 OK**
```json
{
  "id": 1,
  "firstName": "Alice",
  "lastName": "Dupont",
  "fullName": "Alice Dupont",
  "email": "alice@example.com",
  "monthlyBudget": 2500.00,
  "createdAt": "2025-05-11T12:00:00"
}
```

### `PUT /api/auth/profile` — Mettre à jour le profil
**Body** (Tous les champs sont optionnels)
```json
{
  "firstName": "Alice (Modifié)",
  "lastName": "Dupont",
  "email": "alice.new@example.com",
  "monthlyBudget": 3000.00
}
```
**Réponse 200 OK** (Retourne le profil UserInfo mis à jour)

### `PUT /api/auth/password` — Changer le mot de passe
**Body**
```json
{
  "oldPassword": "MonMotDePasse123!",
  "newPassword": "MonNouveauMotDePasse456!"
}
```
**Réponse 200 OK**
```json
{
  "message": "Mot de passe changé avec succès",
  "status": "success",
  "timestamp": 1715000000000
}
```

---

## 📂 2. Catégories

### `GET /api/categories` — Liste des catégories
**Query params** : `?type=EXPENSE` ou `?type=REVENUE` (optionnel)
**Réponse 200 OK**
```json
[
  { "id": 1, "name": "Alimentation", "type": "EXPENSE", "color": "#ef4444" },
  { "id": 2, "name": "Salaire",      "type": "REVENUE", "color": "#22c55e" }
]
```

### `POST /api/categories` — Créer une catégorie
**Body**
```json
{
  "name": "Abonnements",
  "type": "EXPENSE",
  "color": "#a855f7"
}
```
**Réponse 201 Created** (Retourne l'objet complet avec `id`)

### `DELETE /api/categories/{id}` — Supprimer
**Réponse 204 No Content**

---

## 💸 3. Dépenses

### `GET /api/expenses` — Liste paginée
**Query params** : `page`, `size`
**Réponse 200 OK**
```json
{
  "content": [
    {
      "id": 1,
      "amount": 120.50,
      "description": "Courses",
      "date": "2025-05-03",
      "category": { "id": 1, "name": "Alimentation", "color": "#ef4444" },
      "createdAt": "2025-05-03T10:00:00"
    }
  ],
  "pageable": { ... },
  "totalElements": 1,
  "totalPages": 1
}
```

### `POST /api/expenses` — Ajouter une dépense
**Body**
```json
{
  "amount": 120.50,
  "description": "Courses",
  "date": "2025-05-03",
  "categoryId": 1
}
```
**Réponse 200 OK** (Retourne la dépense créée)

### `GET /api/expenses/summary/{year}/{month}` — Résumé mensuel
**Réponse 200 OK**
```json
{
  "year": 2025,
  "month": 5,
  "totalRevenues": 2500.00,
  "totalExpenses": 120.50,
  "balance": 2379.50,
  "expensesByCategory": {
    "Alimentation": 120.50
  }
}
```

---

## 💰 4. Revenus

Structure identique aux Dépenses.
- `GET /api/revenues`
- `POST /api/revenues`
- `GET /api/revenues/{id}`
- `PUT /api/revenues/{id}`
- `DELETE /api/revenues/{id}`

---

## 🏦 5. Épargne

### `GET /api/savings` — Liste des objectifs
**Réponse 200 OK**
```json
[
  {
    "id": 1,
    "goalName": "Voyage",
    "targetAmount": 3000.00,
    "currentAmount": 850.00,
    "progressPercent": 28.3,
    "remaining": 2150.00,
    "targetDate": "2025-12-01",
    "completed": false,
    "createdAt": "2025-05-11T12:00:00"
  }
]
```

### `POST /api/savings` — Créer
**Body**
```json
{
  "goalName": "Voyage",
  "targetAmount": 3000.00,
  "targetDate": "2025-12-01"
}
```

### `POST /api/savings/{id}/add` — Ajouter des fonds
**Body**
```json
{
  "amount": 200.00
}
```
**Réponse 200 OK** (Retourne l'objectif mis à jour)

---

## ⚠️ 6. Alertes (Triggers PostgreSQL)

### `GET /api/alerts` — Toutes les alertes
### `GET /api/alerts/unread` — Alertes non lues
**Réponse 200 OK**
```json
[
  {
    "id": 3,
    "level": "WARNING",
    "message": "Dépassement de budget...",
    "read": false,
    "createdAt": "2025-05-10T14:32:00"
  }
]
```

### `GET /api/alerts/stats` — Compteurs
**Réponse 200 OK**
```json
{
  "total": 5,
  "unread": 2
}
```

---

## 🤖 7. Chat IA (n8n Integration)

### `POST /api/chat/message` — Poser une question à l'IA
**Body**
```json
{
  "question": "Combien ai-je dépensé ce mois-ci ?"
}
```
**Réponse 200 OK**
```json
{
  "response": "Ce mois-ci, vous avez dépensé **120.50 MGA**. Votre solde est de **2379.50 MGA**.",
  "suggestions": [
    "Voir le résumé mensuel complet",
    "Ajouter un objectif d'épargne"
  ],
  "timestamp": "2025-05-11T12:05:00",
  "processingTime": 1.2,
  "sessionId": "uuid-...",
  "metadata": {
    "userId": 1,
    "n8nCalled": true
  }
}
```

### `GET /api/chat/status` — Statut de la connexion n8n
**Réponse 200 OK**
```json
{
  "status": "active",
  "version": "2.0.0",
  "n8nConnected": true,
  "claudeApiStatus": "via_n8n"
}
```

### `POST /api/chat/webhook/n8n` — Webhook Entrant (pour n8n)
**Accès** : Public (Sécurisé par clé API n8n dans le header `X-n8n-api-key`)
**Body**
```json
{
  "query": "Question...",
  "userId": 1,
  "context": { ... }
}
```

---

## 📖 8. Documentation Interactive (Swagger)

**URL** : `https://budgetsmart-backend.onrender.com/api/swagger-ui.html`

---

## ⚙️ 9. Variables d'Environnement (Configuration)

Pour l'intégration n8n, configurez ces variables dans `.env` :

```bash
# Configuration n8n
N8N_WEBHOOK_URL=https://rtsikynyantsa-jerymotro-pipeline.hf.space/webhook/a0951c35-d2ee-4c99-8042-39e1053abbfd
N8N_API_KEY=votre-clé-api-n8n-secrète
N8N_TIMEOUT=30000

# Configuration Claude API (utilisée par n8n)
ANTHROPIC_API_KEY=sk-ant-votre-clé-anthropic
```

---
*Dernière mise à jour : 13 Mai 2026*
