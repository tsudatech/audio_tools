FROM python:3.12

RUN apt-get update && apt-get install -y curl wget xz-utils \
      && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
      && apt-get install nodejs

WORKDIR /tmp

RUN wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz \
      && tar xvf ./ffmpeg-git-amd64-static.tar.xz \
      && cp ./ffmpeg*amd64-static/ffmpeg /usr/local/bin/

CMD /bin/bash

# 作業ディレクトリの設定
WORKDIR /app/frontend

# package.jsonとpackage-lock.jsonをコピー
COPY frontend/package*.json /app/frontend/

# Node.jsの依存パッケージをインストール
RUN npm install

# 残りのファイルをコピー
COPY . /app/

# Build static files
RUN npm run build

# Have to move all static files other than index.html to root/
# for whitenoise middleware
# WORKDIR /app/frontend/build
# RUN mkdir root && mv /app/frontend/static/* /app/frontend/build/root
# RUN mkdir /app/staticfiles

# 作業ディレクトリの設定
WORKDIR /app

# 必要なパッケージをインストール
RUN pip install --no-cache-dir -r requirements.txt

# Coolect static files
RUN python manage.py collectstatic --noinput

# データベースファイルを永続化するためのボリュームを作成
VOLUME /app/db_data

# ポートの公開
EXPOSE $PORT

# Djangoアプリの起動コマンド
CMD python3 manage.py runserver 0.0.0.0:$PORT