/* =========================================================================
   Инструменты: разблокировки, прошивки, патчи драйверов, движки.
   Используются страницей «Прошивки и моды» и карточками GPU.
   ========================================================================= */
window.BLDL = window.BLDL || {};

BLDL.tools = [
  {
    id: "cmpunlocker-170hx",
    name: "cmpunlocker (CMP 170HX)",
    url: "https://github.com/amoghmunikote/cmpunlocker",
    author: "amoghmunikote",
    license: "GPL",
    type: "unlock",
    cards: ["CMP 170HX"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "In-driver разблокировка GA100 на CMP 170HX: снимает лимитер вычислений (SS0/SS1), открывает спрятанную геометрию HBM2e и PCIe Gen2. Ничего не записывается в VBIOS карты — патчатся модули драйвера, состояние восстанавливается после перезагрузки.",
    unlocks: [
      { feature: "Полная скорость SM (SS0/SS1) — тензорные ядра ~95% от per-SM A100", status: "работает" },
      { feature: "Геометрия памяти: 8 ГБ → 64 ГБ (Hynix HBM2e)", status: "работает" },
      { feature: "10 ГБ → 40 ГБ стабильно (Samsung HBM2); 80 ГБ — вариант, но нестабилен", status: "работает частично" },
      { feature: "PCIe Gen2 (ширина остаётся x4 — это разводка платы)", status: "работает" },
      { feature: "BAR1 64 ГБ (нужен для больших аллокаций)", status: "работает" },
      { feature: "ECC DRAM/SRAM, JTAG, VFIO-passthrough, профилирование", status: "работает" },
      { feature: "NVLink и PCIe Gen4", status: "не решено" },
      { feature: "80 ГБ на 10-ГБ картах", status: "нестабильно, отвергнуто" }
    ],
    requires: [
      "Linux x86-64, root",
      "Открытый драйвер nvidia-open 610.x (в части отчётов — 580.x)",
      "Заголовки ядра под текущее ядро (linux-headers-$(uname -r))",
      "Secure Boot выключен — модули не подписаны",
      "Отключение питания на 60 секунд (холодная загрузка) для сброса регистра WPR2"
    ],
    caveats: [
      "Максимум зависит от бина кремния: часто реально доступно 32–40 ГБ, а не 64/80 — HBM-стек частей A100 с дефектами.",
      "Прошивка BAR1 в 64 ГБ может ломать загрузку на части карт (сообщения о Xid 31 и «не грузится система»).",
      "После разблокировки карта определяется как «NVIDIA CMP 170HX, 65536 MiB» — обычной видеокартой она не становится: видеовыходов нет.",
      "Автообновление драйвера снесёт патч: пакеты держат на hold."
    ],
    appearsAs: "NVIDIA CMP 170HX, 65 536 MiB (nvidia-smi), sm_80, 70 SM",
    sources: ["cmpunlocker", "170th-street", "170th-gitbook", "lttlabs-170hx"]
  },
  {
    id: "cmpunlocker-rs",
    name: "cmpunlocker-rs (CMP 50HX / 90HX)",
    url: "https://github.com/pearlfortune/cmpunlocker",
    author: "pearlfortune",
    license: "см. репозиторий",
    type: "unlock",
    cards: ["CMP 90HX", "CMP 50HX"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "Отдельный проект с иной областью применения: снимает лимитер вычислений (сравнимый с уровнем RTX 2080 Ti) у CMP 90HX и CMP 50HX, а также включает PCIe Gen2, Resizable BAR и частично RT-ядра.",
    unlocks: [
      { feature: "Полная скорость вычислений (эквивалент 2080 Ti, без троттлинга CUDA-инструкций)", status: "работает" },
      { feature: "PCIe Gen2", status: "работает" },
      { feature: "Resizable BAR", status: "работает" },
      { feature: "RT-ядра (отчёт о наличии; фактически почти не работают)", status: "частично" }
    ],
    requires: [
      "Linux x86-64, root",
      "nvidia-open 580.x или 610.x",
      "Строгое совпадение по таблице протестированных сред — иначе инструмент откажется работать"
    ],
    caveats: [
      "Есть два режима: временный (в память, теряется при ребуте) и персистентный (подмена .ko, требует бэкапа модулей и понимания, как откатиться).",
      "Для OEM-карт (subsystem 1462:371f) нужен отдельный путь stockflow."
    ],
    appearsAs: "обычный CMP 50/90HX в nvidia-smi, но с полной частотой и включённым ReBAR",
    sources: ["cmpunlocker-rs", "nvpatcher-575"]
  },
  {
    id: "forgeminer-cmp",
    name: "ForgeMiner: --cmp-install",
    url: "https://github.com/0xHashRaptor/ForgeMiner/wiki/CMP-unlock",
    author: "0xHashRaptor",
    type: "unlock",
    cards: ["CMP 40HX", "CMP 50HX", "CMP 70HX", "CMP 90HX"],
    difficulty: "low",
    soldering: false,
    risk: "low",
    status: "active",
    summary: "Runtime-разблокировка троттлинга прямо на риге: helper-модуль ядра, подменяющий nvidia.ko через depmod.d. VBIOS не трогается, откат одной командой и перезагрузкой.",
    unlocks: [
      { feature: "Снятие аппаратного троттлинга хешрейта/вычислений", status: "работает" },
      { feature: "Проверка состояния: forge --cmp-verify", status: "работает" }
    ],
    requires: [
      "Linux, root, headers ядра",
      "NVIDIA 610.43.03",
      "Первый запуск — доступ в интернет для сборки, если нет gcc/make"
    ],
    caveats: [
      "CMP 30HX не разблокируется вообще: механизм отсутствует на TU116, это аппаратное ограничение. Попытки применить сторонние инструменты к 30HX могут подвесить систему.",
      "Работает в контексте майнинга (HiveOS), но сам принцип — снятие троттлинга — применим и к вычислениям."
    ],
    appearsAs: "CMP 40/50/70/90HX без троттлинга",
    sources: ["forgeminer-cmp"]
  },
  {
    id: "cmp90hx-pwner",
    name: "cmp90hx_pwner",
    url: "https://github.com/iatethelogs/cmp90hx_pwner",
    author: "iatethelogs",
    type: "unlock",
    cards: ["CMP 90HX"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "Утилита с независимыми действиями: применить compute-unlock, вручную включить PCIe Gen2, включить P2P между картами. Полезна, когда нужен только один из эффектов.",
    unlocks: [
      { feature: "Compute unlock", status: "работает" },
      { feature: "PCIe Gen2 вручную", status: "работает" },
      { feature: "P2P между картами", status: "работает" }
    ],
    requires: ["Linux, root, открытый драйвер"],
    caveats: ["Карта редкая: сообщество маленькое, готовых отчётов мало."],
    appearsAs: "CMP 90HX (10 ГБ) с полной частотой",
    sources: ["cmp90hx-pwner"]
  },
  {
    id: "nvpatcher",
    name: "NVIDIA-patcher (dartraiden)",
    url: "https://github.com/dartraiden/NVIDIA-patcher",
    author: "dartraiden",
    type: "driver",
    cards: ["P102-100", "P104-100", "P106-100", "CMP 30HX", "CMP 40HX", "CMP 50HX", "CMP 70HX", "CMP 90HX", "CMP 170HX"],
    difficulty: "low",
    sellingPoint: "единственный практичный способ завести майнинговые карты в Windows",
    soldering: false,
    risk: "low",
    status: "active",
    summary: "Патчер установщика драйвера: добавляет в INF поддержку ID майнинговых карт (P102/P104/P106/CMP) и включает NVENC/NVIF там, где NVIDIA их выключила. Работает и для Windows, и для Linux.",
    unlocks: [
      { feature: "Установка актуального драйвера на карты без официальной поддержки", status: "работает" },
      { feature: "NVENC на картах, где он был программно заблокирован", status: "работает" }
    ],
    requires: ["Скачать драйвер нужной версии", "Сверить INF по инструкции репозитория"],
    caveats: [
      "На Linux карты P102/P106 обычно поднимаются и без патча — ограничение в основном Windows-проблема.",
      "Не путать с разблокировкой вычислений: патчер драйвера сам по себе не снимает лимитер у CMP."
    ],
    appearsAs: "P102-100 в диспетчере устройств может определяться как P104-100 / GTX 1080 Ti",
    sources: ["nvpatcher", "nvpatcher-575", "respec-mining"]
  },
  {
    id: "bc250-40cu",
    name: "bc250-40cu-unlock",
    url: "https://github.com/duggasco/bc250-40cu-unlock",
    author: "duggasco (ранее — сообщество BC-250)",
    type: "kernel-patch",
    cards: ["AMD BC-250"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "Патч к драйверу amdgpu: включает все 40 CU, физически присутствующих на чипе, вместо 24, которые отдаёт прошивка. Требует пересборки модуля ядра и перезагрузки.",
    unlocks: [
      { feature: "24 CU → 40 CU (1536 → 2560 шейдерных процессоров)", status: "работает" },
      { feature: "Рост prefill по данным сообщества: ~230 (24 CU) → ~371 ток/с (40 CU) на Llama-3.1-8B pp512 через HIP", status: "измерено" }
    ],
    requires: [
      "Ядро с установленными headers и linux-source",
      "Сборка модуля amdgpu (5–15 минут) и modprobe.d/initramfs",
      "Проверка: modinfo amdgpu | grep bc250 и active_cu_number в dmesg"
    ],
    caveats: [
      "После патча перестают работать таблицы частот по умолчанию — нужен governor oberon и ручная кривая.",
      "Прирост в генерации скромнее, чем в prefill: декодирование упирается в ПСП GDDR6, а не в число CU."
    ],
    appearsAs: "AMD BC-250 (RADV GFX1013), active_cu_number 40",
    sources: ["bc250-unlock", "bc250-docs"]
  },
  {
    id: "bc250-bios",
    name: "BC-250: модифицированный BIOS",
    url: "https://gitlab.com/TuxThePenguin0/bc250-bios",
    author: "TuxThePenguin0 и сообщество",
    type: "firmware",
    cards: ["AMD BC-250"],
    difficulty: "high",
    soldering: false,
    risk: "high",
    status: "active",
    summary: "Прошивка P3.00 с открытыми меню: распределение памяти VRAM/GTT, настройки чипсета, управление вентиляторами. Это то, что превращает 512 МБ «видеопамяти» в полноценные 16 ГБ, доступные GPU.",
    unlocks: [
      { feature: "VRAM/GTT split, вплоть до минимального VRAM и GTT = вся память", status: "работает" },
      { feature: "Меню чипсета, IOMMU, fan control", status: "работает" }
    ],
    requires: [
      "Прошивка через EFI Shell + afudos",
      "Крайне желателен аппаратный программатор (CH341A) как страховка",
      "Снять батарейку CMOS при проблемах с версией P4.00"
    ],
    caveats: [
      "Прошивка BIOS — самый опасный шаг во всей сборке: кирпич возможен.",
      "Часть карт приходит с уже прошитым модом (продавцы на eBay прямо указывают «modded bios»)."
    ],
    appearsAs: "меню BIOS с разделом VRAM/GTT и настройками чипсета",
    sources: ["bc250-eeb", "bc250-docs"]
  },
  {
    id: "upp-mi25",
    name: "upp (Uplift Power Play)",
    url: "https://github.com/sibradzic/upp",
    author: "sibradzic",
    type: "tuning",
    cards: ["Instinct MI25", "Instinct MI50", "Radeon VII", "Vega 56/64"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "Правка таблиц PowerPlay на лету: лимиты мощности, напряжение, частоты HBM и ядра. Для MI25/MI50 это способ выжать из карты то, что AMD оставила в паспорте (220–300 Вт), и поднять частоту HBM.",
    unlocks: [
      { feature: "SocketPowerLimit до 300 Вт и выше (реально наблюдалось 400 Вт)", status: "работает" },
      { feature: "HBM 1100 МГц, ядро 1500 МГц на MI25", status: "работает" },
      { feature: "Прирост 5–30% в зависимости от нагрузки", status: "измерено" }
    ],
    requires: ["Linux, root, доступ на запись в pp_table", "Адекватное охлаждение: карта перестанет щадить себя"],
    caveats: ["Тайминги HBM ухудшаются выше ~1150 МГц, производительность может упасть.", "Ошибки в таблице приводят к чёрному экрану до ребута."],
    appearsAs: "та же карта, но с другими лимитами и частотами",
    sources: ["l1t-mi25", "krusic-mi25"]
  },
  {
    id: "mi25-flash",
    name: "Перепрошивка MI25 → WX 9100 / Vega 64",
    url: "https://hiveon.com/forum/t/radeon-instinct-mi25-vbios/65992",
    author: "сообщество",
    type: "firmware",
    cards: ["Instinct MI25"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "MI25 и Radeon Pro WX 9100 — одна и та же плата Vega 10 с 16 ГБ HBM2. Прошивка BIOS от WX 9100 (или Vega 64 с 16 ГБ) даёт видеовыход Mini-DP, драйверы Adrenalin/Pro и возможность крутить частоты.",
    unlocks: [
      { feature: "Видеовыходы и поддержка обычных драйверов", status: "работает" },
      { feature: "Ручное управление частотами и вольтажом", status: "работает" }
    ],
    requires: ["Linux (в Windows amdvbflash на этих картах капризничает)", "Файл BIOS от WX 9100", "Резервный вариант восстановления (двойной BIOS на карте или программатор)"],
    caveats: ["При неверной прошивке карта перестаёт инициализироваться; на части MI25 есть двойной BIOS, что спасает."],
    appearsAs: "AMD Radeon Pro WX 9100 / RX Vega 64 (16 ГБ)",
    sources: ["l1t-mi25", "hiveon-mi25"]
  },
  {
    id: "mx-llama",
    name: "mx-llama.cpp / llama.cpp-gfx906",
    url: "https://github.com/mxdzyx/mx-llama.cpp",
    author: "mxdzyx и сообщество",
    type: "engine",
    cards: ["Instinct MI50", "Instinct MI60", "Radeon VII"],
    difficulty: "medium",
    soldering: false,
    risk: "low",
    status: "active",
    summary: "Форк llama.cpp с тюнингом кернелов под gfx906 и тензорным параллелизмом. Нужен потому, что AMD официально не поддерживает эти карты в свежих ROCm, а сообщество — поддерживает.",
    unlocks: [
      { feature: "Быстрый tg/tg на gfx906 (вплоть до +25% к апстриму на свежих коммитах)", status: "работает" },
      { feature: "Мульти-GPU TP и MTP", status: "работает" }
    ],
    requires: ["ROCm 5.7 / 6.x либо Vulkan-бэкенд", "Либо HSA_OVERRIDE_GFX_VERSION для нестандартных сборок"],
    caveats: ["Форк обновляется волонтёрами: отставание от апстрима в недели и месяцы."],
    appearsAs: "без изменений в системе — это только программное обеспечение",
    sources: ["mi50-mx", "openclaw-mi50", "scoreboard-rocm"]
  },
  {
    id: "colibri",
    name: "colibri (MoE на старых GPU)",
    url: "https://github.com/JustVugg/colibri",
    author: "JustVugg и участники",
    type: "engine",
    cards: ["Tesla M10", "Tesla M40", "Tesla M60", "Tesla P40", "Tesla P100", "RDNA2"],
    difficulty: "high",
    soldering: false,
    risk: "low",
    status: "active",
    summary: "Движок, специально заточенный под разреженные MoE-модели на старом железе: эксперты живут в VRAM, плотный «ствол» — на CPU. Работает даже там, где llama.cpp упирается (Maxwell sm_50, RDNA2 без WMMA).",
    unlocks: [
      { feature: "CUDA-бэкенд ниже sm_80 (проверено на sm_50, Maxwell)", status: "работает" },
      { feature: "Полное размещение 10 240 экспертов MoE в VRAM на 4×Tesla M10 (32 ГБ)", status: "измерено" },
      { feature: "Скорость: 7.3 ток/с против 2.45 ток/с у самого colibri на том же железе в llama.cpp", status: "измерено" }
    ],
    requires: ["Сборка под нужную архитектуру (CUDA 11.8 для Maxwell)", "Терпение: движок нишевый, документация в issues"],
    caveats: ["Ориентирован на MoE: на плотных моделях выигрыша нет.", "Требует ручной возни с heat.bin и распределением экспертов."],
    appearsAs: "без изменений в системе — это приложение",
    sources: ["colibri", "colibri-1652"]
  },
  {
    id: "ollama-legacy",
    name: "ollama-legacy-gpu",
    url: "https://github.com/h3rb3rn/ollama-legacy-gpu",
    author: "h3rb3rn",
    type: "runtime",
    cards: ["Tesla M10", "Tesla M40", "Tesla M60", "Tesla P4", "Tesla P40", "Tesla P100", "V100"],
    difficulty: "low",
    soldering: false,
    risk: "low",
    status: "active",
    summary: "Форк Ollama с готовыми Docker-сборками под Maxwell, Pascal, Volta и новее. Решает главную боль 2026 года: апстрим-стек собрал CUDA без sm_50…sm_70, и старая Tesla просто «не видна».",
    unlocks: [
      { feature: "Современные модели через Ollama на Maxwell/Pascal/Volta", status: "работает" },
      { feature: "Готовые образы и пресеты, тесты в репозитории", status: "работает" }
    ],
    requires: ["Docker", "Совместимый драйвер (580.x для Maxwell/Pascal/Volta)", "Сборка или скачивание образа"],
    caveats: ["Не превращает карту в современную: упор в ПСП и отсутствие Flash Attention (до sm_70)."],
    appearsAs: "без изменений в системе",
    sources: ["ollama-legacy", "ollama-legacy-ms"]
  },
  {
    id: "vram-mod-2080ti",
    name: "Мод VRAM 11 → 22 ГБ (RTX 2080 Ti и др.)",
    url: "https://www.tomshardware.com/pc-components/gpus/chinese-workshops-recondition-nvidias-old-flagship-gaming-gpu-for-ai-rtx-2080-ti-upgraded-to-22gb-for-dollar499",
    author: "китайские мастерские (Taobao/Goofish, перепродажа на eBay)",
    type: "hardware-mod",
    cards: ["RTX 2080 Ti 22GB", "RTX 2080 Ti 44GB", "RTX 3070 16GB"],
    difficulty: "extreme",
    soldering: true,
    risk: "high",
    status: "active",
    summary: "Замена одиннадцати 1-ГБ чипов GDDR6 на 2-ГБ. Требует паяльной станции, правильной прошивки страпов и проверки под нагрузкой. Обычно покупают уже готовую карту.",
    unlocks: [
      { feature: "11 ГБ → 22 ГБ VRAM (или 44 ГБ при двойном ранге)", status: "работает" },
      { feature: "Ничего, кроме объёма: ПСП, число CUDA-ядер и тензорных блоков не меняются", status: "ограничение" }
    ],
    requires: ["Паяльная станция/ИК-станция и навык BGA-пайки", "Правильные чипы (например, K4ZAF325BM-HC16)", "Свой VBIOS или готовый от мастерской"],
    caveats: [
      "Пропускная способность остаётся 616 ГБ/с — карта не станет быстрее, просто влезет больше модели.",
      "Стресс-тест GPU-Z показывает только детект памяти, а не стабильность: гоняйте llama.cpp и memtest_vulkan.",
      "Китайские перепродавцы часто ставят б/у чипы после реболла."
    ],
    appearsAs: "NVIDIA GeForce RTX 2080 Ti, 22 528 МБ",
    sources: ["tomshw-2080ti", "itechguides-2080ti"]
  },
  {
    id: "v100-sxm2-adapter",
    name: "Адаптер SXM2 → PCIe для V100",
    url: "https://videocardz.com/newz/200-nvidia-v100-server-gpu-mod-beats-rtx-3060-in-local-llm-test",
    author: "китайские производители плат",
    type: "hardware-mod",
    cards: ["Tesla V100 16GB SXM2", "Tesla V100 32GB SXM2"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "Плата-переходник, в которую ставится серверный модуль V100 SXM2, превращая его в обычную PCIe-карту. Позволяет использовать модули, которые иначе живут только в SXM-шасси.",
    unlocks: [
      { feature: "V100 SXM2 в обычном PCIe x16 слоте", status: "работает" },
      { feature: "Иногда — по два модуля на одной плате с NVLink", status: "работает" }
    ],
    requires: ["Активное охлаждение (модуль рассчитан на продув сервера)", "Питание 8-pin ×2–3, серьёзный БП", "Дискретная видеокарта для вывода изображения"],
    caveats: ["Драйверы: свежие ветки требуют сборки вручную (Ollama 0.30+ ломает поддержку V100).", "Цены на модули и адаптеры сильно зависят от поставщика."],
    appearsAs: "Tesla V100-SXM2-16GB (или 32GB)",
    sources: ["runaihome-v100", "videocardz-v100"]
  },
  {
    id: "p102-bios",
    name: "Разблокировка 5 → 10 ГБ на P102-100",
    url: "https://www.techpowerup.com/vgabios/?architecture=Pascal&manufacturer=NVIDIA&model=P102-100",
    author: "сообщество (BIOS-база TechPowerUp)",
    type: "firmware",
    cards: ["P102-100"],
    difficulty: "medium",
    soldering: false,
    risk: "medium",
    status: "active",
    summary: "Прошивка BIOS с корректной конфигурацией памяти у карт, которые продавались как 5-ГБ, но физически несут 10 ГБ GDDR5X (10 чипов по 1 ГБ).",
    unlocks: [
      { feature: "5 ГБ → 10 ГБ VRAM", status: "работает" },
      { feature: "Драйвер видит полный объём", status: "работает" }
    ],
    requires: ["nvflash (в DOS/Linux)", "Проверка версии BIOS платы", "Понимание, что часть карт реально физически 5-ГБ"],
    caveats: ["Ширина шины 320 бит остаётся, ПСП не растёт — растёт только объём.", "PCIe x4 (электрически) не меняется."],
    appearsAs: "NVIDIA P102-100, 10 240 MiB",
    sources: ["scoreboard-cuda", "reddit-battle-cheap"]
  },
  {
    id: "spark-decode",
    name: "Патч llama.cpp под CMP (DISABLE_DP4A, fmad=false)",
    url: "https://www.reddit.com/r/LocalLLM/comments/1vaby7g/how_i_doubled_the_tg_of_llamacpp_on_cmp_50hx_gpu/",
    author: "владелец двух CMP 50HX (r/LocalLLM)",
    type: "engine-patch",
    cards: ["CMP 50HX", "CMP 40HX", "CMP 30HX", "CMP 90HX", "CMP 170HX"],
    difficulty: "medium",
    soldering: false,
    risk: "low",
    status: "reported",
    summary: "Правка ggml/src/ggml-cuda/common.cuh и сборка с -DCMAKE_CUDA_FLAGS=\"-DDISABLE_DP4A --fmad=false\": обход инструкций, которые NVIDIA задушила на CMP-кремнии. Сообщается о двукратном росте скорости генерации.",
    unlocks: [
      { feature: "Ускорение генерации на CMP (в отчёте — ×2)", status: "заявлено" },
      { feature: "Обход торможения FMA/DP4A", status: "работает" }
    ],
    requires: ["Своя сборка llama.cpp", "Проверка качества вывода: обход инструкций может менять точность"],
    caveats: ["Отчёт единичный, воспроизводимость не подтверждена независимо.", "Правки в common.cuh нужно заново накладывать при обновлении апстрима."],
    appearsAs: "без изменений в системе",
    sources: ["reddit-50hx-dp4a"]
  },
  {
    id: "v100-cmp-fma",
    name: "FMA-воркэраунд для GA100/CMP 170HX",
    url: "https://arxiv.org/pdf/2505.03782",
    author: "исследовательская работа (arXiv 2505.03782) + niconini",
    type: "engine-patch",
    cards: ["CMP 170HX"],
    difficulty: "medium",
    soldering: false,
    risk: "low",
    status: "superseded",
    summary: "Исторический приём: FP32 на залоченном 170HX выдавал 0.39 Тфлопс — в 32 раза ниже паспорта. Сборка с -fmad=false или cmppatcher поднимала FP32 примерно до 6.2 Тфлопса. Сегодня вытеснен полной разблокировкой через cmpunlocker, но полезен как диагностика «а точно ли карта залочена».",
    unlocks: [
      { feature: "FP32 ≈0.39 → ~6.2 Тфлопса (×15)", status: "измерено" },
      { feature: "Ускорение декодирования квантизованных моделей Q6/Q4_K_M", status: "измерено" }
    ],
    requires: ["Своя сборка llama.cpp/PyTorch", "Понимание, что это обход, а не разблокировка"],
    caveats: ["После выхода cmpunlocker смысл почти пропал: полная разблокировка даёт ~193 Тфлопса тензорных операций против ~6 Тфлопс обхода."],
    appearsAs: "та же карта",
    sources: ["arxiv-cmp", "170th-street"]
  },
  {
    id: "nvcleanstall",
    name: "NVCleanstall / force-install драйвера",
    url: "https://respec.io/mining-gpu-installation/",
    author: "TechPowerUp / Respec",
    type: "driver",
    cards: ["P102-100", "P104-100", "P106-100", "CMP 100-210", "CMP 100-200"],
    difficulty: "low",
    soldering: false,
    risk: "low",
    status: "active",
    summary: "Практический обход отсутствия официальной поддержки в Windows: собрать пакет драйвера с базой от P104-100 и добавить ID нужной карты, либо принудительно выбрать драйвер в диспетчере устройств.",
    unlocks: [
      { feature: "Mining-карта работает в Windows 10/11", status: "работает" },
      { feature: "Известные ID: CMP 100-210 — 1D84, CMP 100-200 — 1DC1/1D83, P102 — 1B47/1B07", status: "справочно" }
    ],
    requires: ["NVCleanstall", "Базовый драйвер 496.76 (или новее по инструкции)"],
    caveats: ["Гарантий нет: иногда после обновления Windows карта снова отваливается.", "На Linux этих сложностей обычно нет."],
    appearsAs: "может определиться как P104-100 или GTX 1080 Ti",
    sources: ["respec-mining", "nvcleanstall-tpu"]
  }
];
