/* =========================================================================
   NVIDIA — серверные (Tesla) карты. Классика «много VRAM за мало денег».
   ========================================================================= */
window.BLDL = window.BLDL || {};
BLDL.gpus = BLDL.gpus || [];

BLDL.gpus.push(

/* ---------------------------------------------------------------------- P4 */
{
  id: "tesla-p4",
  name: "NVIDIA Tesla P4",
  short: "8 ГБ, 75 Вт, половинная высота",
  category: "datacenter",
  arch: "Pascal, GP104",
  year: 2016,
  formFactor: "PCIe half-height, 1 слот, пассивная",
  verdict:
    "Идеальный «инференс-сайдкар»: питается от слота (75 Вт), влезает в любой корпус, заводится без патчей. 8 ГБ и 192 ГБ/с — это уверенная 7B в Q4 и ничего больше, но по ваттам на токен карта до сих пор в лидерах.",
  bestFor: ["Постоянный инференс 3–8B на минимальном питании", "Малые корпуса и узлы, где нет 8-pin", "Второй GPU для логики, эмбеддингов, STT"],
  risks: ["8 ГБ", "192 ГБ/с — низкая скорость генерации на моделях больше 8B", "Нет тензорных ядер", "Внезапно упирается в свои 75 Вт под нагрузкой"],
  memory: { stock: 8, mod: null, type: "GDDR5", busBits: 256, bandwidth: 192, ecc: true },
  compute: { cores: 2560, coreLabel: "CUDA-ядер", sms: "20 SM", tensor: "Нет", fp32: 5.5, fp16: 0.11, int8: "22 TOPS (через DP4A)", notes: "INT8-путь — единственное, где карта выглядит современно" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 75, connectors: "Нет — питание из слота", cooling: "Пассивная; в тесном корпусе нужен обдув", measuredLoad: "75 Вт под нагрузкой, мгновенно; блок питания не должен быть хлипким" },
  software: { cuda: "sm_61, CUDA 12.x", driver: "580.x — последняя ветка для Pascal", backends: ["llama.cpp (CUDA)", "Ollama", "Vulkan"], os: "Linux / Windows", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA, FA on)", rig: "1×P4", tg: 33.3, pp: 529.5, src: "scoreboard-cuda", confidence: "measured" },
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA, FA off)", rig: "1×P4", tg: 33.1, pp: 514.5, src: "scoreboard-cuda", confidence: "measured" },
    { model: "Llama 3.2 3B", quant: "Q4", ctx: 4096, backend: "Ollama", rig: "1×P4 (сравнение с 4×P40)", tg: 34.8, pp: null, src: "tinycomputers", confidence: "estimated", note: "Пропорциональная оценка по 4×P40 (94.3 ток/с на 4 картах) — прямого замера на одиночной P4 нет" }
  ],
  prices: { low: 130, high: 240, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Цена сильно разнится: $171 на eBay против $240 в рознице. Для карты 2016 года это дорого, но альтернатив с 75 Вт нет.", history: [{ date: "2024-10", price: 130, label: "" }, { date: "2026-10", price: 185, label: "текущий ориентир" }] },
  limits: ["8 ГБ", "Нет FP16 и тензорных ядер", "Пассивное охлаждение в плоском корпусе перегревается"],
  links: [
    { label: "Обсуждение в r/homelab", url: "https://www.reddit.com/r/homelab/comments/1t3h53a/llm_people_how_do_we_feel_about_nvidia_tesla_p4_8gb/" },
    { label: "llama.cpp CUDA-скорборд", url: "https://github.com/ggml-org/llama.cpp/discussions/15013" }
  ]
},

