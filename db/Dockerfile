# One-shot provisioner: apply migrations, then create the non-owner app role.
# Built from the repo root so it can copy both db/ (migrations) and
# infra/db/create-app-role.sh (role bootstrap) into the image.
FROM postgres:16-alpine
COPY db/ /db/
COPY infra/db/create-app-role.sh /db/create-app-role.sh
ENTRYPOINT ["sh", "-c", "/db/migrate.sh && /db/create-app-role.sh"]
