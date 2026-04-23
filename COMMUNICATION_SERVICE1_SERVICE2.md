# Communication entre Service1 et Service2 via RabbitMQ

## Architecture de communication

La communication entre service1 (Java/Spring Boot) et service2 (Node.js) est entièrement asynchrone via RabbitMQ.

### Flux de messages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RabbitMQ                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    Exchanges                                             ││
│  │  ┌──────────────────────────┐  ┌──────────────────────────────────────┐ ││
│  │  │ reservation.events.exchange│  │       user.events.exchange         │ ││
│  │  └────────────┬─────────────┘  └──────────────┬───────────────────────┘ ││
│  └───────────────┼────────────────────────────────┼────────────────────────┘│
│                  │                                │                         │
│  ┌───────────────▼────────────────────────────────▼───────────────────────┐│
│  │                         Queues                                          ││
│  │  ┌────────────────────────────┐  ┌──────────────────────────────────┐  ││
│  │  │ service2.reservation.confirmed│  │  service1.user.verified         │  ││
│  │  │ (consumé par service2)     │  │  (consumé par service1)          │  ││
│  │  └────────────────────────────┘  └──────────────────────────────────┘  ││
│  │  ┌────────────────────────────┐  ┌──────────────────────────────────┐  ││
│  │  │ service2.reservation.created│  │  service3.room.cleaned           │  ││
│  │  │ (pour service3)            │  │  (pour service1/service2)        │  ││
│  │  └────────────────────────────┘  └──────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

Service1 (Java)                          Service2 (Node.js)
├── Publie: user.verified              ├── Publie: reservation.created
├── Consomme: reservation.confirmed    ├── Publie: reservation.confirmed
│                                      ├── Publie: payment.done
│                                      └── Consomme: user.verified
```

## Événements échangés

### 1. Service1 → Service2: `USER_VERIFIED`

**Quand** : Quand un utilisateur vérifie son identité via `/users/verify-identity`

**Message** :
```json
{
  "type": "USER_VERIFIED",
  "userId": 123,
  "email": "client@example.com",
  "pieceIdentite": "CIN-123456",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**Consumer** : Service2 reçoit cet événement et peut :
- Mettre à jour une réservation associée
- Marquer le client comme vérifié

### 2. Service2 → Service1: `RESERVATION_CONFIRMED`

**Quand** : Quand une réservation est confirmée via `/reservations/:id/confirm`

**Message** :
```json
{
  "type": "RESERVATION_CONFIRMED",
  "reservationId": "65a1b2c3d4e5f6g7h8i9j0k",
  "clientId": "123",
  "chambreId": "65a1b2c3d4e5f6g7h8i9j0l",
  "statut": "confirmee",
  "timestamp": "2026-01-15T10:35:00Z"
}
```

**Consumer** : Service1 reçoit cet événement et peut :
- Vérifier que le client existe
- Lier la réservation au compte client
- Envoyer une notification

### 3. Service2 → Service3: `RESERVATION_CREATED`

**Quand** : Quand une nouvelle réservation est créée via `/reservations`

**Message** :
```json
{
  "type": "RESERVATION_CREATED",
  "reservationId": "65a1b2c3d4e5f6g7h8i9j0k",
  "clientId": "123",
  "chambreId": "65a1b2c3d4e5f6g7h8i9j0l",
  "dateArrivee": "2026-05-01",
  "dateDepart": "2026-05-03",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**Consumer** : Service3 reçoit cet événement et prépare les articles pour la chambre

### 4. Service2 → Service4: `PAYMENT_DONE`

**Quand** : Quand un paiement est enregistré via `/payments/:invoiceId`

**Message** :
```json
{
  "type": "PAYMENT_DONE",
  "paymentId": "65a1b2c3d4e5f6g7h8i9j0m",
  "invoiceId": "65a1b2c3d4e5f6g7h8i9j0n",
  "montant": 100000,
  "methode": "espece",
  "timestamp": "2026-01-15T11:00:00Z"
}
```

**Consumer** : Service4 reçoit cet événement et comptabilise le paiement

## Fichiers implémentés

### Service1 (Java/Spring Boot)

1. **`RabbitMQProducerConfig.java`** - Configuration des queues et exchanges pour l'envoi de messages
2. **`RabbitMQService.java`** - Service pour publier des événements (user.verified, room.cleaned)
3. **`ReservationConfirmedMessageHandler.java`** - Handler pour recevoir les événements de réservation confirmée
4. **`RoomCleanedMessageHandler.java`** - Handler existant pour recevoir les événements de chambre nettoyée
5. **`UserController.java`** - Met à jour pour publier l'événement user.verified

### Service2 (Node.js)

1. **`config/rabbitmq.js`** - Configuration de la connexion RabbitMQ, publication et consommation
2. **`services/message.service.js`** - Service pour publier et consommer des messages
3. **`controllers/reservation.controller.js`** - Publie les événements reservation.created et reservation.confirmed
4. **`controllers/payment.controller.js`** - Publie l'événement payment.done
5. **`index.js`** - Initialise RabbitMQ et configure les consumers

## Comment tester

### 1. Démarrer les services

```bash
docker-compose up --build
```

### 2. Vérifier RabbitMQ

Accédez à l'interface d'administration RabbitMQ : http://localhost:15673
- Username: `admin`
- Password: `secret`

Vous devriez voir les exchanges et queues créés.

### 3. Tester le flux USER_VERIFIED

```bash
# Créer un utilisateur
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

# Vérifier l'identité (déclenche l'événement USER_VERIFIED)
curl -X POST http://localhost:8080/service1/users/verify-identity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "email": "jean@hotel.mg",
    "pieceIdentite": "CIN-123456",
    "reservationId": "RES-123"
  }'
```

### 4. Tester le flux RESERVATION_CONFIRMED

```bash
# Créer une chambre
curl -X POST http://localhost:8080/service2/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "numero": "101",
    "categorie": "Standard",
    "tarif": 50000,
    "etage": 1
  }'

# Créer une réservation (déclenche l'événement RESERVATION_CREATED)
curl -X POST http://localhost:8080/service2/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "1",
    "chambreId": "<ROOM_ID>",
    "dateArrivee": "2026-05-01",
    "dateDepart": "2026-05-03"
  }'

# Confirmer la réservation (déclenche l'événement RESERVATION_CONFIRMED)
curl -X PUT http://localhost:8080/service2/reservations/<RESERVATION_ID>/confirm
```

### 5. Vérifier les logs

Les logs des services montreront les événements publiés et consommés :

```bash
# Logs service1
docker-compose logs -f service1

# Logs service2
docker-compose logs -f service2
```

## Résumé

La communication entre service1 et service2 est maintenant entièrement asynchrone via RabbitMQ :

- **Service1 → Service2** : `user.verified` (quand un utilisateur vérifie son identité)
- **Service2 → Service1** : `reservation.confirmed` (quand une réservation est confirmée)

Les services n'ont pas besoin de se connaître directement - ils communiquent via des événements, ce qui rend le système plus découplé et résilient.