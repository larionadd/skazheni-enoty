import { Card } from '../types.ts';

export const INITIAL_DOORS: Card[] = [
  {
    id: 'door_pigeon',
    name: 'Голуб-Рекітир',
    type: 'monster',
    level: 1,
    treasures: 1,
    levelsAwarded: 1,
    badStuff: 'Забирає насіння та 1 карту з руки.',
    flavor: '«Курлик, шановний, є дві гривні на проїзд?»',
    artUrl: './assets/cards/pigeon.jpg'
  },
  {
    id: 'door_sysadmin',
    name: 'Сисадмін на Обіді',
    type: 'monster',
    level: 2,
    treasures: 1,
    levelsAwarded: 1,
    badStuff: 'Вимикає роутер — скинь 1 шмотку.',
    flavor: 'Грає в Танки з 2011 року і не збирається зупинятися.',
    artUrl: './assets/cards/sysadmin.jpg'
  },
  {
    id: 'door_gop_goblin',
    name: 'Троєщинський Гоблін',
    type: 'monster',
    level: 3,
    treasures: 1,
    levelsAwarded: 1,
    badStuff: 'Віджимає взуття або головний убір.',
    flavor: '«Чуєш, братік, а якщо знайду?»'
  },
  {
    id: 'door_shawarma_chef',
    name: 'Продавець Шаурми без Решти',
    type: 'monster',
    level: 4,
    treasures: 2,
    levelsAwarded: 1,
    badStuff: 'Гастритна атака: втрать 1 рівень.',
    flavor: '«Братуха, мʼясо свіже, тільки вчора гавкало!»'
  },
  {
    id: 'door_vakhterka',
    name: 'Зла Вахтерка Гуртожитку',
    type: 'monster',
    level: 6,
    treasures: 2,
    levelsAwarded: 1,
    bonusAgainst: { targetClass: 'Студент', bonus: 3 },
    badStuff: 'Не пускає ночувати: пропускаєш хід та скидаєш 1 шмотку.',
    flavor: 'Чує шепіт за 4 поверхи і бачить крізь двері.',
    artUrl: './assets/cards/vakhterka.jpg'
  },
  {
    id: 'door_borshch',
    name: 'Пліснявий Борщ у Холодильнику',
    type: 'monster',
    level: 8,
    treasures: 2,
    levelsAwarded: 1,
    badStuff: 'Токсичний вибух: скинь свою броню.',
    flavor: 'Стоїть у каструлі з минулої весни і вже вимагає прописку.'
  },
  {
    id: 'door_komendantka',
    name: 'Комендантка зі Шваброю Лютої Кари',
    type: 'monster',
    level: 10,
    treasures: 3,
    levelsAwarded: 1,
    badStuff: 'Виселяє на коридор: втрата 2 рівнів.',
    flavor: 'Її швабра памʼятає ще першого директора інституту.'
  },
  {
    id: 'door_chief_dep',
    name: 'Начальник Департаменту Нічого',
    type: 'monster',
    level: 12,
    treasures: 3,
    levelsAwarded: 1,
    badStuff: 'Відправляє по колу за довідками: скинь 2 карти з руки.',
    flavor: '«Приходьте вчора після третьої години дня».'
  },
  {
    id: 'door_dragon_bureaucrat',
    name: 'Дракон-Бюрократ із Золотою Печаткою',
    type: 'monster',
    level: 16,
    treasures: 4,
    levelsAwarded: 2,
    badStuff: 'Печатка «ВІДМОВЛЕНО»: втрата 2 рівнів та всіх зброярських шмоток!',
    flavor: 'Дихає не полумʼям, а паленими дедлайнами та новими податками.',
    artUrl: './assets/concept_art.jpg'
  },
  // Підсилювачі монстрів
  {
    id: 'mod_bez_cherhy',
    name: '«Я тільки запитати!» (Без черги)',
    type: 'modifier',
    monsterBonus: 5,
    flavor: 'Монстр лізе вперед і отримує +5 до люті.'
  },
  {
    id: 'mod_skazheniy',
    name: 'Скажений та Невиспаний',
    type: 'modifier',
    monsterBonus: 10,
    extraTreasures: 1,
    flavor: '+10 монстру, але переможець отримує додатковий скарб!'
  },
  // Прокльони
  {
    id: 'curse_lunch_break',
    name: 'Прокльон: Обідня Перерва з 13:00 до 15:00',
    type: 'curse',
    effect: 'У цьому бою не можна кликати кума на допомогу.',
    flavor: 'Табличка зʼявилася прямо перед твоїм носом.'
  },
  {
    id: 'curse_lost_record',
    name: 'Прокльон: Загублена Трудова Книжка',
    type: 'curse',
    effect: 'Втрать 1 рівень негайно (але не нижче 1-го).',
    flavor: '«А в базі вас взагалі немає, шановний!»'
  },
  {
    id: 'curse_tax',
    name: 'Прокльон: Податок на Розкіш',
    type: 'curse',
    effect: 'Скинь найдорожчу шмотку з одягнених.',
    flavor: 'Хто дозволив ходити у фірмових тапочках?!'
  },
  // Класи
  {
    id: 'class_student',
    name: 'Клас: Студент-Бюджетник',
    type: 'class',
    classType: 'Студент',
    bonuses: [
      'Змивання: +1 на кубику при втечі від монстра.',
      'Халява: Скинь 1 карту замість отримання непотребства.'
    ],
    flavor: 'Живе на одній мівіні, але має надприродну живучість.'
  },
  {
    id: 'class_merchant',
    name: 'Клас: Базарний Торгаш',
    type: 'class',
    classType: 'Торгаш',
    bonuses: [
      'Комерсант: Може нести дві Великі Шмотки одночасно.',
      'Націнка: Продаж шмоток дає рівень за 800 золотих замість 1000.'
    ],
    flavor: '«Беріть, на базарі такого більше немає!»'
  },
  {
    id: 'class_it',
    name: 'Клас: Айтівець на Галері',
    type: 'class',
    classType: 'Айтівець',
    bonuses: [
      'Донат у бій: Скинь до 3 карт з руки, кожна дає +2 сили в поточному бою.'
    ],
    flavor: 'Зарплата в баксах, але нерви на межі.'
  }
];

