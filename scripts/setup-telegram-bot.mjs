import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const TOKEN = '8718977451:AAFZ6TkpSGtBW-o-3sck2lcJow2G8YdhRYY';
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;
const APP_URL = 'https://larionadd.github.io/skazheni-enoty/';

async function api(method, data) {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${BASE_URL}/${method}`, {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });
  const json = await res.json();
  console.log(`${method}:`, json);
  return json;
}

async function main() {
  console.log('🚀 Налаштування Telegram-бота Crazyracoons_bot...');

  // 1. Встановлюємо ім'я бота
  await api('setMyName', {
    name: 'Скажені Єноти: Нічний Дожор 🦝',
  });

  // 2. Встановлюємо повний опис бота (відображається перед натисканням /start)
  await api('setMyDescription', {
    description:
      '🦝🧨 «Скажені Єноти: Нічний Дожор» — карткова онлайн гра про банду єнотів у нічному місті!\n\n' +
      '🔥 Тягни карти зі смітника, підкидай Петарди суперникам, рятуйся придверними Килимками, нюхай майбутнє колоди та цупи шаурму!\n' +
      '🎯 Мета гри: вижити будь-якою ціною! Останній вцілілий єнот стає Королем Нічного Дожору.\n\n' +
      '✨ Особливості:\n' +
      '• Повноцінний Telegram Mini App\n' +
      '• Онлайн мультиплеєр з друзями за кодом кімнати\n' +
      '• Офлайн режим з розумними єнотами-ботами\n' +
      '• Тактильна вібровіддача та комікс-анімації «BOOM!»\n\n' +
      'Тисніть кнопку «Грати 🦝» в меню або /play!',
  });

  // 3. Встановлюємо короткий опис (відображається в профілі бота)
  await api('setMyShortDescription', {
    short_description:
      '🦝🧨 Карткова гра про банду єнотів, шаурму та вибухові петарди! Грай онлайн або з ботами в Telegram Mini App.',
  });

  // 4. Встановлюємо список команд
  await api('setMyCommands', {
    commands: [
      { command: 'play', description: 'Відкрити гру (Mini App)' },
      { command: 'rules', description: 'Правила гри та карти' },
      { command: 'start', description: 'Головне меню та приєднання до кімнати' },
    ],
  });

  // 5. Встановлюємо постійну кнопку меню WebApp зліва від поля вводу
  await api('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Грати 🦝',
      web_app: { url: APP_URL },
    },
  });

  // 6. Створюємо квадратну аватарку 512x512 JPG та завантажуємо її
  console.log('🖼️ Готуємо аватарку бота...');
  const avatarPath = 'public/bot-avatar.jpg';
  await sharp('public/icons/icon-512.png')
    .resize(512, 512)
    .jpeg({ quality: 95 })
    .toFile(avatarPath);

  const imgBuf = readFileSync(avatarPath);
  const blob = new Blob([imgBuf], { type: 'image/jpeg' });

  const form = new FormData();
  form.append('photo', JSON.stringify({ type: 'static', photo: 'attach://bot_pic' }));
  form.append('bot_pic', blob, 'bot-avatar.jpg');

  console.log('📤 Завантажуємо аватарку бота через setMyProfilePhoto...');
  await api('setMyProfilePhoto', form);

  console.log('✅ Налаштування профілю бота завершено!');
}

main().catch(console.error);