/* --------------------------------------------------------------------- P40 */
{
  id: "tesla-p40",
  name: "NVIDIA Tesla P40",
  short: "24 ГБ за цену карты попроще",
  category: "datacenter",
  arch: "Pascal, GP102",
  year: 2016,
  formFactor: "PCIe, 2 слота, пассивная",
  verdict:
    "Народный 24-гигабайтник. Не быстрый (346 ГБ/с), не молодой (нет тензорных ядер и FP16), но даёт 24 ГБ VRAM за $150–250 и отлично работает с GGUF: 8B в Q4/Q5 — 28–35 ток/с, MoE-модели вроде gpt-oss-120b — 28 ток/с на четырёх картах. Плотные 70B бессмысленны, MoE — вполне.",
  bestFor: [
    "Максимум VRAM на минимум денег",
    "MoE-модели (активация малой части параметров маскирует слабую ПСП)",
    "Многокарточные X99-стенды: 3–4 карты = 72–96 ГБ"
  ],
  risks: [
    "Нет FP16 и тензорных ядер: EXL2 и любые FP16-пути мимо, только GGUF",
    "Prefill медленный (~590 ток/с на 11B Q4) — длинные контексты ощущаются как долгое ожидание первого токена",
    "250 Вт и пассивное охлаждение: без шрауда и турбины карта перегревается",
    "Плотные 70B на четырёх P40 дают 0.03 ток/с — это не «медленно», это нерабочее"
  ],
  memory: { stock: 24, mod: null, type: "GDDR5", busBits: 384, bandwidth: 346, ecc: true },
  compute: { cores: 3840, coreLabel: "CUDA-ядер", sms: "30 SM", tensor: "Нет", fp32: 11.76, fp16: 0.183, int8: "47 TOPS (DP4A)", notes: "FP16 практически отсутствует — следствие того, что NVIDIA срезала half-rate путь у GP102" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "Разделение по слоям (layer split) на x4/x8 почти не бьёт по скорости; tensor parallel — бьёт", videoOut: false, nvlink: false, rebar: "Часть сборок требует Above 4G Decoding для нескольких P40", },
  power: { tdp: 250, connectors: "1×8-pin (EPS в серверах)", cooling: "Пассивная: шрауд + 80-мм турбина — стандарт", measuredLoad: "50 Вт с загруженной моделью в простое, 100–160 Вт в инференсе, до 227 Вт в пике (замеры LM Studio)" },
  software: {
    cuda: "sm_61, CUDA 12.x (последняя ветка)",
    driver: "580.x — последняя ветка с поддержкой Pascal. Обновляться дальше нельзя, но и не нужно",
    backends: ["llama.cpp (CUDA)", "Ollama", "llamafile", "Vulkan"],
    os: "Linux заметно проще; в Windows карта тоже живёт, но с танцами вокруг драйверов",
    notes: "vLLM требует сборки с поддержкой sm_61 — смысла мало. Flash Attention недоступен."
  },
  mods: [
    { toolId: "ollama-legacy", title: "Ollama под legacy GPU", result: "Современные модели через форк", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA, FA on)", rig: "1×P40", tg: 53.7, pp: 1079.7, src: "scoreboard-cuda", confidence: "measured" },
    { model: "Bielik 11B", quant: "Q4_K_M", ctx: 512, backend: "llama.cpp (llama-bench)", rig: "1×P40 24 ГБ", tg: 28.5, pp: 593.6, src: "medium-pl", confidence: "measured" },
    { model: "PLLuM 12B", quant: "Q4_K_M", ctx: 512, backend: "llama.cpp", rig: "1×P40", tg: 27.1, pp: 612.2, src: "medium-pl", confidence: "measured", note: "Prefill в ~3 раза медленнее V100 — главный практический минус" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "Ollama", rig: "4×P40 (96 ГБ)", tg: 47.8, pp: null, src: "tinycomputers", confidence: "measured", note: "Масштабирование на 4 карты: 47.8 ток/с против 35.7 у одной T4" },
    { model: "Qwen 2.5 7B", quant: "Q4", ctx: 4096, backend: "Ollama", rig: "4×P40", tg: 52.7, pp: null, src: "tinycomputers", confidence: "measured" },
    { model: "gpt-oss 120B (MoE)", quant: "MXFP4", ctx: 8192, backend: "Ollama", rig: "3–4×P40", tg: 28.1, pp: null, src: "tinycomputers", confidence: "measured", note: "MoE на Pascal — рабочий сценарий: активных параметров мало, ПСП перестаёт быть приговором" },
    { model: "Qwen3.5 35B MoE", quant: "Q4_K_M", ctx: 32768, backend: "llama.cpp", rig: "2×P40 на X99", tg: 35, pp: 250, src: "reddit-p40-p100", confidence: "reported", note: "Prefill падает до ~120 ток/с на 80k контекста" },
    { model: "Mixtral 8x7B", quant: "Q6_K", ctx: 8192, backend: "llama.cpp", rig: "2×P40", tg: 20, pp: null, src: "reddit-p40-guide", confidence: "reported" },
    { model: "Llama 3.1 70B (плотная)", quant: "Q4_0 (39 ГБ)", ctx: 4096, backend: "Ollama", rig: "4×P40 (96 ГБ)", tg: 0.033, pp: null, src: "tinycomputers", confidence: "measured", note: "1 токен за 30 секунд. Это эталон «так делать не надо»" },
    { model: "Yi 34B", quant: "Q4_K_M", ctx: 14000, backend: "llama.cpp", rig: "1×P40", tg: 2.5, pp: null, src: "reddit-p40-p100", confidence: "reported" }
  ],
  prices: {
    low: 150, high: 260, updated: "2026-10", currency: "USD", volatility: "средняя",
    note: "Исторически была $160–200, в 2026 году подросла: спрос на дешёвую VRAM стабилен. Цена включает необходимость купить охлаждение (+$15–30).",
    history: [
      { date: "2023-11", price: 175, label: "пик популярности" },
      { date: "2025-03", price: 200, label: "" },
      { date: "2026-10", price: 210, label: "текущий ориентир" }
    ]
  },
  limits: [
    "Pascal без FP16: любые FP16-ориентированные движки (vLLM в стандартной сборке, exllamav2) не дают выигрыша",
    "Flash Attention нет → длинный контекст дорогой",
    "Драйвер 580 — последний: новых фич не будет, только безопасность",
    "Пассивное охлаждение обязательно требует доработки корпуса"
  ],
  links: [
    { label: "Канонический тред по P40 (X99, 3 карты)", url: "https://www.reddit.com/r/LocalLLaMA/comments/17zpr2o/nvidia_tesla_p40_performs_amazingly_well_for/" },
    { label: "Замеры P40/P100/V100 (prefill vs generation)", url: "https://medium.com/@przemyslaw.rafal.jez/we-benchmarked-polish-llms-on-used-p40-p100-and-v100-gpus-15870eb343bd" },
    { label: "4×P40 под Ollama: полный разбор", url: "https://tinycomputers.io/posts/repurposing-enterprise-gpus-the-tesla-p40-home-lab-story.html" },
    { label: "Русскоязычные тесты в LM Studio", url: "https://serverflow.ru/blog/stati/testiruem-tesla-p40-v-lm-studio-neyroseti-i-llm-na-windows/" },
    { label: "P40 vs P100: почему FP16 у P40 срезан", url: "https://www.reddit.com/r/LocalLLaMA/comments/191yd31/p40_vs_p100_for_llms/" }
  ]
},

