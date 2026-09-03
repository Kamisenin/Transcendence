FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
COPY entrypoint.sh /bin/entrypoint.sh

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001


ENTRYPOINT ["/bin/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]