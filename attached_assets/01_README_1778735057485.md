# 💰 BudgetSmart — Système de Gestion de Budget Intelligent

## Vue d'ensemble

BudgetSmart est une application web de gestion de budget personnel combinant :
- Suivi des revenus et dépenses
- Module d'épargne avec objectifs
- Alertes automatiques (triggers PostgreSQL)
- Assistant IA conversationnel

---

## Stack Technique

| Couche      | Technologie          | Version recommandée |
|-------------|----------------------|---------------------|
| Base de données | PostgreSQL       | 15+                 |
| Backend     | Java / Spring Boot   | 17 / 3.2+           |
| Frontend    | React                | 18+                 |
| Auth        | JWT                  | —                   |
| IA Chat     | Claude API (Anthropic) | claude-sonnet-4   |

---

## Fichiers de conception

| Fichier | Contenu |
|---------|---------|
| `02_DATABASE.md` | Schéma PostgreSQL complet (tables, triggers, indexes) |
| `03_API_CONTRACT.md` | Contrat API REST détaillé avec exemples JSON |
| `04_BACKEND.md` | Structure Spring Boot (packages, classes, config) |
| `05_FRONTEND.md` | Structure React (pages, composants, services) |

---

## Architecture globale

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│   Login │ Dashboard │ Dépenses │ Épargne │ Chat IA  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / REST (JWT)
┌──────────────────────▼──────────────────────────────┐
│                 BACKEND (Spring Boot)                │
│  AuthController │ BudgetController │ ChatController  │
│  Services │ Repositories │ JWT Filter │ DTOs         │
└──────────────────────┬──────────────────────────────┘
                       │ JDBC / JPA
┌──────────────────────▼──────────────────────────────┐
│              BASE DE DONNÉES (PostgreSQL)            │
│  users │ revenues │ expenses │ savings │ alerts      │
│  categories │ TRIGGERS automatiques                  │
└─────────────────────────────────────────────────────┘
```

---

## Flux utilisateur principal

```
1. Inscription / Connexion  →  JWT token retourné
2. Ajout d'une dépense      →  Trigger vérifie le budget
3. Seuil dépassé            →  Alerte créée en BDD
4. Chat IA                  →  Analyse des données du compte
5. Dashboard                →  Visualisation en temps réel
```

---

## Variables d'environnement Backend

```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/budgetsmart
spring.datasource.username=postgres
spring.datasource.password=secret

jwt.secret=your-256-bit-secret
jwt.expiration=86400000

anthropic.api.key=sk-ant-...
```

---

## Lancement rapide

```bash
# Base de données
psql -U postgres -c "CREATE DATABASE budgetsmart;"
psql -U postgres -d budgetsmart -f schema.sql

# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm start
```