/* -------------------------------------------------------------------- P100 */
{
  id: "tesla-p100",
  name: "NVIDIA Tesla P100",
  short: "16 ГБ HBM2, 732 ГБ/с, полноценный FP16",
  category: "datacenter",
  arch: "Pascal, GP100",
  year: 2016,
  formFactor: "PCIe, 2 слота, пассивная (есть SXM2-версия)",
  verdict:
    "Ключевое отличие от P40 — HBM2 и честный FP16-путь (19 Тфлопс). За счёт этого P100 тянет EXL2 и обгоняет P40 там, где работает полуточность, но проигрывает по объёму: 16 против 24 ГБ. На 2026 год — карта «или/или»: скорость или объём.",
  bestFor: ["EXL2-инференс 8–14B", "Задачи, где важна ПСП (732 ГБ/с) при умеренном объёме", "Мультимодальные пайплайны на FP16"],
  risks: [
    "16 ГБ против 24 у P40 — модели 27B+ уже не влезают в один слот комфортно",
    "В GGUF-путях ничем не обгоняет P40 (27 ток/с против 28 на 11B Q4)",
    "Драйверная поддержка закрыта вместе с Pascal"
  ],
  memory: { stock: 16, mod: null, type: "HBM2", busBits: 4096, bandwidth: 732, ecc: true },
  compute: { cores: 3584, coreLabel: "CUDA-ядер", sms: "56 SM", tensor: "Нет (но есть полноценный FP16: 19.05 Тфлопс против 0.18 у P40)", fp32: 9.5, fp16: 19.05, int8: "—", notes: "FP16 в 2 раза медленнее FP32 — это «половинчатый» HPC-путь, но для EXL2 этого хватает" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "Есть NVLink у SXM2-версии (2 линии)", videoOut: false, nvlink: true, rebar: "—" },
  power: { tdp: 250, connectors: "1×8-pin (EPS)", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "sm_60, CUDA 12.x", driver: "580.x", backends: ["llama.cpp (CUDA)", "exllamav2", "Ollama", "Vulkan"], os: "Linux / Windows", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA)", rig: "1×P100 16 ГБ", tg: 58.4, pp: 760.8, src: "scoreboard-cuda", confidence: "measured" },
    { model: "Llama 3.1 8B", quant: "EXL2 4.0bpw", ctx: 8192, backend: "exllamav2", rig: "1×P100", tg: 29.6, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "Лучший результат карты в этом тесте: FP16-путь работает" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M (GGUF)", ctx: 8192, backend: "llama.cpp", rig: "1×P100", tg: 21.5, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "В GGUF P100 проигрывает P102-100 за $40 — унизительно, но факт" },
    { model: "Bielik 11B", quant: "Q4_K_M", ctx: 512, backend: "llama.cpp (llama-bench)", rig: "1×P100", tg: 27.2, pp: 419, src: "medium-pl", confidence: "measured", note: "Prefill ниже, чем у P40 — HBM2 здесь не помогает" },
    { model: "LLaMA 3.2 11B (vision)", quant: "4-bit", ctx: 4096, backend: "transformers + bitsandbytes", rig: "1×P100 vs 1×P40", tg: null, pp: null, src: "habr-p40-p100", confidence: "measured", note: "P100 оказалась в 3.6–4.7 раза быстрее P40 на мультимодальной нагрузке FP16" }
  ],
  prices: { low: 90, high: 190, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Часто дешевле P40 — и по GB/$ это лучшая покупка для 14B-класса.", history: [{ date: "2024-09", price: 150, label: "" }, { date: "2026-10", price: 130, label: "текущий ориентир" }] },
  limits: ["16 ГБ — потолок для одной модели", "В GGUF-сценариях нет преимущества перед P40/дешёвыми Pascal", "Нет тензорных ядер и Flash Attention"],
  links: [
    { label: "P40 vs P100: разбор FP16", url: "https://www.reddit.com/r/LocalLLaMA/comments/191yd31/p40_vs_p100_for_llms/" },
    { label: "Сравнение дешёвых GPU", url: "https://www.reddit.com/r/LocalLLaMA/comments/1f6hjwf/battle_of_the_cheap_gpus_lllama_31_8b_gguf_vs/" },
    { label: "Русскоязычный тест мультимодальных моделей", url: "https://habr.com/ru/companies/serverflow/articles/851712/" }
  ]
},

/* --------------------------------------------------------------------- M10 */
{
  id: "tesla-m10",
  name: "NVIDIA Tesla M10",
  short: "4 GPU по 8 ГБ на одной плате",
  category: "datacenter",
  arch: "Maxwell, 4× GM107",
  year: 2016,
  formFactor: "PCIe, 2 слота, пассивная",
  verdict:
    "Экзотика, которая внезапно снова работает: 4 отдельных GPU по 8 ГБ (32 ГБ суммарно), драйвер 580 их ещё поддерживает, а движок colibri умудряется держать в них все эксперты MoE-модели. Скорость генерации — вопрос к другому железу. Цена — $25–40.",
  bestFor: ["MoE-модели на архитектуре, где эксперты должны лежать в VRAM", "Эксперименты и учебные стенды за минимальные деньги", "Хостинг нескольких мелких моделей одновременно (каждый GPU — свой)"],
  risks: [
    "Каждый GPU — это 8 ГБ, модель 14B+ в один чип не влезет, нужна раскладка по четырём (медленно)",
    "Maxwell sm_50: CUDA 12 не поддерживает, нужен тулчейн 11.8 и своя сборка",
    "Нет тензорных ядер, нет FP16-выигрыша, Flash Attention невозможен",
    "Общая производительность низкая: 7.3 ток/с на MoE 35B в llama.cpp; собственный движок colibri дал 2.45 ток/с — то есть запускается, но не «летит»"
  ],
  memory: { stock: 32, mod: null, modNote: "4 × 8 ГБ, отдельные устройства — не единый пул", type: "GDDR5", busBits: "4 × 128", bandwidth: 83, bandwidthNote: "83 ГБ/с на каждый чип (суммарно 332 ГБ/с, но использовать их как один поток нельзя)", ecc: true },
  compute: { cores: 2560, coreLabel: "CUDA-ядер всего (640 на чип)", sms: "4 × 5 SM", tensor: "Нет", fp32: 1.9, fp16: "—", int8: "—", notes: "Суммарно ~7.6 Тфлопса FP32 на всю плату — уровень одной GTX 1050 Ti, но зато с 32 ГБ" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "На четыре чипа — по сути x4 каждому", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 225, connectors: "1×8-pin (EPS)", cooling: "Пассивная, требует серьёзного обдува", measuredLoad: "—" },
  software: { cuda: "sm_50, CUDA 11.8 (последняя ветка для Maxwell)", driver: "580.x", backends: ["llama.cpp (сборка под sm_50)", "colibri (CUDA)", "ollama-legacy"], os: "Linux", notes: "KEY: апстрим-бинарники просто не увидят карту — нужна сборка с CUDA_ARCH=sm_50" },
  mods: [
    { toolId: "colibri", title: "colibri: MoE-движок", result: "Все 10 240 экспертов Qwen3.6-35B-A3B в VRAM (32 ГБ), 2.45 ток/с", soldering: false },
    { toolId: "ollama-legacy", title: "Ollama legacy GPU", result: "Современный стек на Maxwell", soldering: false }
  ],
  benchmarks: [
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "UD-IQ3_XXS", ctx: 32768, backend: "llama.cpp (-ngl 99 -ts 1,1,1,1)", rig: "4×Tesla M10 (32 ГБ) + 2×Xeon E5-2640", tg: 7.3, pp: null, src: "colibri-1652", confidence: "measured", note: "Узкое место — процессор без AVX2, а не GPU" },
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "int4 gs=64 (colibri)", ctx: 4096, backend: "colibri CUDA", rig: "4×M10, 2-й CPU", tg: 2.45, pp: null, src: "colibri-1652", confidence: "measured", note: "100% попаданий в VRAM по экспертам, но плотный «ствол» остаётся на CPU" }
  ],
  prices: { low: 25, high: 60, updated: "2026-10", currency: "USD", volatility: "низкая", note: "Одна из самых дешёвых «пачек VRAM» на рынке. Продаётся как лот «M10 4×8 ГБ».", history: [{ date: "2026-10", price: 40, label: "" }] },
  limits: ["32 ГБ — сумма четырёх независимых 8-ГБ пулов", "Maxwell вне современного CUDA", "Скорость: десятки токенов только на маленьких моделях"],
  links: [
    { label: "Датапоинт colibri #1652 (полный разбор)", url: "https://github.com/JustVugg/colibri/issues/1652" },
    { label: "ollama-legacy-gpu (отчёты по M10)", url: "https://github.com/h3rb3rn/ollama-legacy-gpu" }
  ]
},

