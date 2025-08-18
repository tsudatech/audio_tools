web: gunicorn config.wsgi --log-file -
react-build: npm install --prefix frontend
react-build: npm run build --prefix frontend
release: python /app/backend/manage.py migrate