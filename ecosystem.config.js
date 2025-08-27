module.exports = {
  apps: [
    {
      name: "hopenest-hub",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: [
        "server.js",
        "controllers",
        "routes",
        "models",
        "views",
        "web",
        "middleware",
        "public",
        "frontend"
      ],
      ignore_watch: [
        "node_modules",
        "uploads",
        "public/vendor",
        "frontend/vendor"
      ],
      watch_delay: 1000,
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: "development",
        PORT: 3000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};