export const INITIAL_TREASURES: Card[] = [
  {
    id: 'loot_boiler_scepter',
    name: 'Кипʼятильник Люті',
    type: 'equipment',
    slot: 'one_hand',
    bonus: 3,
    valueGold: 400,
    flavor: 'Гріє воду за 30 секунд, вирубає пробки на всьому поверсі.',
    artUrl: './assets/cards/boiler.jpg'
  },
  {
    id: 'loot_kravchuchka',
    name: 'Дворучна Кравчучка Жадібності',
    type: 'equipment',
    slot: 'two_hands',
    bonus: 4,
    isBig: true,
    valueGold: 800,
    flavor: 'Скрипить на 120 децибел, вміщує мішок картоплі та трофеї.',
    artUrl: './assets/cards/kravchuchka.jpg'
  },
  {
    id: 'loot_foil_hat',
    name: 'Шапка з Фольги від 5G',
    type: 'equipment',
    slot: 'headgear',
    bonus: 2,
    valueGold: 300,
    flavor: 'Захищає мозок від прокльонів та сусідського роутера.'
  },
  {
    id: 'loot_pan_helmet',
    name: 'Алюмінієва Каструля-Шолом',
    type: 'equipment',
    slot: 'headgear',
    bonus: 1,
    valueGold: 200,
    flavor: 'Дзвенить при кожному ударі, але береже голову.'
  },
  {
    id: 'loot_bunny_slippers',
    name: 'Шльопанці-Зайчики Швидкості',
    type: 'equipment',
    slot: 'footwear',
    bonus: 1,
    runBonus: 2,
    valueGold: 350,
    flavor: 'Мʼякі, теплі. Дають +2 до кидка кубика на втечу!'
  },
  {
    id: 'loot_abibas_tracksuit',
    name: 'Спортивка «Abibas» з Трьома Смугами',
    type: 'equipment',
    slot: 'armor',
    bonus: 2,
    valueGold: 500,
    flavor: '+100 до авторитету серед районних гоблінів.'
  },
  {
    id: 'loot_folder_docs',
    name: 'Важка Папка зі Справами',
    type: 'equipment',
    slot: 'one_hand',
    bonus: 3,
    valueGold: 450,
    flavor: 'Важить 5 кілограмів, бʼє по голові як ковадло.'
  },
  {
    id: 'loot_cucumber_jar',
    name: 'Банка Бабусиних Огірків',
    type: 'consumable',
    bonus: 5,
    valueGold: 300,
    usableInAnyCombat: true,
    flavor: 'Одноразовий підгон сили: +5 на будь-яку сторону в бою!',
    artUrl: './assets/cards/cucumber_jar.jpg'
  },
  {
    id: 'loot_candy_box',
    name: 'Коробочка «Вечірній Київ»',
    type: 'consumable',
    effect: 'Підкупити монстра до 5 рівня: забираєш його скарби без бою.',
    valueGold: 450,
    flavor: 'Універсальний ключ від будь-якого зачиненого кабінету.'
  },
  {
    id: 'loot_energy_drink',
    name: 'Енергетик «Сесія Non-Stop»',
    type: 'consumable',
    bonus: 3,
    valueGold: 200,
    usableInAnyCombat: true,
    flavor: 'Серце калатає, зате дає +3 сили в поточному бою.'
  },
  {
    id: 'loot_bribe_200',
    name: 'Купюра у Папці (Хабар)',
    type: 'consumable',
    bonus: 4,
    valueGold: 600,
    usableInAnyCombat: true,
    flavor: 'Вирішує будь-яке делікатне питання тут і зараз.'
  }
];
