# Intentionally-vulnerable sandbox target. Local demos/tests only.
FROM python:3.12-alpine

WORKDIR /app
COPY target.py .

ENV PORT=80
EXPOSE 80

# Port 80 needs root inside the container; nothing else runs here.
CMD ["python", "target.py"]
