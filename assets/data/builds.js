/* =========================================================================
   Реальные сборки сообщества. Приоритет — X99/Xeon, но есть и другие.
   ========================================================================= */
window.BLDL = window.BLDL || {};
BLDL.builds = [];

BLDL.builds.push(
{
  id: "x99-3xp40",
  title: "X99 + 3×Tesla P40: «96 ГБ VRAM за $700»",
  author: "nero10578 (r/LocalLLaMA)",
  date: "2023-11",
  source: "https://www.reddit.com/r/LocalLLaMA/comments/17zpr2o/nvidia_tesla_p40_performs_amazingly_well_for/",
  platform: "X99, одна сокета, 40 линий PCIe от CPU + PLX-коммутаторы на плате",
  parts: {
    cpu: "Intel Xeon E5-2679 v4 (20 ядер)",
    motherboard: "ASUS X99-E-10G WS — 4 слота, все x16 через PLX",
    ram: "256 ГБ DDR4-2400 ECC RDIMM (8×32)",
    gpus: "3–4× Tesla P40 24 ГБ (пассивные, шрауд + турбина)",
    psu: "Не указан, но 3×P40 по 250 Вт требуют ≥1000 Вт",
    os: "Ubuntu (bare metal)"
  },
  results: [
    { model: "Llama/Mistral 7B", quant: "Q8_0", ctx: 16384, tg: 25.8, pp: 672, backend: "llama.cpp" },
    { model: "Mixtral 8x7B", quant: "Q5–Q6", ctx: 16384, tg: 20, pp: null, backend: "llama.cpp / llamafile" },
    { model: "Llama 3.1 70B", quant: "Q4_K_S", ctx: 8192, tg: 3.5, pp: null, backend: "llama.cpp, 2 карты" }
  ],
  whatWorked: [
    "PLX-коммутаторы на плате дают всем картам полноценные x16 — для multi-GPU GGUF это заметный плюс",
    "Потребление P40 в инференсе скромнее паспорта: 50 Вт с загруженной моделью и 100–160 Вт под нагрузкой",
    "Добавление четвёртой карты неожиданно дало +1.5 ток/с: llama.cpp раскидывает слои, и узкие места разъезжаются"
  ],
  whatFailed: [
    "PCIe x8 после добавления сетевой карты — на скорость почти не повлияло, но загрузка модели замедлилась",
    "Планировать 70B на Pascal бессмысленно: 3.5 ток/с — это граница терпения"
  ],
  costNote: "Автор брал P40 по $175, X99-плату ~$200, Xeon ~$40, 256 ГБ RDIMM ~$200. Итого около $700–900 за 96 ГБ VRAM — по состоянию на 2023 год.",
  tags: ["x99", "p40", "multi-gpu", "экономия"]
},

{
  id: "x99-2xp40-moe",
  title: "X99 + 2×P40: MoE 35B на 35 ток/с",
  author: "tehinterwebs56 (r/LocalLLM)",
  date: "2026-03",
  source: "https://www.reddit.com/r/LocalLLM/comments/1rpleel/nvidia_tesla_p40_for_a_headless_computer_for/",
  platform: "X99 сервер, две карты",
  parts: {
    cpu: "Xeon E5 v4",
    motherboard: "X99",
    ram: "—",
    gpus: "2× Tesla P40 24 ГБ",
    os: "Linux, Ollama / llama.cpp"
  },
  results: [
    { model: "Qwen3.5 35B (MoE)", quant: "Q4", ctx: 32768, tg: 35, pp: 250, backend: "Ollama" },
    { model: "Qwen3.5 35B (MoE)", quant: "Q4", ctx: 80000, tg: 35, pp: 120, backend: "Ollama" }
  ],
  whatWorked: [
    "MoE-модели — лучший сценарий для Pascal: активных параметров мало, и ПСП перестаёт быть приговором",
    "Prefill 250 ток/с на коротком контексте полностью достаточен для чата"
  ],
  whatFailed: [
    "vLLM не работает: CUDA-версия для Pascal слишком старая для актуальных сборок",
    "Плотные модели на 35B+ идут в разы медленнее"
  ],
  costNote: "Сборка на вторичке — примерно $500–700 вместе с памятью.",
  tags: ["x99", "p40", "moe", "ollama"]
},

{
  id: "x99-dual-4x3090",
  title: "Китайская X99 Dual Plus + 4×RTX 3090 = 96 ГБ",
  author: "ldenel (r/LocalLLaMA)",
  date: "2024-06",
  source: "https://www.reddit.com/r/LocalLLaMA/comments/1d6cefm/vram_powerhouse/",
  platform: "Двухсокетная китайская X99 (Jingsha X99 Dual Plus с AliExpress)",
  parts: {
    cpu: "2× Xeon E5-2643 v5",
    motherboard: "X99 Dual Plus (AliExpress), 4 физических слота x16",
    ram: "DDR4 ECC",
    gpus: "4× RTX 3090 FE (24 ГБ)",
    os: "Linux"
  },
  results: [
    { model: "Модели 70B+", quant: "Q4", ctx: 8192, tg: null, pp: null, backend: "llama.cpp / vLLM", note: "96 ГБ суммарно: 70B в Q8 или даже FP8-варианты" }
  ],
  whatWorked: [
    "Все четыре карты ставятся напрямую в слоты, без райзеров — экономия денег и меньше точек отказа",
    "Плата даёт x16 на слот (по крайней мере, физически)"
  ],
  whatFailed: [
    "NVLink не подключить без специальных мостов на 4 карты",
    "Двухсокетная плата требует двух CPU с одинаковым количеством линий и нормальным БП"
  ],
  costNote: "4×3090 — основная статья расходов; плата и процессоры вместе дешевле одной карты.",
  tags: ["x99", "3090", "multi-gpu", "китайская-плата"]
},

{
  id: "r730-2xp40",
  title: "Dell R730 + 2×P40 под Ubuntu",
  author: "Mambiux (r/LocalLLaMA), и аналогичные отчёты",
  date: "2023-11",
  source: "https://www.reddit.com/r/LocalLLaMA/comments/17zpr2o/nvidia_tesla_p40_performs_amazingly_well_for/",
  platform: "Готовый сервер 2U, dual Xeon",
  parts: {
    cpu: "2× Xeon E5-2690 v4",
    motherboard: "Dell R730",
    ram: "160 ГБ",
    gpus: "2× Tesla P40 (оба в слотах x16)",
    os: "Ubuntu Server, bare metal"
  },
  results: [
    { model: "Llama 3 70B", quant: "Q4_K_S", ctx: 8192, tg: 3.5, pp: null, backend: "llama.cpp", note: "По отчётам других владельцев про той же схеме" },
    { model: "8B класс", quant: "Q4–Q8", ctx: 8192, tg: 25, pp: null, backend: "llama.cpp / Ollama" }
  ],
  whatWorked: [
    "Готовый сервер решает вопрос охлаждения: продув фронт-бэк вытягивает пассивные P40 без колхоза",
    "Питание через EPS-разъёмы блока сервера — переходники на PCIe дешевле и надёжнее, чем ATX-колхоз",
    "ECC RDIMM-память стоит копейки и снимает вопрос стабильности"
  ],
  whatFailed: [
    "Шум: 2U-сервер в комнате — плохая идея",
    "Нужен переходник EPS → PCIe 8-pin, иначе карта просто не включится"
  ],
  costNote: "Б/у R730 с двумя процессорами и памятью — от $200; карты — отдельно.",
  tags: ["сервер", "p40", "dell", "x99-поколение"]
},

{
  id: "x99-2xmi50",
  title: "X99-класс + 2×MI50: 64 ГБ HBM2 на AMD",
  author: "Ruslan и участники r/LocalLLaMA (гайд по Ubuntu 22.04)",
  date: "2026-03",
  source: "https://www.reddit.com/r/LocalLLaMA/comments/1rzlhfk/getting_dual_mi50_32gb_cards_working_with/",
  platform: "Обычная ATX-плата с двумя x16 (Gen3 достаточно)",
  parts: {
    cpu: "Любой современный Ryzen/EPYC с 2×x16",
    motherboard: "ATX, PCIe 3.0+",
    gpus: "2× AMD Instinct MI50 32 ГБ",
    os: "Ubuntu 22.04 + ROCm 5.7 / Vulkan"
  },
  results: [
    { model: "Qwen3 8B", quant: "Q4_K_M", ctx: 8192, tg: 62, pp: null, backend: "llama.cpp (ROCm)", note: "Раскладка по слоям между двумя картами" }
  ],
  whatWorked: [
    "Слоистая раскладка (-sm layer) даёт честное масштабирование: обе карты работают, а не ждут друг друга",
    "64 ГБ HBM2 за $400–500 — лучшая ПСП на доллар из всего, что можно поставить в обычный корпус"
  ],
  whatFailed: [
    "ROCm ставится только из старых веток: официальная поддержка gfx906 прекращена",
    "Плотные модели 30B+ на одной карте идут медленно по prefill"
  ],
  costNote: "2×MI50 по $150–200 = $300–400, плюс плата с двумя x16.",
  tags: ["amd", "mi50", "rocm", "pair"]
},

{
  id: "bc250-cluster",
  title: "Кластер из двух BC-250: 70 ток/с на Qwen3-30B-A3B",
  author: "участники r/LocalLLM и сообщество BC-250",
  date: "2026-08",
  source: "https://www.reddit.com/r/LocalLLM/comments/1vs1o3m/amd_bc250_proscons/",
  platform: "Две самостоятельные платы, соединённые по Ethernet, llama.cpp RPC",
  parts: {
    cpu: "Zen 2 6c/12t на каждой плате",
    gpus: "2× GFX1013 (24 CU каждая, после патча — 40 CU)",
    ram: "16 ГБ GDDR6 на каждой плате (общая с CPU)",
    os: "Linux, llama.cpp с VULKAN + RPC"
  },
  results: [
    { model: "Qwen3-30B-A3B (MoE)", quant: "Q4_K_M", ctx: 8192, tg: 70, pp: null, backend: "llama.cpp (Vulkan + RPC)" },
    { model: "Qwen3.8-27B (плотная)", quant: "Q4", ctx: 65536, tg: 12, pp: null, backend: "Vulkan + RPC + MTP", note: "Плотная модель через RPC масштабируется плохо: 12–17 ток/с" }
  ],
  whatWorked: [
    "MoE-модели: эксперты раскладываются на две платы, и суммарные 32 ГБ начинают работать",
    "Уровень 70 ток/с на 30B MoE за ~$300 суммарно — лучший результат в базе по соотношению цена/скорость"
  ],
  whatFailed: [
    "Выше двух узлов масштабирование ломается: сеть становится узким местом",
    "Плотные модели 27B+ через RPC идут медленнее, чем на одной карте с большей ПСП"
  ],
  costNote: "2×BC-250 по $100–180, плюс БП, корпус, NVMe. Итого $400–600.",
  tags: ["bc250", "кластер", "moe", "amd"]
},

{
  id: "4xcmp100-210",
  title: "3×CMP 100-210 + RTX 3070: 56 ГБ адресуемой памяти",
  author: "profbx (r/LocalLLM)",
  date: "2026-03",
  source: "https://www.reddit.com/r/LocalLLM/comments/1rpleel/nvidia_tesla_p40_for_a_headless_computer_for/",
  platform: "Домашний сервер, Windows и Linux",
  parts: {
    gpus: "3× CMP 100-210 16 ГБ + 1× RTX 3070 8 ГБ",
    os: "Сначала Windows (мучение), потом Ubuntu 24.04 + открытый драйвер 570"
  },
  results: [
    { model: "Модели до 28 ГБ", quant: "Q4–Q8", ctx: 8192, tg: null, pp: null, backend: "llama.cpp / Ollama", note: "Загрузка моделей — 2–4 минуты из-за PCIe x1" }
  ],
  whatWorked: [
    "x1-ширина не мешает инференсу — только загрузке. Автор подчёркивает это отдельно",
    "3×16 ГБ HBM2 дают огромный объём за смешные деньги"
  ],
  whatFailed: [
    "В Windows карта ставится только форсированием драйвера Titan V (даже драйвер V100 не подходит)",
    "Загрузка модели растёт с числом карт: 2 карты — 2 минуты, 3 карты — 3 минуты",
    "Ollama по умолчанию выгружает модель и теряет весь выигрыш от большого объёма"
  ],
  costNote: "Карты по $120–150 каждая: около $400 за 48 ГБ HBM2.",
  tags: ["cmp", "hbm2", "multi-gpu", "windows-боль"]
},

{
  id: "170hx-workstation",
  title: "Одна CMP 170HX как сервер на 262k контекста",
  author: "r/LocalLLM (пост «I Unlocked a $800 Mining GPU…»)",
  date: "2026-08",
  source: "https://www.reddit.com/r/LocalLLM/comments/1vw09b1/i_unlocked_a_800_mining_gpu_into_a_64gb/",
  platform: "Обычный десктоп + одна разблокированная карта",
  parts: {
    cpu: "Ryzen 5 5600X",
    ram: "64 ГБ",
    gpus: "1× CMP 170HX (8 ГБ → 64 ГБ после cmpunlocker)",
    os: "Proxmox/Linux + открытый драйвер 610.57.04",
    psu: "Лимит мощности выставлен в 175 Вт — карта не греется и не шумит"
  },
  results: [
    { model: "Qwen3.8-27B (W4A16 AWQ + INT8 head)", quant: "W4A16", ctx: 262144, tg: 84, pp: null, backend: "vLLM + MTP", note: "84 ток/с на 1k контекста, 72 ток/с на 64k" }
  ],
  whatWorked: [
    "64 ГБ позволяют держать 262k контекста в fp8 KV без единого вытеснения на CPU",
    "Спекулятивное декодирование (MTP) — ключ к скорости на GA100: без него те же настройки дают ~40 ток/с",
    "Лимит 175 Вт достаточен: карта не упирается в питание на инференсе"
  ],
  whatFailed: [
    "vLLM требует подбора флагов: max-num-batched-tokens 4096, иначе выигрыша нет",
    "Патч BAR1 в 64 ГБ на некоторых картах приводит к Xid 31 и отказу загрузки — автор столкнулся с этим дважды"
  ],
  costNote: "На момент поста карта стоила около $800, что уже втрое дороже, чем до публикации эксплойта.",
  tags: ["cmp170hx", "разблокировка", "vllm", "длинный-контекст"]
},

{
  id: "huananzhi-f8",
  title: "Huananzhi F8 + P40: «проверенная китайская X99»",
  author: "сводный отчёт участников r/LocalLLaMA",
  date: "2024-06",
  source: "https://www.reddit.com/r/LocalLLaMA/comments/1d9q1sn/lets_talk_about_chinese_x99_motherboards_for_llm/",
  platform: "X99, 8 слотов памяти",
  parts: {
    cpu: "Xeon E5 v3/v4 (совместимость проверять по BIOS)",
    motherboard: "Huananzhi F8",
    ram: "до 128 ГБ DDR4 RDIMM (4 канала)",
    gpus: "1–3× Tesla P40 (в зависимости от линий)",
    os: "Linux"
  },
  results: [],
  whatWorked: [
    "В BIOS есть всё нужное: Above 4G Decoding, бифуркация, CSM, ASPM",
    "Плата «самая проверенная» — под неё больше всего отчётов в сообществе",
    "Патч ReBAR необязателен: ускорение загрузки моделей есть, но и без него работает"
  ],
  whatFailed: [
    "Не у всех ревизий BIOS есть ReBAR — узнать можно только по факту",
    "VRM слабые: с 140-Вт процессором и постоянной нагрузкой стоит думать про обдув VRM",
    "Заявленные «10 фаз» в дешёвых китайских платах — маркетинг: на деле 4–8 и деградация выше 115 Вт"
  ],
  costNote: "Комплект плата + Xeon v4 + 128 ГБ RDIMM обычно $200–300.",
  tags: ["x99", "китайская-плата", "p40", "bios"]
},

{
  id: "k80-antipattern",
  title: "Антипример: узел на 4×Tesla K80",
  author: "сообщество (несколько отчётов 2024–2026)",
  date: "2024-11",
  source: "https://www.reddit.com/r/LocalLLaMA/comments/1h38my4/is_it_practical_to_build_a_local_llm_system_with/",
  platform: "Любая плата с 4 слотами",
  parts: { gpus: "4× K80 = 8 чипов Kepler", os: "Linux + сборка llama.cpp под sm_37" },
  results: [
    { model: "Модель ~12B", quant: "Q4", ctx: 4096, tg: 3.5, pp: null, backend: "llama.cpp", note: "Практически не отличается от CPU-инференса на приличном процессоре" }
  ],
  whatWorked: ["За $40–80 карта даёт 24 ГБ — соблазн понятен"],
  whatFailed: [
    "Каждый чип видит только свои 12 ГБ — модель должна делиться ровно",
    "Kepler выпал из современного CUDA: сборка движка вручную",
    "Flash Attention невозможен, FP16 нет",
    "Итоговая скорость — один токен в секунду на разнице с нормальной картой"
  ],
  costNote: "Кажется дешёвым, но потраченное время дороже разницы с P40.",
  tags: ["kepler", "не-покупать", "антипример"]
},

{
  id: "sandy-m10-colibri",
  title: "Sandy Bridge + 4×Tesla M10: 32 ГБ под MoE",
  author: "ggeorgovassilis (issue #1652 в colibri)",
  date: "2026-09",
  source: "https://github.com/JustVugg/colibri/issues/1652",
  platform: "Сервер поколения Sandy Bridge, без AVX2",
  parts: {
    cpu: "2× Xeon E5-2640 (Sandy Bridge, без AVX2/FMA)",
    motherboard: "Серверная плата с 4 слотами",
    ram: "128 ГБ (по 64 ГБ на NUMA-узел)",
    gpus: "4× Tesla M10 = 32 ГБ суммарно (8 ГБ на чип)",
    os: "Ubuntu 24.04 + Docker + CUDA 11.8"
  },
  results: [
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "int4 gs=64 (colibri)", ctx: 4096, tg: 2.45, pp: null, backend: "colibri CUDA", note: "100% экспертов в VRAM, 0 промахов на CPU" },
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "UD-IQ3_XXS", ctx: 32768, tg: 7.3, pp: null, backend: "llama.cpp (-ngl 99 -ts 1,1,1,1)" }
  ],
  whatWorked: [
    "32 ГБ на четырёх чипах вмещают все 10 240 экспертов MoE-модели",
    "Максимальная пропускная способность достигается не на GPU, а на… отсутствии AVX2 у процессора — узкое место оказалось в CPU",
    "Эксперимент доказал: портируемые CUDA-ядра корректны на Maxwell (sm_50)"
  ],
  whatFailed: [
    "Плотная часть модели осталась на CPU и стала потолком",
    "Спекулятивное декодирование и MTP на этой связке не помогают",
    "Для нормальной скорости нужен современный CPU — и тогда M10 снова оказывается медленным звеном"
  ],
  costNote: "M10 продаются по $25–40; плата и память дороже карт.",
  tags: ["maxwell", "m10", "moe", "colibri", "экзотика"]
}
);
