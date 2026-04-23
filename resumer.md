# Projet SOA — Système de Gestion Hôtel & Restaurant

## Vue d'ensemble

Application microservices pour la gestion d'un hôtel et restaurant. Le client réserve une chambre via un site web, la réceptionniste valide le check-in, les femmes de ménage notifient après nettoyage, et le comptable consulte les rapports journaliers.

---

## Architecture globale

```
Client (web/mobile)
        ↓
API Gateway (Java Spring Cloud - port 8080)
        ↓
┌───────────────────────────────────────────┐
│  service1    service2    service3          │
│  Java        Node.js     Python            │
│  port 3001   port 8081   port 8082         │
└───────────────────────────────────────────┘
        ↕ (asynchrone)
    RabbitMQ (port 5672 / admin: 15673)
        ↕
┌───────────────────────────────────────────┐
│  PostgreSQL   MongoDB    PostgreSQL        │
│  (authdb)     (service1db) (service3db)   │
│  port 5434    port 27017   port 5433       │
└───────────────────────────────────────────┘
```

---

## Structure du projet

```
SOA/
├── docker-compose.yml
├── gateway/
│   ├── Dockerfile
│   └── src/main/resources/application.yml
├── service1/                        # Java Spring Boot — Auth & Users
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/example/service1/
│       ├── Service1Application.java
│       ├── entity/User.java
│       ├── enums/Role.java
│       ├── repository/UserRepository.java
│       ├── dto/RegisterRequest.java
│       ├── dto/LoginRequest.java
│       ├── dto/UserResponse.java
│       ├── service/UserService.java
│       ├── controller/UserController.java
│       └── config/SecurityConfig.java
├── service2/                        # Node.js — Réservation & Paiement
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   ├── models/
│   │   ├── Room.js
│   │   ├── Reservation.js
│   │   ├── Invoice.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── room.routes.js
│   │   ├── reservation.routes.js
│   │   ├── invoice.routes.js
│   │   └── payment.routes.js
│   ├── controllers/
│   │   ├── room.controller.js
│   │   ├── reservation.controller.js
│   │   ├── invoice.controller.js
│   │   └── payment.controller.js
│   └── services/
│       ├── room.service.js
│       ├── reservation.service.js
│       ├── invoice.service.js
│       └── payment.service.js
├── service3/                        # Python — Stock & Ménage
│   ├── Dockerfile
│   └── main.py
└── service4/                        # Go — Comptabilité & Restaurant (à compléter)
    ├── Dockerfile
    ├── go.mod
    └── main.go
```

---

## Services

### API Gateway — Java Spring Cloud Gateway
- **Port** : 8080
- **Rôle** : Point d'entrée unique, redirige vers les services selon le path
- **Routes** :
  - `/service1/**` → service1:3001
  - `/service2/**` → service2:8081
  - `/service3/**` → service3:8082
- **Config** : `gateway/src/main/resources/application.yml`
- **Timeout** : connect 3s, response 5s

---

### Service 1 — Java Spring Boot (Auth & Users)
- **Port** : 3001
- **Base de données** : PostgreSQL (`postgres1:5432/authdb`)
- **Rôle** : Gestion des utilisateurs et authentification

#### Rôles utilisateurs
| Rôle | Description |
|------|-------------|
| CLIENT | Réserve une chambre via le site |
| RECEPTIONNISTE | Valide check-in, encaisse |
| FEMME_MENAGE | Notifie après nettoyage |
| COMPTABLE | Consulte les rapports |
| ADMIN | Gère tout |

