web: gunicorn audio_tools.wsgi --log-file -
react-build: npm install --prefix frontend && npm run build --prefix frontend
release: python /app/backend/manage.py migrate
