module.exports = {
  apps: [{
    name: "nodebackend",
    script: "src/index.js",
    watch: false,
    env: {
      NODE_ENV: "production"
    }
  }]
}