/* --------------------------------------------------------------------- M40 */
{
  id: "tesla-m40",
  name: "NVIDIA Tesla M40",
  short: "24 ГБ (и 12 ГБ) Maxwell",
  category: "datacenter",
  arch: "Maxwell, GM200",
  year: 2015,
  formFactor: "PCIe, 2 слота, пассивная",
  verdict:
    "До P40 был народным 24-гигабайтником: 24 ГБ, 288 ГБ/с, 250 Вт. Сегодня проигрывает P40 решительно во всём, кроме цены, а отсутствие FP16 и INT8-инструкций (DP4A) делает карту ещё медленнее в GGUF. Если разница в цене с P40 меньше $40 — берите P40.",
  bestFor: ["Совсем минимальный бюджет на 24 ГБ", "Модели 7–14B в Q4 c запасом"],
  risks: ["Maxwell: нет DP4A, значит GGUF-путь медленнее, чем на Pascal", "Много брака среди б/у (карта старая)", "Пассивное охлаждение"],
  memory: { stock: 24, mod: null, modNote: "Есть ревизии на 12 ГБ — уточняйте у продавца", type: "GDDR5", busBits: 384, bandwidth: 288, ecc: true },
  compute: { cores: 3072, coreLabel: "CUDA-ядер", sms: "24 SM", tensor: "Нет", fp32: 7.0, fp16: "—", int8: "—", notes: "Нет DP4A — квантованные модели считаются медленнее относительно паспорта" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 250, connectors: "1×8-pin (EPS)", cooling: "Пассивная", measuredLoad: "30–50 Вт с загруженной моделью, до ~150 Вт в работе" },
  software: { cuda: "sm_52, CUDA 11.8/12.x", driver: "580.x", backends: ["llama.cpp (CUDA)", "Ollama", "Vulkan"], os: "Linux", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (GGUF)", rig: "1×M40 24 ГБ", tg: 10, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "Один из худших результатов в тесте дешёвых карт" },
    { model: "Llama 2 13B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp", rig: "1×M40", tg: 8, pp: null, src: "reddit-battle-cheap", confidence: "reported" }
  ],
  prices: { low: 60, high: 130, updated: "2026-10", currency: "USD", volatility: "низкая", note: "Встречается и по $229 «с гарантией» — это переплата вдвое.", history: [{ date: "2026-10", price: 90, label: "" }] },
  limits: ["Maxwell без DP4A: GGUF-производительность разочаровывает", "Драйвер и CUDA на грани отключения поддержки", "Иногда попадаются карты с деградировавшей памятью"],
  links: [{ label: "Сравнение дешёвых GPU (M40 в списке)", url: "https://www.reddit.com/r/LocalLLaMA/comments/1f6hjwf/battle_of_the_cheap_gpus_lllama_31_8b_gguf_vs/" }]
},

