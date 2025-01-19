# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.gcc
    pkgs.ffmpeg
    pkgs.nodePackages.firebase-tools
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.heroku
  ];
  # Sets environment variables in the workspace
  env = {};
  services.postgres = {
      extensions = ["pgvector"];
      enable = true;
  };
  idx = {
    # # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    # extensions = [
    #   "Dart-Code.flutter"
    #   "Dart-Code.dart-code"
    # ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        build = ''
          python3 -m venv venv
          cd frontend
          npm install
          # source venv/bin/activate
          # pip install -r requirements.txt
          # python manage.py migrate
          # python manage.py collectstatic
          # python manage.py runserver
          # npm run dev
          # heroku login -i
          # heroku git:remote -a angocat-tools-staging 
        '';
      };
      
    #   # To run something each time the workspace is (re)started, use the `onStart` hook
    # };
    # # Enable previews and customize configuration
    # previews = {
    #   enable = true;
    #   previews = {
    #     web = {
    #       command = ["flutter" "run" "--machine" "-d" "web-server" "--web-hostname" "0.0.0.0" "--web-port" "$PORT"];
    #       manager = "flutter";
    #     };
    #     android = {
    #       command = ["flutter" "run" "--machine" "-d" "android" "-d" "localhost:5555"];
    #       manager = "flutter";
    #     };
    #   };
    };
  };
}