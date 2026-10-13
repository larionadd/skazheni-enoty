// Telegram Bot for "Скажені Єноти: Нічний Дожор"
// Runs a grammY bot that serves the Telegram Mini App (TMA).
import { Bot, InlineKeyboard } from 'grammy';

export const DEFAULT_WEBAPP_URL = 'https://larionadd.github.io/skazheni-enoty/';

export function createTelegramBot(token?: string, webAppUrl?: string) {
  const botToken = token || process.env.BOT_TOKEN;
  const appUrl = webAppUrl || process.env.WEBAPP_URL || DEFAULT_WEBAPP_URL;

  if (!botToken) {
    console.warn('⚠️ BOT_TOKEN не вказано. Telegram-бот не запущено.');
    console.warn('💡 Щоб запустити бота, створіть токен у @BotFather та встановіть BOT_TOKEN=ваш_токен');
    return null;
  }

  const bot = new Bot(botToken);

  // Setup commands and permanent WebApp menu button
  bot.api.setMyCommands([
    { command: 'play', description: 'Грати в «Скажені Єноти» (Mini App)' },
    { command: 'rules', description: 'Правила гри та карти' },
    { command: 'start', description: 'Головне меню та вхід у кімнату' },
  ]).catch(() => {});

  bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Грати 🦝',
      web_app: { url: appUrl },
    },
  }).catch(() => {});

  // /start handler (supports deep-linking: /start room_1234)
  bot.command('start', async (ctx) => {
    const rawParam = ctx.match?.trim() ?? '';
    const roomCode = rawParam.replace(/^room_/, '');
    const userFirstName = ctx.from?.first_name || 'Друже';

    const launchUrl = roomCode ? `${appUrl}?room=${encodeURIComponent(roomCode)}` : appUrl;

    const playLabel = roomCode
      ? `🎮 Приєднатися до кімнати #${roomCode}`
      : '🦝 Грати в «Скажені Єноти»';

    const kb = new InlineKeyboard()
      .webApp(playLabel, launchUrl)
      .row()
      .text('📜 Правила гри', 'show_rules')
      .url(
        '📢 Поділитися грою',
        `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent('Гайда грати в «Скажені Єноти: Нічний Дожор»! 🦝🧨')}`,
      );

    const welcomeText = roomCode
      ? `Привіт, <b>${userFirstName}</b>! 🦝\n\nТебе запросили приєднатися до кімнати <b>#${roomCode}</b> у грі <b>«Скажені Єноти: Нічний Дожор»</b>!\n\nТисни кнопку нижче, щоб увійти прямо в кімнату:`
      : `Привіт, <b>${userFirstName}</b>! Ласкаво просимо до <b>«Скажених Єнотів: Нічний Дожор»</b>! 🦝🧨\n\n` +
        `Це швидка, азартна та вибухова карткова гра прямо в Telegram Mini App:\n` +
        `• 💥 Витягуй карти зі смітника, уникай вибуху Петарди\n` +
        `• 🧶 Захищайся придверними Килимками\n` +
        `• 👃 Використовуй Нюх-Радар, щоб бачити верх колоди\n` +
        `• 🌯 Кради шаурму та батони в інших єнотів\n` +
        `• 🚫 Кричи «СТОП-ХАП!», блокуючи дії суперників\n\n` +
        `Грай з друзями онлайн або тренуйся з розумними єнотами-ботами без інтернету!`;

    await ctx.reply(welcomeText, {
      parse_mode: 'HTML',
      reply_markup: kb,
    });
  });

  // /play command
  bot.command('play', async (ctx) => {
    const kb = new InlineKeyboard().webApp('🦝 Відкрити Mini App', appUrl);
    await ctx.reply('Тисни кнопку, щоб розпочати дожір:', {
      reply_markup: kb,
    });
  });

  // /rules command
  bot.command('rules', async (ctx) => {
    await sendRules(ctx, appUrl);
  });

  // Inline callback for rules button
  bot.callbackQuery('show_rules', async (ctx) => {
    await ctx.answerCallbackQuery();
    await sendRules(ctx, appUrl);
  });

  return bot;
}

async function sendRules(ctx: any, appUrl: string) {
  const rulesText =
    `<b>📜 ПРАВИЛА ГРИ «СКАЖЕНІ ЄНОТИ: НІЧНИЙ ДОЖОР»</b>\n\n` +
    `<b>🎯 Мета гри:</b>\n` +
    `Вижити! Останній єнот, який не підірвався на Петарді, стає Королем Нічного Дожору.\n\n` +
    `<b>🃏 Хід гравця:</b>\n` +
    `1. Зіграй будь-яку кількість карт з руки (або жодної).\n` +
    `2. <b>Обов'язково заверши свій хід</b>, витягнувши карту з колоди на столі.\n\n` +
    `<b>🧨 Карти гри:</b>\n` +
    `• <b>Петарда</b> — БА-БАХ! Гравець вибуває з гри, якщо в нього немає Килимка.\n` +
    `• <b>Килимок</b> — нейтралізує Петарду! Дозволяє сховати Петарду назад у колоду в будь-яке місце на твій вибір.\n` +
    `• <b>Підстава</b> — завершує твій хід без взяття карти й змушує наступного гравця ходити ДВІЧІ.\n` +
    `• <b>Звалити в кущі</b> — завершує твій хід без взяття карти.\n` +
    `• <b>Нюх-Радар</b> — підглядає 3 верхні карти колоди.\n` +
    `• <b>Шморган-Вихор</b> — ретельно перемішує колоду.\n` +
    `• <b>Цап-Царап</b> — вимагає в обраного суперника віддати тобі одну карту на його вибір.\n` +
    `• <b>СТОП-ХАП! (Nope)</b> — миттєво скасовує будь-яку дію гравця (крім Петарди та Килимка).\n` +
    `• <b>Парні смаколики (Шаурма, Батон)</b> — зіграй пару однакових смаколиків, щоб поцупити випадкову карту з руки суперника!`;

  const kb = new InlineKeyboard().webApp('🦝 Грати зараз', appUrl);

  await ctx.reply(rulesText, {
    parse_mode: 'HTML',
    reply_markup: kb,
  });
}
