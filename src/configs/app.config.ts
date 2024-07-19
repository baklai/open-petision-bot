const PORT = '3000';
const HOST = '0.0.0.0';
const SECRET = '4EfVKy5nXIXgD6fNk2ssIKy5nXIXgD6fNkfVKy5n';
const DONATE = null;
const MONGO_URI = null;

export default () => ({
  HOST: process.env.HOST || HOST,
  PORT: parseInt(process.env.PORT || PORT, 10),
  NODE_ENV: process.env.NODE_ENV || 'production',
  SECRET: process.env.SECRET || SECRET,
  DONATE: process.env.DONATE || DONATE,
  MONGO_URI: process.env.MONGO_URI || MONGO_URI,
  BOT_TOKEN: process.env.BOT_TOKEN,
  WEB_HOOK: process.env.WEB_HOOK,
  PROXY: process.env.PROXY || null
});
