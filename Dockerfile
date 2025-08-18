FROM python:3.11

RUN apt-get update && apt-get install -y curl wget xz-utils \
      && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
      && apt-get install nodejs ffmpeg libsm6 libxext6  -y

WORKDIR /tmp

RUN wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz \
      && tar xvf ./ffmpeg-git-amd64-static.tar.xz \
      && cp ./ffmpeg*amd64-static/ffmpeg /usr/local/bin/ \
      && cp ./ffmpeg*amd64-static/ffprobe /usr/local/bin/

# 作業ディレクトリの設定
WORKDIR /app

# フロントエンドの依存関係をインストール
WORKDIR /app/frontend

# package.jsonとpackage-lock.jsonをコピー
COPY frontend/package*.json ./

# Node.jsの依存パッケージをインストール
RUN npm install

# フロントエンドのソースコードをコピー
COPY frontend/ ./

# フロントエンドをビルド
RUN npm run build

# バックエンドの設定
WORKDIR /app/backend

# Pythonの依存関係をインストール
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# バックエンドのソースコードをコピー
COPY backend/ ./

# 静的ファイルを収集
RUN python manage.py collectstatic --noinput

# データベースのマイグレーション
RUN python manage.py migrate

# データベースファイルを永続化するためのボリュームを作成
VOLUME /app/backend/db_data

# ポートの公開
EXPOSE $PORT

# Djangoアプリの起動コマンド
CMD python /app/backend/manage.py runserver 0.0.0.0:$PORT