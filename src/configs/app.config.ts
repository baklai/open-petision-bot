const PORT = '3000';
const HOST = '0.0.0.0';

export default () => ({
  HOST: process.env.HOST || HOST,
  PORT: parseInt(process.env.PORT || PORT, 10),
  NODE_ENV: process.env.NODE_ENV || 'production',
  SECRET: process.env.SECRET || null,
  DONATE: process.env.DONATE || null,
  MONGO_URI: process.env.MONGO_URI || null,
  BOT_TOKEN: process.env.BOT_TOKEN || null,
  WEB_HOOK: process.env.WEB_HOOK || null,
  PROXY: process.env.PROXY || null
});
