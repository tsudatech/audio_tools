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
COPY frontend/ .

# Node.jsの依存パッケージをインストール
RUN npm install
RUN npm run build

COPY frontend/static .

# Djangoアプリ用のイメージをベースに
FROM python:3.9

# 作業ディレクトリの設定
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBUG 0

# 必要なパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 残りのファイルをコピー
COPY . .

RUN python manage.py collectstatic --noinput

# データベースファイルを永続化するためのボリュームを作成
VOLUME /app/db_data

# ポートの公開
# EXPOSE $PORT

# Djangoアプリの起動コマンド
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
CMD gunicorn audio_tools.wsgi:application --bind 0.0.0.0:$PORT