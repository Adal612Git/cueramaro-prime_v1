#!/usr/bin/env bash
set -euo pipefail

# Simple pg_dump backup helper for local Docker setup
# Usage: ./tools/backup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"

DB_CONTAINER="${DB_CONTAINER:-cueramaro-db}"
PGUSER="${PGUSER:-user}"
PGDATABASE="${PGDATABASE:-cueramaro}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker no está instalado en el host" >&2
  exit 1
fi

STAMP="$(date +%F-%H%M%S)"
OUT_FILE="$BACKUP_DIR/db-$STAMP.dump.gz"

echo "→ Creando respaldo a $OUT_FILE (contenedor: $DB_CONTAINER, db: $PGDATABASE)"
set -o pipefail
docker exec -t "$DB_CONTAINER" pg_dump -U "$PGUSER" -d "$PGDATABASE" -F c | gzip > "$OUT_FILE"
echo "✓ Respaldo creado: $OUT_FILE"

if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "→ Limpiando respaldos con antigüedad > $RETENTION_DAYS días"
  find "$BACKUP_DIR" -type f -name 'db-*.dump.gz' -mtime +"$RETENTION_DAYS" -print -delete || true
fi

echo "Para restaurar en el contenedor ($DB_CONTAINER):"
echo "  gunzip -c $OUT_FILE | docker exec -i $DB_CONTAINER pg_restore -U $PGUSER -d $PGDATABASE --clean --if-exists"