/* --------------------------------------------------------------------- T4 */
{
  id: "tesla-t4",
  name: "NVIDIA Tesla T4",
  short: "16 ГБ, 70 Вт, тензорные ядра — самый эффективный в классе",
  category: "datacenter",
  arch: "Turing, TU104",
  year: 2018,
  formFactor: "PCIe half-height, 1 слот, пассивная",
  verdict:
    "Самая «цивилизованная» старая Tesla: 70 Вт, 16 ГБ GDDR6, тензорные ядра, FP16 и INT8. По эффективности (токен/ватт) обыгрывает почти всё в этой базе. Минус один — цена: за неё просят как за две P40.",
  bestFor: ["Долгие и тихие инференс-сервера", "FP16-нагрузки и мультимодальные модели", "Малые корпуса без дополнительного питания"],
  risks: ["16 ГБ", "320 ГБ/с — невысокая ПСП для больших моделей", "Цена: $300+ против $200 у P40"],
  memory: { stock: 16, mod: null, type: "GDDR6", busBits: 256, bandwidth: 320, ecc: true },
  compute: { cores: 2560, coreLabel: "CUDA-ядер", sms: "40 SM", tensor: "320 тензорных ядер 2-го поколения (работают)", fp32: 8.1, fp16: 65, int8: "130 TOPS", notes: "FP16 с тензорными ядрами — в 8 раз быстрее FP32; это главный аргумент карты" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 70, connectors: "Нет — из слота", cooling: "Пассивная, но греется меньше P4", measuredLoad: "70 Вт" },
  software: { cuda: "sm_75, CUDA 12.x", driver: "580.x (Turing поддерживается и дальше — ветка 590+)", backends: ["llama.cpp (CUDA)", "Ollama", "vLLM (Turing ещё в поддержке)"], os: "Linux / Windows", notes: "Единственная карта базы, где vLLM имеет смысл без сборки из исходников" },
  mods: [],
  benchmarks: [
    { model: "Llama 3.2 3B", quant: "Q4", ctx: 4096, backend: "Ollama", rig: "1×T4", tg: 81.5, pp: null, src: "tinycomputers", confidence: "measured" },
    { model: "Qwen 2.5 7B", quant: "Q4", ctx: 4096, backend: "Ollama", rig: "1×T4", tg: 36.9, pp: null, src: "tinycomputers", confidence: "measured" },
    { model: "Llama 3.1 8B", quant: "Q4", ctx: 4096, backend: "Ollama", rig: "4×T4", tg: 29.2, pp: null, src: "tinycomputers", confidence: "measured", note: "4 карты медленнее одной: Ollama шардирует модель и теряет на PCIe" }
  ],
  prices: { low: 280, high: 550, updated: "2026-10", currency: "USD", volatility: "средняя", note: "Самый дорогой в базе из расчёта на гигабайт, но и самый экономичный по питанию.", history: [{ date: "2026-10", price: 380, label: "" }] },
  limits: ["16 ГБ", "Цена за гигабайт — худшая в базе", "320 ГБ/с ограничивают генерацию на моделях 14B+"],
  links: [{ label: "4×P40 против T4: сравнение", url: "https://tinycomputers.io/posts/repurposing-enterprise-gpus-the-tesla-p40-home-lab-story.html" }]
},

