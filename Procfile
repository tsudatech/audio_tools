web: gunicorn pitchshifter.wsgi --log-file -
react-build: npm install --prefix frontend
react-build: npm run build --prefix frontend
release: python manage.py collectstatic
release: python manage.py migrate