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
FROM node:14 as build

# 作業ディレクトリの設定
WORKDIR /app/frontend

# package.jsonとpackage-lock.jsonをコピー
COPY frontend/package*.json ./

# Node.jsの依存パッケージをインストール
RUN npm install
RUN npm run build

# 残りのフロントエンドファイルをコピー
COPY frontend/ .

# Djangoアプリ用のイメージをベースに
FROM python:3.9

# 作業ディレクトリの設定
WORKDIR /app

# 必要なパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 残りのファイルをコピー
COPY . .

# データベースファイルを永続化するためのボリュームを作成
VOLUME /app/db_data

# ポートの公開
EXPOSE 8000

# Djangoアプリの起動コマンド
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]