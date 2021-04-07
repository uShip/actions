module.exports = {
  "**/*.{ts,js,json}": (files) => ["npm run build", "git add **/dist/**"],
  "*.{ts,yml}": ["prettier --write"]
};
