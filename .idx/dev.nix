{ pkgs, ... }: {
  # Change "stable" to a specific version like "stable-24.11"
  channel = "unstable"; 

  packages = [
    pkgs.nodejs_20
    pkgs.jdk17
    pkgs.unzip # Often useful for Android
  ];

  idx.previews = {
    enable = true;
    previews = {
      android = {
        # Make sure the command points to your start script
        command = [ "npx" "expo" "start" "--android" "--tunnel" ];
        manager = "android";
      };
    };
  };
}