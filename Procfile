web: gunicorn audio_tools.wsgi --log-file -
react-build: npm install --prefix frontend
react-build: npm run build --prefix frontend
release: python manage.py migrate