/* --------------------------------------------------------- V100 (16 ГБ, SXM2) */
{
  id: "tesla-v100-16",
  name: "Tesla V100 16 ГБ (PCIe / SXM2 + адаптер)",
  short: "900 ГБ/с HBM2, тензорные ядра, от $150",
  category: "datacenter",
  arch: "Volta, GV100",
  year: 2017,
  formFactor: "PCIe или SXM2-модуль на переходнике",
  verdict:
    "Лучший баланс «скорость за деньги» среди старых Tesla: 900 ГБ/с HBM2, рабочие тензорные ядра, FP16. Даёт 77 ток/с на 11B Q4 и prefill в 3 раза быстрее P40. Главный подвох — свежие сборки Ollama/llama.cpp ломают поддержку Volta, придётся собирать вручную.",
  bestFor: [
    "Интерактивный чат: 8–14B с быстрым ответом и быстрым prefill",
    "Длинные контексты и RAG — prefill в 3–5 раз быстрее Pascal",
    "SXM2-модули с китайским адаптером: ~$200 за полный комплект"
  ],
  risks: [
    "Ollama 0.30+ перестал поддерживать V100 — нужен свой билд или форк",
    "SXM2-модуль не имеет ни охлаждения, ни корпуса: нужно печатать шрауд и ставить вентилятор",
    "16 ГБ на карту: 27B в Q4 требует уже двух карт",
    "Нельзя использовать как основную видеокарту — нет видеовыходов"
  ],
  memory: { stock: 16, mod: null, modNote: "Существует версия на 32 ГБ (в основном SXM2)", type: "HBM2", busBits: 4096, bandwidth: 900, ecc: true },
  compute: { cores: 5120, coreLabel: "CUDA-ядер", sms: "80 SM", tensor: "640 тензорных ядер 1-го поколения — работают полноценно", fp32: 15.7, fp16: 31.4, int8: "—", notes: "По «железной» производительности — потолок среди Pascal/Volta в базе. FP16 — полноценный, в отличие от P40" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "SXM2-версия имеет NVLink между модулями (на адаптерах обычно не разведён)", videoOut: false, nvlink: true, rebar: "—" },
  power: { tdp: 250, tdpNote: "SXM2 — 300 Вт", connectors: "2×8-pin (PCIe) / 3×8-pin (адаптер SXM2)", cooling: "Пассивная; для SXM2 обязателен самодельный шрауд + 80-мм вентилятор", measuredLoad: "Под нагрузкой держит 250–300 Вт и греется соответственно" },
  software: {
    cuda: "sm_70, CUDA 12.x (последняя ветка)",
    driver: "580.x — последняя ветка. Open-модули 610.x для разблокировки CMP — отдельная история, к V100 не относятся",
    backends: ["llama.cpp (CUDA)", "exllamav2", "vLLM (сборка под sm_70)"],
    os: "Linux настоятельно рекомендуется",
    notes: "Проверяйте версию Ollama: после 0.30 карта может просто не определиться."
  },
  mods: [
    { toolId: "v100-sxm2-adapter", title: "Адаптер SXM2 → PCIe", result: "Серверный модуль работает в обычном слоте", soldering: false },
    { toolId: "ollama-legacy", title: "Ollama под legacy GPU", result: "Обход поломки поддержки Volta в свежих сборках", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA)", rig: "1×V100", tg: 129.6, pp: 1391.4, src: "scoreboard-cuda", confidence: "measured" },
    { model: "Bielik 11B", quant: "Q4_K_M", ctx: 512, backend: "llama.cpp (llama-bench)", rig: "1×V100 16 ГБ", tg: 77.7, pp: 1963, src: "medium-pl", confidence: "measured", note: "Prefill в 3.3 раза быстрее P40 при той же модели" },
    { model: "Bielik 11B", quant: "Q5_K_M", ctx: 512, backend: "llama.cpp", rig: "1×V100", tg: 70, pp: 1986.1, src: "medium-pl", confidence: "measured" },
    { model: "Qwen3.6-27B (MTP, 131k ctx)", quant: "—", ctx: 131072, backend: "llama.cpp", rig: "2×V100 16 ГБ (32 ГБ)", tg: 51.6, pp: null, src: "roksblog-v100", confidence: "measured", note: "Для сравнения: RTX 4090 в том же тесте — 89.8 ток/с" },
    { model: "gpt-oss 20B", quant: "MXFP4", ctx: 32768, backend: "llama.cpp / Ollama (свой билд)", rig: "1×V100 16 ГБ", tg: 130, pp: null, src: "runaihome-v100", confidence: "measured", note: "Требуется сборка вручную: свежие сборки Ollama карту не видят" }
  ],
  prices: {
    low: 150, high: 280, updated: "2026-10", currency: "USD",
    volatility: "высокая",
    note: "Разброс огромный из-за двух форматов: PCIe-карта дороже, модуль SXM2 + адаптер — от $150–270 за комплект. Часть продавцов торгует «котами в мешке» без проверки модулей.",
    history: [
      { date: "2024-09", price: 250, label: "PCIe-версия" },
      { date: "2026-05", price: 200, label: "SXM2 + адаптер" },
      { date: "2026-10", price: 220, label: "текущий ориентир" }
    ]
  },
  limits: [
    "16 ГБ на карту — 27B/32B требуют двух карт, а NVLink на адаптерах обычно недоступен",
    "Свежие фреймворки: поддержка Volta ломается, нужен ручной контроль версий",
    "Пассивное охлаждение SXM2-модуля — обязательная самоделка",
    "Нет видеовыходов"
  ],
  links: [
    { label: "SXM2 + адаптер: смета и результат", url: "https://runaihome.com/blog/modded-tesla-v100-budget-ai-gpu-2026/" },
    { label: "2×V100 против 4090 на 27B/131k", url: "https://www.roksblog.de/can-two-old-tesla-v100s-beat-an-rtx-4090-for-a-fully-local-hermes-agent/" },
    { label: "Замеры P40/P100/V100", url: "https://medium.com/@przemyslaw.rafal.jez/we-benchmarked-polish-llms-on-used-p40-p100-and-v100-gpus-15870eb343bd" },
    { label: "VideoCardz: проверка сценария", url: "https://videocardz.com/newz/200-nvidia-v100-server-gpu-mod-beats-rtx-3060-in-local-llm-test" }
  ]
},

