#!/usr/bin/env bash
BACKUP_FILE="$1"

if [ -n "${BACKUP_FILE}" ]; then
    docker-compose cp "${BACKUP_FILE}" 'database:/tmp/backup.sqlz'
    docker-compose exec -u 'postgres' 'database' pg_restore -v -d 'compreg' -U 'compreg' '/tmp/backup.sqlz'
else
    echo "Usage: $0 <backup-file>"
    exit 1
fi
