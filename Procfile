react-build: npm install --prefix frontend
react-build: npm run build --prefix frontend
release: python manage.py migrate
web: gunicorn pitchshifter.wsgi --log-file -
