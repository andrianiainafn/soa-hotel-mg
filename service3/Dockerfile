## Dockerfile pour le service Python "service3"
## NOTE: dans ce repo, seul un `venv/` est présent pour l'instant.
## Ce Dockerfile est donc une base: il tentera d'installer `requirements.txt` si présent,
## puis lance `python main.py`.

FROM python:3.11-slim
WORKDIR /app

# Copier le code (ex: main.py, src/, ...)
# Note: on évite de faire un `COPY requirements.txt` car le fichier peut ne pas exister.
COPY . .

# Installer les dépendances si un requirements.txt existe
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

EXPOSE 8082
CMD ["python","main.py"]

