# One-shot schema migrator image. The migrations are COPIED into the image
# (not bind-mounted) so `docker compose up` works even where host bind mounts
# are unavailable (e.g. an unshared Windows drive).
FROM postgres:16-alpine
COPY . /db
ENTRYPOINT ["sh", "/db/migrate.sh"]
