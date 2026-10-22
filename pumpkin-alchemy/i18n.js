// Localization Dictionary & Manager for Pumpkin Alchemy (Ukrainian & English)

window.PumpkinI18N = (() => {
  const STORAGE_KEY_LANG = "pumpkin_alchemy_lang";

  const TRANSLATIONS = {
    uk: {
      gameTitle: "PUMPKIN ALCHEMY",
      subtitle: "Затишна Геловінська Алхімія",
      nightPrefix: "🌙 НІЧ",
      dayPrefix: "☀️ ДЕНЬ",
      goalPrefix: "📜 Ціль:",
      nextLabel: "ДАЛІ",
      serveBtn: "🍵 Подати!",
      serveBtnReady: "🍵 Подати! ★",
      serveBtnDone: "Готово ✓",
      playStart: "🌙 Почати Ніч 1",
      playContinue: (n) => `🌙 Продовжити — Ніч ${n}`,
      newGameBtn: "🔄 Нова гра (з 1-ї ночі)",
      settingsBtn: "⚙️ Налаштування",
      grimoireBtn: "📖 Гримуар",
      quickLang: "🇺🇦 УКР",
      savedProgressBadge: (lvl, c) => `🌙 Ніч ${lvl} | 🪙 ${c}`,
      newProgressBadge: "🌙 Нова гра",

      // Settings modal
      settingsTitle: "⚙️ Налаштування",
      settingLangTitle: "🌐 Мова гри / Language",
      settingAudioTitle: "🔊 Звук та Атмосфера",
      soundEnabled: "🔊 Увімкнено",
      soundMuted: "🔇 Вимкнено",
      settingProgressTitle: "💾 Збереження та Прогрес",
      progressNightInfo: (lvl) => `Поточний прогрес: Ніч ${lvl}`,
      progressCoinsInfo: (c, hi) => `🪙 ${c} монет | Рекорд: ${hi}`,
      resetProgressBtn: "⚠️ Скинути збереження (з 1-ї ночі)",
      resetConfirm: "Ти дійсно хочеш скинути збереження та почати з Ночі 1?",
      closeSettings: "Готово ✨",

      // First-Launch Language Dialog
      firstLangTitle: "✨ Оберіть Мову / Select Language",
      firstLangDesc: "Оберіть мову для чарівного казана:",

      // In-game buttons / tools
      toolStirName: "Мішалка",
      toolBatName: "Кажанчик",
      toolGrimoireName: "Гримуар",
      stirPrompt: "🥄 Проведи мішалкою всередині казана!",
      serveTag: "★ У ЗІЛЛЯ",
      comboToast: (x) => `КОМБО ×${x}!`,

      // Day Shop
      dayShopTitle: (day) => `День ${day} — Денна Крамниця`,
      dayShopSubtitle: (s, c) => `Збережено ${s} сек → +${c} 🪙 монет!`,
      shopContinueBtn: (nextNight) => `🌙 Продовжити — Настає Ніч ${nextNight}!`,
      daySummaryBadge: (day) => `☀️ День ${day} пройдено`,
      daySummaryCoins: (s, c) => `⏱️ ${s}с → +${c} 🪙`,
      murchikShopName: "Мурчик, Господар Денної Крамниці",
      murchikShopDialogue: "«Світанок настав! Замість казана відкрилась наша крамниця — закуповуй припаси перед наступною ніччю!»",
      timeRewardTag: (c) => `+${c} 🪙 за час`,

      shopItems: {
        stir: {
          name: "Велика Мішалка (+1 заряд)",
          desc: "Дозволяє 1 раз перемішати казан ложкою"
        },
        bat: {
          name: "Кажан-Помічник (+1 заряд)",
          desc: "Забирає з казана 1 найменший предмет"
        },
        time: {
          name: "⏳ Пісочний Годинник (+30 сек)",
          desc: "Додає +30 секунд на наступну ніч"
        },
        needed: {
          name: "🎯 Інгредієнт Замовлення на старт",
          desc: "На початку ночі дає потрібний гостю предмет"
        },
        greed: {
          name: "🍀 Золотий Черпак (Бонус монет)",
          desc: "Більше монет за замовлення (до 15🪙) і збережений час"
        }
      },

      // Grimoire
      grimoireTitle: "📖 Гримуар Ваги та Духів",
      spiritEvoHeading: "👻 Таємниця Поєднання Духів",
      weightsHeading: "⚖️ 4 Категорії Ваги Інгредієнтів",
      weightPills: {
        light: "🪶 Легкі: падають повільно й плавно",
        medium: "⚖️ Середні: звичайна вага",
        heavy: "🍎 Важкі: падають швидко, розштовхують легкі",
        very_heavy: "🪨 Надважкі: пробивають шлях до самого дна!"
      },
      discoveredHeading: (unlocked, total) => `🎃 Відкриті Інгредієнти (${unlocked} з ${total})`,
      grimoireCloseBtn: "До казана! ✨",

      // Weights
      weightLabels: {
        light: "🪶 Легкий",
        medium: "⚖️ Середній",
        heavy: "🍎 Важкий",
        very_heavy: "🪨 Надважкий"
      },

      // Spirits
      spirits: {
        1: { name: "Дух-Світлячок" },
        2: { name: "Архідух Ліхтаря" }
      },

      // Ingredients
      ingredients: [
        "Крисячий Хвіст",
        "Кісточка Скелета",
        "Сонний Жолудь",
        "Око Зомбі",
        "Лісовий Мухомор",
        "Неоновий Грибочок",
        "Крило Кажана",
        "Павучок у Павутинці",
        "Ікло Вампіра",
        "Карамельне Яблучко",
        "Корінь Мандрагори",
        "Гарбузик-Малюк",
        "Череп зі Свічкою",
        "Ліхтар Джека",
        "Смарагдова Отрута",
        "Примарний Ліхтар",
        "Серце Дракона",
        "Відьомський Гарбуз",
        "Філософський Камінь",
        "Король Гарбузів"
      ],

      // Guests
      guests: {
        ghost: {
          name: "Джаспер, Привид-листоноша",
          dialogue: "«У лісі такий густий туман! Звариш мені зілля для нічної пошти?»",
          thankYou: "«Дякую! Тепер я свічуся, мов справжній маяк!»"
        },
        wolf: {
          name: "Шеф Руді, Пекар-вовкулака",
          dialogue: "«Мої святкові пироги охололи! Додаси вогняних спецій у казан?»",
          thankYou: "«У-у-у! Який аромат! Піч знову палає!»"
        },
        witch: {
          name: "Луна, Учениця Відьми",
          dialogue: "«Сьогодні іспит із польотів на мітлі! Мені потрібна особлива алхімія.»",
          thankYou: "«Ура! Мітла аж іскриться від магії!»"
        },
        skeleton: {
          name: "Маестро Бонні, Скелет-музикант",
          dialogue: "«Кістки клацають, а скрипка мовчить! Звари еліксир натхнення!»",
          thankYou: "«Оце мелодія! Ноги самі просяться в танок!»"
        },
        owl: {
          name: "Пані Моргана, Сова-звіздарка",
          dialogue: "«Хмари закрили сузір'я! Нам потрібне світло рідкісних інгредієнтів.»",
          thankYou: "«Угу-у! Зірки знову сяють над вежею!»"
        },
        vampire: {
          name: "Граф Влад, Нічний Бариста",
          dialogue: "«Я випадково проспав сто років... Звари щось ду-у-уже бадьоре!»",
          thankYou: "«Чудово! Жодного сну до самого світанку!»"
        },
        knight: {
          name: "Сер Джек, Гарбузовий Лицар",
          dialogue: "«Брама Геловінського Ярмарку чекає! Зарядимо мій ліхтар!»",
          thankYou: "«Честь і хвала Алхіміку! Шлях вільний!»"
        },
        king: {
          name: "Король Опівночі, Дух Осені",
          dialogue: "«Час пробив північ! Поєднай старші дари для Головного Свята!»",
          thankYou: "«СВЯТО СЯЄ! Ось твоє відьомське золото!»"
        }
      },

      // Game Over
      gameOverTimeTitle: (lvl) => `⌛ Час Ночі ${lvl} Вийшов!`,
      gameOverOverflowTitle: "🌙 Казан Переповнився!",
      gameOverRank: (done, target) => `Виконано замовлень: ${done} з ${target}`,
      gameOverTimeStory: "Дві хвилини минули до світанку! Використовуй важкі інгредієнти та 🥄 Велику Мішалку, щоб швидше з'єднувати пари.",
      gameOverOverflowStory: "Інгредієнти перелилися через край казана! Тримай рівень нижче червоної лінії небезпеки.",
      retryBtn: (lvl) => `🔄 Спробувати Ніч ${lvl} Знову`,
      summaryOrdersLabel: "Замовлення",
      summaryBonusLabel: "Бонус часу",
      summaryWalletLabel: "Гаманець"
    },

    en: {
      gameTitle: "PUMPKIN ALCHEMY",
      subtitle: "Cozy Halloween Alchemy",
      nightPrefix: "🌙 NIGHT",
      dayPrefix: "☀️ DAY",
      goalPrefix: "📜 Goal:",
      nextLabel: "NEXT",
      serveBtn: "🍵 Serve!",
      serveBtnReady: "🍵 Serve! ★",
      serveBtnDone: "Done ✓",
      playStart: "🌙 Start Night 1",
      playContinue: (n) => `🌙 Continue — Night ${n}`,
      newGameBtn: "🔄 New Game (from Night 1)",
      settingsBtn: "⚙️ Settings",
      grimoireBtn: "📖 Grimoire",
      quickLang: "🇬🇧 ENG",
      savedProgressBadge: (lvl, c) => `🌙 Night ${lvl} | 🪙 ${c}`,
      newProgressBadge: "🌙 New Game",

      // Settings modal
      settingsTitle: "⚙️ Settings",
      settingLangTitle: "🌐 Game Language / Мова",
      settingAudioTitle: "🔊 Audio & Ambience",
      soundEnabled: "🔊 Enabled",
      soundMuted: "🔇 Muted",
      settingProgressTitle: "💾 Save & Progress",
      progressNightInfo: (lvl) => `Current Progress: Night ${lvl}`,
      progressCoinsInfo: (c, hi) => `🪙 ${c} coins | Highscore: ${hi}`,
      resetProgressBtn: "⚠️ Reset Progress (Start from Night 1)",
      resetConfirm: "Do you really want to reset your save and start from Night 1?",
      closeSettings: "Done ✨",

      // First-Launch Language Dialog
      firstLangTitle: "✨ Select Language / Оберіть Мову",
      firstLangDesc: "Choose your language for the magical cauldron:",

      // In-game buttons / tools
      toolStirName: "Stir Spoon",
      toolBatName: "Bat Helper",
      toolGrimoireName: "Grimoire",
      stirPrompt: "🥄 Stir the wooden spoon inside the cauldron!",
      serveTag: "★ SERVE",
      comboToast: (x) => `COMBO ×${x}!`,

      // Day Shop
      dayShopTitle: (day) => `Day ${day} — Daytime Shop`,
      dayShopSubtitle: (s, c) => `Saved ${s} sec → +${c} 🪙 coins!`,
      shopContinueBtn: (nextNight) => `🌙 Continue — Night ${nextNight} Falls!`,
      daySummaryBadge: (day) => `☀️ Day ${day} Completed`,
      daySummaryCoins: (s, c) => `⏱️ ${s}s → +${c} 🪙`,
      murchikShopName: "Murchik, Daytime Shopkeeper",
      murchikShopDialogue: "“Dawn has arrived! Our shop opens in place of the cauldron — stock up on supplies before the next night!”",
      timeRewardTag: (c) => `+${c} 🪙 for time`,

      shopItems: {
        stir: {
          name: "Big Stirring Spoon (+1 charge)",
          desc: "Allows stirring the cauldron with a wooden spoon once"
        },
        bat: {
          name: "Bat Helper (+1 charge)",
          desc: "Removes 1 smallest item from the cauldron"
        },
        time: {
          name: "⏳ Hourglass (+30 sec)",
          desc: "Adds +30 seconds to the upcoming night"
        },
        needed: {
          name: "🎯 Starter Order Ingredient",
          desc: "Spawns an ingredient needed by the guest at night start"
        },
        greed: {
          name: "🍀 Golden Ladle (Coin Bonus)",
          desc: "More coins for orders (up to 15🪙) and preserved time"
        }
      },

      // Grimoire
      grimoireTitle: "📖 Grimoire of Weight & Spirits",
      spiritEvoHeading: "👻 Spirit Fusion Mystery",
      weightsHeading: "⚖️ 4 Ingredient Weight Classes",
      weightPills: {
        light: "🪶 Light: drift down gently & smoothly",
        medium: "⚖️ Medium: standard alchemical weight",
        heavy: "🍎 Heavy: drop fast, pushing lighter items aside",
        very_heavy: "🪨 Superheavy: punch straight through to the bottom!"
      },
      discoveredHeading: (unlocked, total) => `🎃 Discovered Ingredients (${unlocked} of ${total})`,
      grimoireCloseBtn: "Back to Cauldron! ✨",

      // Weights
      weightLabels: {
        light: "🪶 Light",
        medium: "⚖️ Medium",
        heavy: "🍎 Heavy",
        very_heavy: "🪨 Superheavy"
      },

      // Spirits
      spirits: {
        1: { name: "Wisp Spirit" },
        2: { name: "Lantern Archspirit" }
      },

      // Ingredients
      ingredients: [
        "Rat's Tail",
        "Skeleton Bone",
        "Sleepy Acorn",
        "Zombie Eye",
        "Forest Fly Agaric",
        "Neon Shroom",
        "Bat Wing",
        "Web Spider",
        "Vampire Fang",
        "Candy Apple",
        "Mandrake Root",
        "Baby Pumpkin",
        "Candle Skull",
        "Jack-o'-Lantern",
        "Emerald Poison",
        "Phantom Lantern",
        "Dragon Heart",
        "Witch Pumpkin",
        "Philosopher's Stone",
        "Pumpkin King"
      ],

      // Guests
      guests: {
        ghost: {
          name: "Jasper, the Ghost Courier",
          dialogue: "“The forest mist is so thick! Brew me an elixir for the night mail?”",
          thankYou: "“Thank you! Now I glow like a true lighthouse!”"
        },
        wolf: {
          name: "Chef Rudy, Werewolf Baker",
          dialogue: "“My festive pies are getting cold! Add fire spices to the cauldron?”",
          thankYou: "“Awooo! What an aroma! The oven is blazing again!”"
        },
        witch: {
          name: "Luna, Witch Apprentice",
          dialogue: "“Broom flight exam tonight! I need special flying alchemy.”",
          thankYou: "“Hooray! The broom is sparkling with pure magic!”"
        },
        skeleton: {
          name: "Maestro Bonnie, Skeleton Musician",
          dialogue: "“Bones rattle, but the violin is silent! Brew an elixir of inspiration!”",
          thankYou: "“What a tune! My bones are ready to dance!”"
        },
        owl: {
          name: "Lady Morgana, Stargazer Owl",
          dialogue: "“Clouds hide constellations! We need light from rare ingredients.”",
          thankYou: "“Hoo-hoo! The stars shine above the tower once more!”"
        },
        vampire: {
          name: "Count Vlad, Night Barista",
          dialogue: "“I accidentally slept for a century... Brew something truly invigorating!”",
          thankYou: "“Splendid! Not a wink of sleep until dawn!”"
        },
        knight: {
          name: "Sir Jack, Pumpkin Knight",
          dialogue: "“Halloween Fair gates await! Let's charge up my lantern!”",
          thankYou: "“Honor to the Alchemist! The path is open!”"
        },
        king: {
          name: "Midnight King, Spirit of Autumn",
          dialogue: "“Midnight has struck! Combine elder gifts for the Grand Feast!”",
          thankYou: "“THE FEAST SHINES! Here is your witch's gold!”"
        }
      },

      // Game Over
      gameOverTimeTitle: (lvl) => `⌛ Night ${lvl} Time Expired!`,
      gameOverOverflowTitle: "🌙 Cauldron Overflowed!",
      gameOverRank: (done, target) => `Orders completed: ${done} of ${target}`,
      gameOverTimeStory: "Two minutes elapsed before dawn! Use heavy ingredients and the 🥄 Big Stirring Spoon to match pairs faster.",
      gameOverOverflowStory: "Ingredients spilled over the cauldron rim! Keep the level below the red danger line.",
      retryBtn: (lvl) => `🔄 Retry Night ${lvl}`,
      summaryOrdersLabel: "Orders",
      summaryBonusLabel: "Time bonus",
      summaryWalletLabel: "Wallet"
    }
  };

  let currentLang = localStorage.getItem(STORAGE_KEY_LANG) || "uk";

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (lang !== "uk" && lang !== "en") lang = "uk";
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY_LANG, lang);
    document.documentElement.lang = lang;
    document.title = lang === "en" ? "Pumpkin Alchemy — Halloween Witch Shop" : "Гарбузова Алхімія — Геловінська Крамниця";
  }

  function t(key, ...args) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uk;
    const val = dict[key] ?? TRANSLATIONS.uk[key];
    if (typeof val === "function") {
      return val(...args);
    }
    return val ?? key;
  }

  function getIngredientName(idx) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uk;
    return (dict.ingredients && dict.ingredients[idx]) || (TRANSLATIONS.uk.ingredients[idx] ?? `Ingredient #${idx + 1}`);
  }

  function getWeightLabel(wClass) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uk;
    return (dict.weightLabels && dict.weightLabels[wClass]) || (TRANSLATIONS.uk.weightLabels[wClass] ?? wClass);
  }

  function getSpiritName(spiritTier) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uk;
    return (dict.spirits && dict.spirits[spiritTier] && dict.spirits[spiritTier].name) ||
      (TRANSLATIONS.uk.spirits[spiritTier] ? TRANSLATIONS.uk.spirits[spiritTier].name : "Spirit");
  }

  function getGuestInfo(guestId) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.uk;
    return (dict.guests && dict.guests[guestId]) || TRANSLATIONS.uk.guests[guestId] || {
      name: "Guest",
      dialogue: "...",
      thankYou: "Thank you!"
    };
  }

  function hasSavedLang() {
    return Boolean(localStorage.getItem(STORAGE_KEY_LANG));
  }

  return {
    getLang,
    setLang,
    t,
    getIngredientName,
    getWeightLabel,
    getSpiritName,
    getGuestInfo,
    hasSavedLang,
    TRANSLATIONS
  };
})();
