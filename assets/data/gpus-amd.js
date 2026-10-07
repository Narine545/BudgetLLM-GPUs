/* =========================================================================
   AMD — Instinct, gfx906 и майнинговая плата BC-250.
   ========================================================================= */
window.BLDL = window.BLDL || {};
BLDL.gpus = BLDL.gpus || [];

BLDL.gpus.push(

/* -------------------------------------------------------------------- MI50 */
{
  id: "instinct-mi50",
  name: "AMD Instinct MI50",
  short: "32 ГБ HBM2, 1024 ГБ/с — больше ПСП, чем у 3090",
  category: "datacenter",
  arch: "Vega 20 (gfx906)",
  year: 2018,
  formFactor: "PCIe 4.0 x16, 2 слота, пассивная",
  verdict:
    "Самый интересный лот AMD: 32 ГБ HBM2 и 1024 ГБ/с — больше пропускной способности, чем у RTX 3090, за четверть цены. Расплата — программная: AMD официально не поддерживает gfx906 в свежем ROCm, поэтому живут на ROCm 5.7, форках сообщества или Vulkan. Именно поэтому MI50 в 2026 году — «умная, но капризная» карта.",
  bestFor: [
    "32 ГБ VRAM под 27–32B в Q4/Q5 на одной карте",
    "MoE-модели: 30B-A3B выдаёт 75 ток/с",
    "Мультикарточные стенды: две MI50 = 64 ГБ и 235B в IQ1_S на грани играбельности"
  ],
  risks: [
    "ROCm 7.x официально не поддерживает gfx906: нужен ROCm 5.7, дистрибутивные пакеты или форки",
    "Prefill слабый: 187 ток/с на 27B Q4 при 24.6 ток/с генерации — асимметрия, к которой нужно привыкнуть",
    "Нет Flash Attention в большинстве сборок → длинный контекст дорог",
    "300 Вт и пассивное охлаждение",
    "Рынок ломается: часть продавцов просит втрое больше реальной цены"
  ],
  memory: { stock: 32, mod: null, type: "HBM2", busBits: 4096, bandwidth: 1024, ecc: true },
  compute: { cores: 3840, coreLabel: "потоковых процессоров (60 CU)", sms: "60 CU", tensor: "Нет (нет и матричных блоков — RDNA-стиль)", fp32: 13.3, fp16: 26.5, int8: "53 TOPS", notes: "FP16 удвоенной скорости: полезно для EXL2-подобных схем, но экосистема на AMD это использует хуже, чем NVIDIA" },
  io: { pcieGen: 4, pcieLanes: 16, pcieNote: "x16 Gen4 — роскошь для 2018 года и заметное преимущество при мульти-GPU", videoOut: false, nvlink: false, rebar: "Поддерживается" },
  power: { tdp: 300, connectors: "2×8-pin", cooling: "Пассивная; часто ставят в серверные шасси с продувом", measuredLoad: "Ограничен 300 Вт; с правкой PowerPlay держит 400 Вт" },
  software: {
    cuda: "—",
    driver: "ROCm 5.7 (последняя полностью поддерживаемая версия для gfx906) либо дистрибутивные сборки ROCm 6.x",
    backends: ["llama.cpp (ROCm/HIP, форк mx-llama)", "llama.cpp (Vulkan)", "Ollama (Vulkan или старый ROCm)"],
    os: "Ubuntu 22.04/24.04 — самый проверенный вариант",
    notes: "HSA_OVERRIDE_GFX_VERSION=9.0.6 помогал в ряде сборок. Официальная страница ROCm 7.14 перечисляет MI50 как unsupported."
  },
  mods: [
    { toolId: "mx-llama", title: "mx-llama.cpp", result: "gfx906-кернелы: до +25% к апстриму на свежих коммитах", soldering: false },
    { toolId: "upp-mi25", title: "upp: правка PowerPlay", result: "Поднятие лимита мощности и частоты HBM", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 2048, backend: "llama.cpp (ROCm)", rig: "1×MI50 32 ГБ", tg: 71.1, pp: null, src: "ahelpme-mi50", confidence: "measured", note: "По квантизациям: Q5 67, Q8 45, BF16 31, F32 20 ток/с — старение почти линейно по объёму" },
    { model: "Llama 7B", quant: "Q4_0", ctx: 1024, backend: "llama.cpp (ROCm)", rig: "1×MI50 32 ГБ", tg: 105, pp: 1250, src: "wtarreau-mi50", confidence: "measured", note: "100–110 ток/с генерации, 1200–1300 prefill с/без Flash Attention" },
    { model: "Qwen3.6-27B", quant: "Q4_K_M", ctx: 2048, backend: "llama.cpp (ROCm)", rig: "1×MI50", tg: 24.6, pp: 187.6, src: "ahelpme-mi50", confidence: "measured" },
    { model: "Qwen3.6-27B", quant: "Q5_K_M", ctx: 2048, backend: "llama.cpp (ROCm)", rig: "2×MI50 (64 ГБ)", tg: 22.4, pp: 122.9, src: "ahelpme-mi50", confidence: "measured", note: "Вторая карта добавляет объём, но не скорость: генерация даже чуть падает" },
    { model: "Qwen3 30B-A3B (MoE)", quant: "Q5_K_M", ctx: 2048, backend: "llama.cpp (ROCm, FA)", rig: "1×MI50", tg: 75.7, pp: 587.9, src: "wtarreau-mi50", confidence: "measured" },
    { model: "Qwen3-VL 32B", quant: "Q4_K_M", ctx: 2048, backend: "llama.cpp (ROCm, FA)", rig: "1×MI50", tg: 19.8, pp: 216.4, src: "wtarreau-mi50", confidence: "measured" },
    { model: "Qwen3.6-8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (ROCm), 2 карты", rig: "2×MI50", tg: 62, pp: null, src: "reddit-mi50-dual", confidence: "reported" },
    { model: "Qwen3-VL-MoE 235B-A22B (MoE)", quant: "IQ1_S (50.7 ГБ)", ctx: 2048, backend: "llama.cpp (ROCm, 2 карты)", rig: "2×MI50", tg: 19.9, pp: 137.1, src: "wtarreau-mi50", confidence: "measured", note: "Модель на 235B параметров запускается на 64 ГБ: возможно только с MoE и агрессивной квантизацией" },
    { model: "Llama 3.3 70B", quant: "Q4_K_S (row-split)", ctx: 4096, backend: "llama.cpp (ROCm)", rig: "3×MI50 32 ГБ (96 ГБ), Xeon, DDR3 RDIMM", tg: 12.58, pp: 58.8, src: "v2ex-mi50", confidence: "measured", note: "Плотная 70B на бюджетном стенде: генерация терпимая, prefill — нет" },
    { model: "Qwen 2.5 72B", quant: "Q4_K_S (layer-split)", ctx: 4096, backend: "llama.cpp (ROCm)", rig: "3×MI50 32 ГБ", tg: 9.85, pp: 75.72, src: "v2ex-mi50", confidence: "measured" },
    { model: "QwQ-32B", quant: "Q4_K_S (row-split)", ctx: 4096, backend: "llama.cpp (ROCm)", rig: "2×MI50 32 ГБ", tg: 20.65, pp: 141.3, src: "v2ex-mi50", confidence: "measured", note: "Более удачный сценарий: 32B помещаются на две карты почти без потерь" },
    { model: "Mistral Nemo 12B", quant: "Q8_0", ctx: 4096, backend: "llama.cpp (ROCm)", rig: "1×MI50 32 ГБ", tg: 35.92, pp: 482.98, src: "v2ex-mi50", confidence: "measured" },
    { model: "Qwen3 32B", quant: "Q4", ctx: 8192, backend: "Ollama", rig: "1×MI50 32 ГБ", tg: 14.57, pp: 1393.9, src: "tencent-m40-mi50", confidence: "measured", note: "Prefill измерен на промпте из 166 токенов — именно на коротких промптах цифра выглядит внушительно" }
  ],
  prices: {
    low: 150, high: 600, updated: "2026-10", currency: "USD",
    volatility: "высокая",
    note: "Разброс в разы: в Китае 32-гигабайтная карта долго стоила ¥900 (около $125), на западных площадках просят $600–830, а реальная сделка — около $200. Полный стенд на трёх MI50 из китайских комплектующих обходится в ¥3140, то есть меньше $500 со всей машиной. Всегда требуйте скриншот llama-bench с карты до оплаты.",
    history: [
      { date: "2024-09", price: 110, label: "пока никто не знал про gfx906" },
      { date: "2025-12", price: 150, label: "бум блогов о MI50" },
      { date: "2026-10", price: 220, label: "текущий ориентир" }
    ]
  },
  limits: [
    "Официальная поддержка ROCm закончилась: пакеты ставят из старых веток или собирают сами",
    "Prefill в 3–5 раз медленнее, чем у NVIDIA того же класса — RAG и длинный контекст ощущаются болезненно",
    "Нет видеовыходов и нет NVLink",
    "Отсутствие Flash Attention в части сборок ограничивает контекст"
  ],
  links: [
    { label: "Блог Willy Tarreau: полные llama-bench", url: "http://wtarreau.blogspot.com/2025/12/amd-radeon-instinct-mi50-32gb-best-ai.html" },
    { label: "Матрица замеров по квантизациям", url: "https://ahelpme.com/ai/llamacpp-ai/llama-bench-the-qwen3-6-27b-and-amd-radeon-instinct-mi50-32gb/" },
    { label: "Официально unsupported: разбор 2026", url: "https://openclawdc.com/blog/amd-mi50-32gb-local-llm/" },
    { label: "Скорборд ROCm в llama.cpp", url: "https://github.com/ggml-org/llama.cpp/discussions/15021" },
    { label: "V2EX: 70B на трёх MI50 за ¥3140 (полные замеры)", url: "https://www.v2ex.com/t/1102193" },
    { label: "腾讯云: MI50 против M40 на одной модели", url: "https://cloud.tencent.com/developer/article/2529249" }
  ]
},

/* -------------------------------------------------------------------- MI25 */
{
  id: "instinct-mi25",
  name: "AMD Instinct MI25",
  short: "16 ГБ HBM2, превращается в WX 9100",
  category: "datacenter",
  arch: "Vega 10 (gfx900)",
  year: 2017,
  formFactor: "PCIe 3.0 x16, 2 слота, пассивная",
  verdict:
    "Тихий швейцарский нож за $100: 16 ГБ HBM2 и 484 ГБ/с. Прошивка BIOS от WX 9100 добавляет видеовыход и обычные драйверы, а правка таблиц PowerPlay поднимает лимиты. Для инференса — середнячок, для «сделать из мусора рабочую карту» — отличный конструктор.",
  bestFor: ["16 ГБ HBM2 за $100", "Роль карты вывода изображения после перепрошивки", "Эксперименты с правкой PowerPlay"],
  risks: [
    "gfx900: ROCm-поддержка закончилась даже раньше, чем у gfx906",
    "Мощность 220–300 Вт и жуткое управление питанием",
    "Перепрошивка BIOS — операция с риском кирпича",
    "Нет матричных ускорителей и тензорных ядер"
  ],
  memory: { stock: 16, mod: null, type: "HBM2", busBits: 2048, bandwidth: 484, ecc: true },
  compute: { cores: 4096, coreLabel: "потоковых процессоров (64 CU)", sms: "64 CU", tensor: "Нет", fp32: 12.3, fp16: 24.6, int8: "—", notes: "Паспортные цифры в 1.5–2 раза выше реальных из-за ограничений драйвера и питания" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: false, videoOutNote: "Появляется после прошивки WX 9100 (Mini-DisplayPort)", nvlink: false, rebar: "—" },
  power: { tdp: 300, tdpNote: "Фактический паспортный лимит — 220 Вт; поднимается до 300+ Вт правкой PowerPlay", connectors: "2×8-pin", cooling: "Пассивная", measuredLoad: "До 400 Вт после снятия лимитов — с этим нужен нормальный БП" },
  software: { cuda: "—", driver: "ROCm 5.x / Mesa (RADV) для Vulkan", backends: ["llama.cpp (Vulkan)", "llama.cpp (ROCm 5.x)", "Ollama (Vulkan)"], os: "Linux", notes: "Проще всего использовать Vulkan-бэкенд: он не зависит от капризов ROCm на gfx900." },
  mods: [
    { toolId: "mi25-flash", title: "Прошивка WX 9100 / Vega 64", result: "Видеовыход, обычные драйверы, управление частотами", soldering: false },
    { toolId: "upp-mi25", title: "upp: PowerPlay 300 Вт + HBM 1100 МГц", result: "5–30% прироста в зависимости от нагрузки", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×MI25", tg: 63, pp: 246, src: "scoreboard-vulkan", confidence: "measured", note: "Строчка в Vulkan-скорборде (данные по Vega-классу)" }
  ],
  prices: { low: 80, high: 170, updated: "2026-10", currency: "USD", volatility: "низкая", note: "Часто продаётся «пачками» по $70–90 за штуку — тогда это самое дешёвое 16 ГБ HBM2 на рынке.", history: [{ date: "2023-01", price: 90, label: "«скрытый зверь» за $100" }, { date: "2026-10", price: 110, label: "текущий ориентир" }] },
  limits: ["gfx900 вне поддержки ROCm", "Питание и охлаждение требуют внимания", "Нет тензорных/матричных блоков"],
  links: [
    { label: "Level1Techs: MI25 как «скрытый зверь»", url: "https://forum.level1techs.com/t/mi25-stable-diffusions-100-hidden-beast/194172" },
    { label: "Разгон MI25/WX 9100 (PowerPlay)", url: "https://krusic22.com/2025/08/09/mi25-overclocking/" }
  ]
},

/* -------------------------------------------------------------------- MI60 */
{
  id: "instinct-mi60",
  name: "AMD Instinct MI60",
  short: "32 ГБ HBM2, PCIe 4.0, 7 нм",
  category: "datacenter",
  arch: "Vega 20 (gfx906), 7 нм",
  year: 2018,
  formFactor: "PCIe 4.0 x16, 2 слота, пассивная",
  verdict:
    "Улучшенная MI50: тот же gfx906, но 7-нм кристалл и выше частоты. Проблемы ровно те же — программные. Если найдёте дешевле MI50 — берите, если дороже, то смысла нет.",
  bestFor: ["То же, что MI50: 32 ГБ HBM2", "Стенды, где важна ПСП на ватт"],
  risks: ["Программная поддержка: gfx906 вне современного ROCm", "Мало отчётов именно по MI60", "Пассивное охлаждение"],
  memory: { stock: 32, mod: null, type: "HBM2", busBits: 4096, bandwidth: 1024, ecc: true },
  compute: { cores: 4096, coreLabel: "потоковых процессоров (64 CU)", sms: "64 CU", tensor: "Нет", fp32: 14.7, fp16: 29.5, int8: "59 TOPS", notes: "" },
  io: { pcieGen: 4, pcieLanes: 16, pcieNote: "PCIe 4.0 и Infinity Fabric Link между картами", videoOut: false, nvlink: false, rebar: "Поддерживается" },
  power: { tdp: 300, connectors: "2×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "—", driver: "ROCm 5.7 / Vulkan", backends: ["llama.cpp (ROCm 5.x / Vulkan)"], os: "Linux", notes: "Как и MI50 — рассчитывайте на ROCm 5.7 или Vulkan." },
  mods: [{ toolId: "mx-llama", title: "mx-llama.cpp", result: "Кернелы под gfx906", soldering: false }],
  benchmarks: [],
  prices: { low: 160, high: 400, updated: "2026-10", currency: "USD", volatility: "высокая", note: "Встречается редко; по смыслу должно стоить столько же, сколько MI50, иначе покупать нечего.", history: [{ date: "2026-10", price: 260, label: "" }] },
  limits: ["См. MI50: программная поддержка — главное ограничение"],
  links: [{ label: "Состояние gfx906 в 2026", url: "https://openclawdc.com/blog/amd-mi50-32gb-local-llm/" }]
},

/* --------------------------------------------------------------- Radeon VII */
{
  id: "radeon-vii",
  name: "AMD Radeon VII",
  short: "16 ГБ HBM2, 1024 ГБ/с, есть видеовыходы",
  category: "consumer",
  arch: "Vega 20 (gfx906)",
  year: 2019,
  formFactor: "PCIe 3.0 x16, 2 слота, активное охлаждение",
  verdict:
    "Тот же gfx906, что у MI50, но с видеовыходами и активным охлаждением — то есть карта, которую можно поставить в обычный корпус и получить 16 ГБ HBM2 с пропускной способностью 1 ТБ/с. Работает как «AMD-ответ» на 2080 Ti 22 ГБ, только памяти меньше, а ПСП выше.",
  bestFor: ["Обычный ПК без серверных извращений: карта вывода + инференс в одном лице", "8–14B с высокой скоростью генерации", "Vulkan-инференс без ROCm-боли"],
  risks: ["16 ГБ", "gfx906 вне современного ROCm (но Vulkan работает отлично)", "Тихий, но греющийся чип: 300 Вт", "Цены выросли из-за общей нехватки VRAM"],
  memory: { stock: 16, mod: null, type: "HBM2", busBits: 4096, bandwidth: 1024, ecc: false },
  compute: { cores: 3840, coreLabel: "потоковых процессоров (60 CU)", sms: "60 CU", tensor: "Нет", fp32: 13.8, fp16: 27.7, int8: "—", notes: "Тот же кристалл, что у MI50/MI60 — производительность почти идентична" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: false, rebar: "—" },
  power: { tdp: 300, connectors: "2×8-pin", cooling: "Активное (турбина) — одна из немногих AMD без колхоза", measuredLoad: "—" },
  software: { cuda: "—", driver: "Mesa/RADV для Vulkan, ROCm 5.x для HIP", backends: ["llama.cpp (Vulkan)", "llama.cpp (ROCm)", "Ollama (Vulkan)"], os: "Linux / Windows", notes: "На Windows Vulkan-бэкенд llama.cpp работает без ROCm вообще." },
  mods: [{ toolId: "mx-llama", title: "mx-llama.cpp", result: "Оптимизации под gfx906", soldering: false }],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×Radeon VII", tg: 55, pp: 400, src: "scoreboard-vulkan", confidence: "estimated", note: "Оценка по gfx906 с ПСП 1024 ГБ/с; прямых замеров именно Radeon VII в открытых скорбордах меньше, чем по MI50" }
  ],
  prices: { low: 200, high: 380, updated: "2026-10", currency: "USD", volatility: "высокая", note: "Карта подорожала вместе с общим дефицитом памяти: 16 ГБ HBM2 с такой ПСП больше не делают.", history: [{ date: "2024-09", price: 250, label: "" }, { date: "2026-10", price: 300, label: "текущий ориентир" }] },
  limits: ["16 ГБ", "Экосистема AMD для LLM беднее: меньше готовых сборок", "300 Вт"],
  links: [{ label: "llama.cpp Vulkan-скорборд", url: "https://github.com/ggml-org/llama.cpp/discussions/10879" }]
},

/* ---------------------------------------------------------------- Vega 64 */
{
  id: "vega-64",
  name: "AMD Radeon RX Vega 56/64",
  short: "8 ГБ HBM2 — минимальный бюджет AMD",
  category: "consumer",
  arch: "Vega 10 (gfx900)",
  year: 2017,
  formFactor: "PCIe 3.0 x16, 2 слота, активное охлаждение",
  verdict:
    "8 ГБ HBM2 с пропускной способностью 484 ГБ/с за $90–150. Для LLM это «тренажёр»: 7–8B в Q4 идёт бодро через Vulkan, всё большее — нет. Берут, когда бюджет совсем смешной и хочется увидеть, как это вообще работает.",
  bestFor: ["7–8B через Vulkan без ROCm", "Самый дешёвый вход в локальный инференс на AMD"],
  risks: ["8 ГБ", "gfx900: только Vulkan или старый ROCm", "Прожорливая и горячая"],
  memory: { stock: 8, mod: null, type: "HBM2", busBits: 2048, bandwidth: 484, ecc: false },
  compute: { cores: 4096, coreLabel: "потоковых процессоров", sms: "64 CU", tensor: "Нет", fp32: 12.7, fp16: 25.3, int8: "—", notes: "" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: false, rebar: "—" },
  power: { tdp: 295, connectors: "2×8-pin", cooling: "Активное", measuredLoad: "—" },
  software: { cuda: "—", driver: "Mesa/RADV", backends: ["llama.cpp (Vulkan)"], os: "Linux / Windows", notes: "Vulkan — самый надёжный путь: ROCm для gfx900 практически мёртв." },
  mods: [],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×Vega 64", tg: 67.7, pp: 585, src: "scoreboard-vulkan", confidence: "measured" }
  ],
  prices: { low: 80, high: 160, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Дешевле только P106-100, но у Vega есть видеовыходы и 484 ГБ/с — это заметная разница для инференса.", history: [{ date: "2026-10", price: 120, label: "" }] },
  limits: ["8 ГБ", "Нет ROCm", "Потребление"],
  links: [{ label: "Vulkan-скорборд llama.cpp", url: "https://github.com/ggml-org/llama.cpp/discussions/10879" }]
},

/* ------------------------------------------------------------------ BC-250 */
{
  id: "bc-250",
  name: "AMD BC-250 (ASRock, ex-mining плата)",
  short: "APU PS5-класса: Zen 2 + 16 ГБ GDDR6 на общей памяти",
  category: "apu",
  arch: "Zen 2 + Cyan Skillfish (GFX1013, «RDNA 1.5»)",
  year: 2023,
  formFactor: "Полноценная плата: CPU, GPU, 16 ГБ памяти, M.2, 8-pin питание",
  verdict:
    "Не карта, а целый миникомпьютер за $100–200: 6-ядерный Zen 2, GPU на 24 CU (40 после патча) и 16 ГБ GDDR6, доступных и процессору, и видеоядер. ROCm на этом чипе не работает, но Vulkan-бэкенд llama.cpp выдаёт 50–70 ток/с на MoE-моделях. Главная беда — память общая: модель, KV-кэш и операционная система живут в одних 16 ГБ.",
  bestFor: [
    "Компактный домашний инференс-узел за минимальные деньги",
    "MoE-модели 25–35B (активных параметров мало, а 16 ГБ хватает на экспертную часть)",
    "Кластеры: два BC-250 по RPC дают 70+ ток/с на Qwen3-30B-A3B"
  ],
  risks: [
    "16 ГБ — общий пул: модель + KV-кэш + ОС. Переполнение — это не «медленно», а жёсткий OOM, вплоть до падения десктопа",
    "ROCm официально не поддерживается (gfx1013 нет в списке AMD): только Vulkan, либо сборка HIP с правкой прошивки MEC",
    "Питание: 220 Вт по паспорту, 240–390 Вт из розетки под нагрузкой, идиотское управление питанием в простое (70–80 Вт)",
    "Модификация BIOS нужна, чтобы получить доступ к памяти — а прошивка это риск кирпича",
    "Нет PCIe-слотов: мульти-GPU только через сеть/RPC"
  ],
  memory: {
    stock: 16, mod: null,
    modNote: "Прошитый BIOS отдаёт память по требованию (dynamic VRAM), GTT расширяется параметром ttm.pages_limit=4194304",
    type: "GDDR6 (on-package, 256-бит)", busBits: 256, bandwidth: 448, ecc: false,
    note: "Память объединённая: 512 МБ выделяется под VRAM, остальное доступно через GTT. Реально «видит» около 16.5 ГиБ после тюнинга"
  },
  compute: {
    cores: 1536, coreLabel: "шейдерных процессоров (24 CU из 40 физических)",
    sms: "24 CU → 40 CU после патча (2560 SP)",
    tensor: "Нет матричных блоков: RDNA1 без матричных инструкций",
    fp32: 4.9, fp16: 9.8, int8: "—",
    notes: "Патч 40 CU даёт +66% вычислительных блоков, но генерация токенов упирается в ПСП, поэтому рост заметен в prefill, а не в decode"
  },
  io: { pcieGen: null, pcieLanes: 0, pcieNote: "PCIe-слотов нет вообще — это самостоятельная плата", videoOut: true, videoOutNote: "Есть вывод изображения, M.2 под NVMe", nvlink: false, rebar: "—" },
  power: {
    tdp: 220,
    tdpNote: "Паспорт платы. Замеры: ~52 Вт среднее и 119 Вт пик по SMU-телеметрии; 240 Вт в простое и 390 Вт под нагрузкой по розетке (для двух плат)",
    connectors: "1×8-pin PCIe",
    cooling: "Штатный кулер платы + корпусный обдув",
    measuredLoad: "130–155 Вт в работе, 35–60 Вт в простое без загруженной модели. Отдельные замеры: 8 ядер на 3.7 ГГц — около 140 Вт, GPU-тест Furmark с 40 CU на 2 ГГц — 290 Вт из розетки"
  },
  software: {
    cuda: "—",
    driver: "amdgpu + RADV (Mesa 25.x), governor oberon",
    backends: ["llama.cpp (Vulkan)", "Ollama (Vulkan)", "llama.cpp (HIP — только с патчами)", "stable-diffusion.cpp"],
    os: "Ubuntu/Fedora, ядро 6.11+ (для VCN и корректной работы GFX1013)",
    notes: "ROCm не работает: rocblas_abort «GFX1013 not in GPU list». Есть отдельный путь: с правкой прошивки MEC, BIOS и пересборкой стека HIP запускают compute, тогда llama.cpp на HIP даёт 709 ток/с на TinyLlama-1.1B (pp512) и 115 ток/с на Llama-3.1-8B (pp512)."
  },
  mods: [
    { toolId: "bc250-bios", title: "Модифицированный BIOS", result: "Динамическое распределение VRAM/GTT, меню чипсета, fan control", soldering: false },
    { toolId: "bc250-40cu", title: "Патч 40 CU", result: "24 CU → 40 CU: prefill на 8B растёт с ~230 до ~371 ток/с", soldering: false },
    { toolId: "mx-llama", title: "Vulkan-оптимизации форка llama.cpp", result: "37 → 55 ток/с на 9B Q4_K; в батче до 175 ток/с суммарно", soldering: false },
    { toolId: "bc250-cu-live-manager", title: "40 CU на лету", result: "Включение всех вычислительных блоков без пересборки модуля и перезагрузки — +61% к prefill", soldering: false },
    { toolId: "bc250-core-unlock", title: "Восемь ядер Zen 2", result: "6 → 8 ядер: +5–7% в чувствительных к CPU задачах, для инференса выигрыш небольшой", soldering: false },
    { toolId: "bc250-governor", title: "Ручное управление частотами", result: "Стабильные 1500 МГц / 900 мВ: 2 ГГц дают больше скорости, но упираются в 96 °C и троттлинг", soldering: false }
  ],
  benchmarks: [
    { model: "Qwen3 30B-A3B (MoE)", quant: "IQ2_M", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×BC-250, 24 CU", tg: 58.3, pp: null, src: "bc250-akandr", confidence: "measured" },
    { model: "Qwen3 30B-A3B (MoE)", quant: "Q2_K", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×BC-250, 24 CU", tg: 41.5, pp: 131.5, src: "bc250-akandr", confidence: "measured", note: "CV 0.35% — замер стабилен" },
    { model: "Qwen3-30B-A3B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (Vulkan), кластер 2 узла RPC", rig: "2×BC-250", tg: 70, pp: null, src: "bc250-llama", confidence: "reported", note: "Сеть между узлами добавляет задержку; авторы называют 70+ ток/с" },
    { model: "Coder 30B-A3B / 9B Q4_K", quant: "разные", ctx: 4096, backend: "llama.cpp (форк с Vulkan-оптимизациями)", rig: "1×BC-250", tg: 55, pp: 306, src: "bc250-llama", confidence: "measured", note: "Базовый апстрим на том же железе — 37 ток/с, то есть форк даёт +48%" },
    { model: "Gemma 4 26B-A4B (MoE)", quant: "Q4", ctx: 24000, backend: "llama.cpp (Vulkan)", rig: "1×BC-250", tg: 69.7, pp: 449.8, src: "bc250-llama", confidence: "measured" },
    { model: "Qwen3.6 35B-A3B (MoE)", quant: "IQ2/Q3", ctx: 32768, backend: "Ollama (Vulkan)", rig: "1×BC-250, 16 ГБ", tg: 38, pp: null, src: "bc250-akandr", confidence: "measured", note: "「Почти потолок памяти» — так это описывает автор" },
    { model: "Qwen2.5-VL 32B (плотная)", quant: "Q4_K_XL", ctx: 16000, backend: "llama.cpp (Vulkan)", rig: "1×BC-250", tg: 8.6, pp: null, src: "reddit-bc250", confidence: "measured", note: "Плотная 32B на 16 ГБ с трудом: 8–10 ток/с" },
    { model: "Gemma 12B", quant: "Q4", ctx: 8192, backend: "Vulkan, 40 CU @ 2050 МГц", rig: "1×BC-250 (разогнан)", tg: 35, pp: null, src: "reddit-bc250", confidence: "reported", note: "Диапазон 30–40 ток/с по сообщению владельца" },
    { model: "Qwen3.5-9B", quant: "Q4_K_XL", ctx: 512, backend: "llama.cpp (Vulkan)", rig: "BC-250: 24 CU против 40 CU", tg: null, pp: 372, src: "duggasco-bc250", confidence: "measured", note: "Prefill: 372 против 230 ток/с на 24 CU (+61%), потребление 95 → 125 Вт, температура +4 °C. На 2 ГГц — 466 ток/с, но 96 °C" },
    { model: "Qwen3.5-35B-A3B (MoE)", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp (Vulkan), 40 CU", rig: "BC-250, 16 ГБ общей памяти", tg: 74.1, pp: null, src: "bc250-akandr", confidence: "measured", note: "На 24 CU та же конфигурация даёт 56.5 ток/с; на 64k контекста падает до 47.8 при 40 CU" }
  ],
  prices: {
    low: 100, high: 250, updated: "2026-10", currency: "USD",
    volatility: "высокая",
    note: "Платы с уже прошитым BIOS и NVMe (128 ГБ) продаются на eBay дороже; «голая» плата — около $100–150. Цена сильно зависит от комплектации.",
    history: [
      { date: "2024-04", price: 60, label: "распродажа майнинговых плат" },
      { date: "2026-02", price: 130, label: "интерес из-за LLM" },
      { date: "2026-10", price: 180, label: "текущий ориентир с BIOS и NVMe" }
    ]
  },
  limits: [
    "16 ГБ на всё: ОС, модель, KV-кэш. Хочется больше — нужен второй узел",
    "Только Vulkan (или HIP с глубокой пересборкой)",
    "Никаких PCIe-слотов: апгрейд GPU невозможен, только кластер",
    "Прошивка BIOS — обязательный и рискованный шаг",
    "Общая память не даёт «16 ГБ VRAM»: честно доступно около 14 ГБ под модель вместе с системой"
  ],
  links: [
    { label: "akandr/bc250: полный дневник и бенчмарки", url: "https://github.com/akandr/bc250" },
    { label: "awesome-bc250: раздел про AI/LLM", url: "https://github.com/kalpakprod/awesome-bc250/blob/main/docs/en/12-ai-llm.md" },
    { label: "Патч 40 CU", url: "https://github.com/duggasco/bc250-40cu-unlock" },
    { label: "llama.cpp для BC-250 (Vulkan-оптимизации)", url: "https://github.com/TechMakesArt/llama.cpp-bc250" },
    { label: "Модифицированный BIOS", url: "https://gitlab.com/TuxThePenguin0/bc250-bios" },
    { label: "Практика: ток/с, BIOS, VRAM", url: "https://www.reddit.com/r/LocalLLaMA/comments/1mqjdmn/did_anyone_tried_to_use_amd_bc250_for_inference/" },
    { label: "duggasco: разблокировка 40 CU на уровне регистров + whitepaper", url: "https://github.com/duggasco/bc250-40cu-unlock" },
    { label: "Неофициальный гайд сообщества (BIOS, CU, ядра, охлаждение)", url: "https://github.com/katzzero/bc250-unofficial-community-guide" },
    { label: "bc250-llm-setup: скрипты для LLM-стенда", url: "https://github.com/wdonega/bc250-llm-setup" },
    { label: "快科技: 40 CU и игровые тесты The Phawx", url: "https://news.mydrivers.com/1/1136/1136475.htm" },
    { label: "Кластер из трёх BC-250 на Ansible", url: "https://ciroluciotecce.it/en/posts/bc250-cluster-inferenza-locale/" }
  ]
}

);
