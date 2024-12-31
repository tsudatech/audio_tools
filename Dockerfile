FROM ubuntu:20.04

RUN apt-get update && apt-get install -y \
      wget \
      xz-utils

WORKDIR /tmp

RUN wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz \
      && tar xvf ./ffmpeg-git-amd64-static.tar.xz \
      && cp ./ffmpeg*amd64-static/ffmpeg /usr/local/bin/

CMD /bin/bash

# Node.jsの公式イメージを使用
FROM node:18.12.1 as build

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
WORKDIR /app/frontend/build
RUN mkdir root && mv /app/frontend/static/* /app/frontend/build/root
RUN mkdir /app/staticfiles

# Djangoアプリ用のイメージをベースに
FROM python:3.9

# 作業ディレクトリの設定
WORKDIR /app

# 必要なパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Coolect static files
RUN pwd
RUN ls frontend
RUN python ./manage.py collectstatic --noinput
RUN ls staticfiles

# データベースファイルを永続化するためのボリュームを作成
VOLUME /app/db_data

# ポートの公開
EXPOSE $PORT

# Djangoアプリの起動コマンド
CMD python3 manage.py runserver 0.0.0.0:$PORT