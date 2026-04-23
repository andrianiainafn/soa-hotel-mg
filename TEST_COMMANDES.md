# Commandes pour tester la communication Service1 ↔ Service2

## 1. Démarrer les services

```bash
docker-compose up --build
```

## 2. Vérifier que les services sont prêts

```bash
# Health check Service1
curl http://localhost:8080/service1/users/health

# Health check Service2
curl http://localhost:8080/service2/health
```

## 3. Tester le flux USER_VERIFIED (Service1 → Service2)

```bash
# Créer un utilisateur
curl -X POST http://localhost:8080/service1/users/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","prenom":"Client","email":"test@hotel.mg","password":"1234","role":"CLIENT","pieceIdentite":"CIN-TEST123"}'

# Vérifier l'identité (déclenche l'événement USER_VERIFIED)
curl -X POST http://localhost:8080/service1/users/verify-identity \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"email":"test@hotel.mg","pieceIdentite":"CIN-TEST123","reservationId":"RES-123"}'
```

## 4. Tester le flux RESERVATION_CONFIRMED (Service2 → Service1)

```bash
# Créer une chambre
curl -X POST http://localhost:8080/service2/rooms \
  -H "Content-Type: application/json" \
  -d '{"numero":"201","categorie":"Standard","tarif":50000,"etage":2}'

# Créer une réservation (déclenche RESERVATION_CREATED)
curl -X POST http://localhost:8080/service2/reservations \
  -H "Content-Type: application/json" \
  -d '{"clientId":"1","chambreId":"<ROOM_ID>","dateArrivee":"2026-05-01","dateDepart":"2026-05-03"}'

# Confirmer la réservation (déclenche RESERVATION_CONFIRMED)
curl -X PUT http://localhost:8080/service2/reservations/69de7716fb8c9ac1a40b82a9/confirm
```

## 5. Vérifier les logs

```bash
# Logs Service1 (réception RESERVATION_CONFIRMED)
docker-compose logs service1 | grep "RESERVATION_CONFIRMED"

# Logs Service2 (réception USER_VERIFIED)
docker-compose logs service2 | grep "Utilisateur vérifié"

# Logs Service2 (publication événements)
docker-compose logs service2 | grep "Publié"
```

## 6. Vérifier RabbitMQ

- Interface : http://localhost:15673
- Login : admin / secret
- Vérifier les exchanges : `reservation.events.exchange`, `user.events.exchange`
- Vérifier les queues : `service2.reservation.confirmed`, `service1.user.verified`

## 7. Arrêter les services

```bash
docker-compose down