#### Endpoints
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/users/register` | Créer un utilisateur |
| POST | `/users/login` | Connexion |
| GET | `/users` | Liste tous les utilisateurs |
| GET | `/users/{id}` | Détail d'un utilisateur |
| GET | `/users/role/{role}` | Utilisateurs par rôle |
| PUT | `/users/{id}/deactivate` | Désactiver un compte |
| GET | `/users/health` | Health check |

#### Modèle User
```json
{
  "id": 1,
  "nom": "Rakoto",
  "prenom": "Jean",
  "email": "jean@hotel.mg",
  "password": "bcrypt",
  "role": "CLIENT",
  "pieceIdentite": "CIN-123456",
  "actif": true,
  "createdAt": "2026-01-01T00:00:00"
}
```

#### Variables d'environnement
```
SPRING_RABBITMQ_HOST=rabbitmq
SPRING_RABBITMQ_USERNAME=admin
SPRING_RABBITMQ_PASSWORD=secret
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres1:5432/authdb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=secret
```

#### Dépendances pom.xml
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-amqp
- postgresql (driver)
- lombok

---

### Service 2 — Node.js Express (Réservation & Paiement)
- **Port** : 8081
- **Base de données** : MongoDB (`mongo1:27017/service1db`)
- **Rôle** : Gestion des chambres, réservations, factures et paiements

#### Endpoints
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/rooms` | Liste toutes les chambres |
| GET | `/rooms/available` | Chambres disponibles |
| GET | `/rooms/:id` | Détail d'une chambre |
| POST | `/rooms` | Créer une chambre |
| PUT | `/rooms/:id/status` | Changer le statut |
| GET | `/reservations` | Liste les réservations |
| GET | `/reservations/:id` | Détail d'une réservation |
| POST | `/reservations` | Créer une réservation |
| PUT | `/reservations/:id/confirm` | Confirmer |
| PUT | `/reservations/:id/cancel` | Annuler |
| POST | `/invoices/:reservationId` | Générer une facture |
| GET | `/invoices/:id` | Voir une facture |
| PUT | `/invoices/:id/add-restaurant` | Ajouter montant restaurant |
| POST | `/payments/:invoiceId` | Enregistrer un paiement |
| GET | `/payments/:id` | Voir un paiement |
| GET | `/health` | Health check |

#### Modèles MongoDB
```
Room        : numero, categorie, tarif, statut, etage
Reservation : clientId, chambreId, dateArrivee, dateDepart, nombreNuits, statut
Invoice     : reservationId, clientId, chambre{}, montantChambre, montantRestaurant, montantTotal, statut
Payment     : factureId, montant, methode, statut
```

#### Catégories de chambres
- Standard
- Suite Senior
- Suite Prestige

#### Variables d'environnement
```
MONGODB_URL=mongodb://mongo1:27017/service1db
RABBITMQ_URL=amqp://admin:secret@rabbitmq:5672
PORT=8081
```

#### Dépendances npm
- express
- mongoose
- amqplib

---

### Service 3 — Python (Stock & Ménage)
- **Port** : 8082
- **Base de données** : PostgreSQL (`postgres2:5432/service3db`)
- **Rôle** : Gestion du stock des articles par chambre et notifications ménage
- **État** : Basique — uniquement `/test` endpoint pour l'instant, à compléter

#### Fonctionnalités à implémenter
- Gérer le stock des articles par chambre (gel douche, pantoufle, brosse à dent, papier hygiénique)
- Décrémenter le stock à chaque réservation
- Recevoir notification de la femme de ménage quand chambre nettoyée
- Notifier la réceptionniste qu'une chambre est propre
- Alerter quand stock bas

#### Variables d'environnement
```
RABBITMQ_URL=amqp://admin:secret@rabbitmq:5672
DATABASE_URL=postgresql+asyncpg://postgres:secret@postgres2:5432/service3db
PORT=8082
```

#### Dépendances pip
- fastapi
- uvicorn
- aio-pika
- sqlalchemy
- asyncpg
- pydantic
- python-jose

---

### Service 4 — Go (Comptabilité & Restaurant)
- **Port** : 8083
- **Base de données** : MySQL (`mysql1:3306/service4db`) — pas encore dans le docker-compose
- **État** : Basique — uniquement `/test` endpoint, à compléter

#### Fonctionnalités à implémenter
- Recevoir et comptabiliser toutes les factures du jour
- Générer tableau de bord journalier (chambres vendues vs articles consommés)
- Gérer les commandes restaurant
- Additionner facture restaurant à la facture chambre
- Diffuser les menus sur le site web

#### Dépendances Go
- github.com/gin-gonic/gin
- github.com/rabbitmq/amqp091-go

