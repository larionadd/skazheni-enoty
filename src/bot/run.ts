// Entrypoint for running the Telegram Bot
import { createTelegramBot } from './bot.ts';

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'https://larionadd.github.io/skazheni-enoty/';

if (!token) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🤖 TELEGRAM BOT ДЛЯ «СКАЖЕНІ ЄНОТИ: НІЧНИЙ ДОЖОР»');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('ℹ️ Щоб запустити бота в Telegram, потрібен BOT_TOKEN:');
  console.log('1. Відкрийте @BotFather у Telegram (https://t.me/BotFather)');
  console.log('2. Надішліть команду /newbot і дотримуйтесь інструкцій');
  console.log('3. Скопіюйте отриманий токен (наприклад, 123456789:ABCDef...)');
  console.log('4. Запустіть бота:');
  console.log('   BOT_TOKEN="ваш_токен" npm run bot');
  console.log('   (або створіть файл .env з BOT_TOKEN=ваш_токен)');
  console.log('');
  console.log(`🌐 Mini App URL за замовчуванням: ${webAppUrl}`);
  console.log('═══════════════════════════════════════════════════════════════');
  process.exit(1);
}

const bot = createTelegramBot(token, webAppUrl);
if (bot) {
  console.log('🚀 Telegram-бот успішно запускається...');
  console.log(`📱 Mini App підключено: ${webAppUrl}`);
  bot.start({
    onStart: (info) => {
      console.log(`✅ Бот @${info.username} успішно працює!`);
      console.log(`🔗 Відкрийте в Telegram: https://t.me/${info.username}`);
    },
  });
}
