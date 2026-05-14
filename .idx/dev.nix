{ pkgs, ... }: {
  # Change "stable" par une version spécifique comme "stable-24.11"
  channel = "stable-24.11"; 

  packages = [
    pkgs.nodejs_20
    pkgs.jdk17
    pkgs.unzip # Souvent utile pour Android
  ];

  idx.previews = {
    enable = true;
    previews = {
      android = {
        # S'assure que la commande pointe bien vers ton script de démarrage
        command = [ "npx" "react-native" "run-android" "--no-packager" ];
        manager = "android";
      };
    };
  };
}