---

## RabbitMQ — Communication entre services

- **Port AMQP** : 5672
- **Interface admin** : http://localhost:15673 (admin/secret)

### Queues prévues
| Queue | Publisher | Consumer |
|-------|-----------|----------|
| `service2.reservation.created` | service2 | service3 |
| `service2.payment.done` | service2 | service4 |
| `service3.room.cleaned` | service3 | service1 |
| `service3.stock.updated` | service3 | service4 |
| `service4.invoice.counted` | service4 | — |

### Événements
| Événement | Déclencheur | Action |
|-----------|-------------|--------|
| RESERVATION_CREATED | Client réserve | service3 prépare les articles |
| PAYMENT_DONE | Paiement encaissé | service4 comptabilise |
| ROOM_CLEANED | Femme de ménage notifie | service1 remet la chambre disponible |
| STOCK_UPDATED | Articles remplacés | service4 met à jour le tableau de bord |

> **Note** : La communication RabbitMQ est définie mais pas encore implémentée dans les services. À faire.

---

## docker-compose.yml

```yaml
version: '3.8'
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15673:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: secret

  gateway:
    build: ./gateway
    ports:
      - "8080:8080"
    depends_on: [rabbitmq, service1, service2, service3]

  service1:
    build: ./service1
    ports:
      - "3001:3001"
    restart: unless-stopped
    environment:
      SPRING_RABBITMQ_HOST: rabbitmq
      SPRING_RABBITMQ_USERNAME: admin
      SPRING_RABBITMQ_PASSWORD: secret
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres1:5432/authdb
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: secret
    depends_on: [rabbitmq, postgres1]

  service2:
    build: ./service2
    ports:
      - "8081:8081"
    environment:
      RABBITMQ_URL: amqp://admin:secret@rabbitmq:5672
      MONGODB_URL: mongodb://mongo1:27017/service1db
    depends_on: [rabbitmq, mongo1]

  service3:
    build: ./service3
    ports:
      - "8082:8082"
    environment:
      RABBITMQ_URL: amqp://admin:secret@rabbitmq:5672
      DATABASE_URL: postgresql+asyncpg://postgres:secret@postgres2:5432/service3db
    depends_on: [rabbitmq, postgres2]

  mongo1:
    image: mongo:7
    ports:
      - "27017:27017"

  postgres1:
    image: postgres:16
    ports:
      - "5434:5432"
    environment:
      POSTGRES_DB: authdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret

  postgres2:
    image: postgres:16
    ports:
      - "5433:5432"
    environment:
      POSTGRES_DB: service3db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
```

---

## Commandes utiles

```bash
# Lancer tout
docker-compose up --build

# Arrêter tout
docker-compose down

# Rebuild un seul service
docker-compose build service2
docker-compose up -d service2

# Voir les logs d'un service
docker-compose logs -f service2

# Tester les health checks
curl http://localhost:8080/service1/users/health
curl http://localhost:8080/service2/health
curl http://localhost:8080/service3/test
```

---

## Tests rapides

```bash
# Créer un utilisateur client
curl -X POST http://localhost:8080/service1/users/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Rakoto","prenom":"Jean","email":"jean@hotel.mg","password":"1234","role":"CLIENT","pieceIdentite":"CIN-123456"}'

# Login
curl -X POST http://localhost:8080/service1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean@hotel.mg","password":"1234"}'

# Créer une chambre
curl -X POST http://localhost:8080/service2/rooms \
  -H "Content-Type: application/json" \
  -d '{"numero":"101","categorie":"Standard","tarif":50000,"etage":1}'

# Chambres disponibles
curl http://localhost:8080/service2/rooms/available

# Créer une réservation
curl -X POST http://localhost:8080/service2/reservations \
  -H "Content-Type: application/json" \
  -d '{"clientId":"1","chambreId":"<room_id>","dateArrivee":"2026-05-01","dateDepart":"2026-05-03"}'

# Générer une facture
curl -X POST http://localhost:8080/service2/invoices/<reservationId>

# Enregistrer un paiement
curl -X POST http://localhost:8080/service2/payments/<invoiceId> \
  -H "Content-Type: application/json" \
  -d '{"methode":"espece"}'
```

