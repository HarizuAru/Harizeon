# Harizeon data-plane worker. Deliberately holds NO database credentials — its
# only inputs are the queue and the job payload (§06.3).
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "worker.py"]