/* --------------------------------------------------------------------- K80 */
{
  id: "tesla-k80",
  name: "NVIDIA Tesla K80",
  short: "24 ГБ (2×12), Kepler — «не берите, если не исследователь»",
  category: "datacenter",
  arch: "Kepler, 2× GK210",
  year: 2014,
  formFactor: "PCIe, 2 слота, пассивная",
  verdict:
    "Честный вердикт для большинства: не покупать. 24 ГБ — это два независимых чипа по 12 ГБ, Kepler не поддерживается современным CUDA, Flash Attention невозможен. Но именно поэтому есть люди, которым интересно: в отчёте 2026 года K80 выдаёт 6.3 ток/с на плотной 27B и 13.5 ток/с на MoE 35B при 64k контекста — то есть запускается и даже работает.",
  bestFor: ["Исследование границ «насколько старым может быть железо»", "Учебные лаборатории, где важнее процесс, чем скорость", "Коллекционерам эпохи Kepler"],
  risks: [
    "Dual-GPU: 12 ГБ на чип, а не 24 ГБ единым пулом",
    "Kepler sm_37: последний тулкит — CUDA 11.x",
    "Много ручной сборки: llama.cpp надо собирать отдельно, Ollama — форк",
    "Скорость около 4–6 ток/с на плотных моделях 7–14B — сопоставимо с CPU-инференсом"
  ],
  memory: { stock: 24, mod: null, modNote: "2 × 12 ГБ, раздельные устройства", type: "GDDR5", busBits: "2 × 384", bandwidth: 240, bandwidthNote: "240 ГБ/с на чип; около 22.8 ГБ полезно при включённом ECC", ecc: true },
  compute: { cores: 4992, coreLabel: "CUDA-ядер (2× 2496)", sms: "2 × 13 SM", tensor: "Нет", fp32: 8.7, fp16: "—", int8: "—", notes: "Нет FP16-инструкций в современном понимании — всё считается через FP32" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 300, connectors: "1×8-pin (EPS)", cooling: "Пассивная", measuredLoad: "Реальное потребление под инференсом — заметно ниже 300 Вт, карта почти не греется" },
  software: { cuda: "sm_37, CUDA 11.8 — предел", driver: "470.x — последняя ветка для Kepler", backends: ["llama.cpp (сборка под sm_37)", "ollama37 (форк)"], os: "Linux", notes: "Апстрим-сборки карту не увидят; нужна своя компиляция и терпение" },
  mods: [{ toolId: "ollama-legacy", title: "Форки и сборки под Kepler", result: "Карта вообще начинает определяться современным стеком", soldering: false }],
  benchmarks: [
    { model: "Qwen3.6-27B (плотная)", quant: "Q4_0, parallel split", ctx: 4096, backend: "llama.cpp (sm_37)", rig: "1×K80 + Proxmox passthrough", tg: 6.3, pp: 35.7, src: "al-si-k80", confidence: "measured", note: "Стартовая конфигурация — 3.25 ток/с; параллельный сплит по двум чипам + переквантование дали ×1.9" },
    { model: "Qwen3.6-27B", quant: "Q4_K_M, speculative decoding", ctx: 4096, backend: "llama.cpp", rig: "1×K80", tg: 13, pp: null, src: "al-si-k80", confidence: "measured", note: "На повторяющемся тексте до 29 ток/с; на творческом — падает до 7–9" },
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "Q4", ctx: 65536, backend: "llama.cpp", rig: "1×K80", tg: 13.5, pp: null, src: "al-si-k80", confidence: "measured", note: "MoE спасает: активных параметров мало" }
  ],
  prices: { low: 40, high: 90, updated: "2026-10", currency: "USD", volatility: "низкая", note: "Дешевле некуда: $40 за 24 ГБ (пусть и разделённых). Это цена эксперимента, а не инструмента.", history: [{ date: "2026-10", price: 55, label: "" }] },
  limits: ["Два раздельных чипа по 12 ГБ", "Kepler: конец всего", "Требуется ручная сборка движка", "Реальная скорость сопоставима с хорошим CPU-инференсом"],
  links: [
    { label: "Единственный подробный отчёт по K80 (2026)", url: "https://al-si.com/en/article/llm-modernes-tesla-k80-2014/" },
    { label: "Почему не стоит: разбор ограничений", url: "https://gpudojo.com/articles/tesla-k80-24gb-ai-review" }
  ]
}

);