---

## Ce qui reste à faire

### Priorité haute
- [ ] Implémenter les endpoints service3 (Python) — stock et ménage
- [ ] Implémenter les endpoints service4 (Go) — comptabilité et restaurant
- [ ] Connecter service4 à MySQL dans le docker-compose
- [ ] Implémenter la communication RabbitMQ entre les services

### Priorité moyenne
- [ ] Ajouter JWT pour l'authentification dans service1
- [ ] Protéger les routes selon les rôles (CLIENT, RECEPTIONNISTE, etc.)
- [ ] Ajouter la validation des données (service1 et service2)
- [ ] Gestion des erreurs globale dans service2

### Priorité basse
- [ ] Ajouter service4 dans le docker-compose
- [ ] Implémenter le tableau de bord comptable
- [ ] Gestion des menus restaurant
- [ ] Page Facebook integration (notifications)
- [ ] Tests unitaires et d'intégration

---

## Notes importantes

- **Nommage** : `/service1` dans le dossier = Java (Auth/User), `/service2` = Node.js (Réservation). Les noms de dossiers ne correspondent pas aux technologies — se référer à ce document.
- **Pas de .env** : Tout est géré via les variables d'environnement dans `docker-compose.yml`.
- **MongoDB** : Pas de migration nécessaire, les collections se créent automatiquement.
- **PostgreSQL** : Spring Boot gère la création des tables via `spring.jpa.hibernate.ddl-auto=update`.
- **Security** : Spring Security est configuré pour tout autoriser (`permitAll`) pour l'instant — à sécuriser avant la production.
Service 2 — Node.js (Réservation & Paiement)
Ce que l'app fait automatiquement :

Afficher les chambres disponibles (Standard, Suite Senior, Suite Prestige) avec leurs tarifs
Permettre au client de réserver une chambre via le site web
Générer automatiquement la facture après réservation
Enregistrer le paiement encaissé
Notifier Service 3 qu'une chambre est vendue (pour préparer les articles)
Notifier Service 4 qu'une facture est créée (pour la comptabilité)


Service 1  — Java (Auth + Réceptionniste)
Ce que l'app fait automatiquement :

Gérer la connexion du client et du personnel (réceptionniste, femme de ménage, comptable)
Enregistrer la pièce d'identité du client lors du check-in
Recevoir la notification que la chambre est propre et la remettre en disponible
Bloquer la vente d'une chambre non nettoyée


Service 3 — Python (Stock & Ménage)
Ce que l'app fait automatiquement :

Gérer le stock des articles par chambre (gel douche, pantoufle, brosse à dent, papier hygiénique)
Décrémenter le stock automatiquement à chaque réservation
Recevoir la notification de la femme de ménage quand une chambre est nettoyée
Notifier la réceptionniste qu'une chambre est propre et disponible
Alerter quand le stock d'articles est bas


Service 4 — Go (Comptabilité & Restaurant)
Ce que l'app fait automatiquement :

Recevoir et comptabiliser toutes les factures du jour
Générer le tableau de bord journalier (chambres vendues vs articles consommés)
Gérer les commandes du restaurant
Additionner la facture restaurant à la facture chambre si le client mange au restaurant
Afficher les menus du restaurant sur le site web et Facebook
    




docker-compose down
docker-compose up --build

# Créer un client
curl -X POST http://localhost:8080/service1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Rakoto",
    "prenom": "Jean",
    "email": "jean@hotel.mg",
    "password": "1234",
    "role": "CLIENT",
    "pieceIdentite": "CIN-123456"
  }'

# Créer une réceptionniste
curl -X POST http://localhost:8080/service1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Rasoa",
    "prenom": "Marie",
    "email": "marie@hotel.mg",
    "password": "1234",
    "role": "RECEPTIONNISTE"
  }'

# Login
curl -X POST http://localhost:8080/service1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jean@hotel.mg", "password": "1234"}'

# Voir tous les users
curl http://localhost:8080/service1/users

# Voir par rôle
curl http://localhost:8080/service1/users/role/CLIENT