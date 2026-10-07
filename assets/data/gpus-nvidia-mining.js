/* =========================================================================
   NVIDIA — майнинговые карты (CMP, P10x). Самая нишевая часть базы.
   Поля: см. docs/SCHEMA.md
   ========================================================================= */
window.BLDL = window.BLDL || {};
BLDL.gpus = BLDL.gpus || [];

BLDL.gpus.push(

/* ------------------------------------------------------------------ 170HX */
{
  id: "cmp-170hx",
  name: "NVIDIA CMP 170HX",
  short: "8 ГБ → 64 ГБ после разблокировки",
  category: "mining",
  arch: "Ampere, GA100 (тот же чип, что у A100)",
  year: 2021,
  formFactor: "PCIe x4 (электрически), 2 слота, пассивное охлаждение",
  verdict:
    "Главная сенсация 2026 года: прошивочные ограничения GA100 сняли программно, и часть карт открывает 64 ГБ HBM2e при 250 Вт. По объёму HBM на вложенный доллар конкурентов нет — но это лотерея по кремнию, требует Linux, ручной возни и уже подорожала в разы.",
  bestFor: [
    "Один-два больших MoE/плотных кванта, которым нужно 30–64 ГБ VRAM",
    "Длинный контекст: 262k токенов в fp8 KV на одной карте",
    "Эксперименты, где хочется платить за пропускную способность HBM, а не за видеовыходы"
  ],
  risks: [
    "Лотерея по кремнию: 80 ГБ нестабильны почти всегда, стабильный максимум часто 32–40 ГБ",
    "ECC отсутствует — ошибки в памяти не отлавливаются, «тихая порча» вывода возможна",
    "Ширина PCIe остаётся x4 (Gen2 после разблокировки) — загрузка моделей медленная",
    "Видеовыходов нет и не появится; только вычислитель",
    "После обнародования эксплойта цена выросла с $100–250 до $1000–2000"
  ],
  memory: {
    stock: 8,
    mod: 64,
    modNote: "10-ГБ версия: 40 ГБ стабильно, 80 ГБ — показываются, но валятся выше ~40 ГБ",
    type: "HBM2e (SK Hynix, 8-ГБ платы) либо HBM2 (Samsung, 10-ГБ платы)",
    busBits: 4096,
    bandwidth: 1493,
    measuredBandwidth: "~770–930 ГБ/с по memtest_vulkan после разблокировки (зависит от бина); китайский слепой тест восьми карт дал ровно 1600 ГБ/с у всех до разблокировки",
    ecc: false
  },
  compute: {
    cores: 4480,
    coreLabel: "CUDA-ядер",
    sms: "70 SM (8-ГБ) / 60 SM (10-ГБ из коробки)",
    tensor: "280 тензорных ядер 3-го поколения, залочены прошивкой",
    fp32: 6.3,
    fp16: 193,
    fp16Note: "193 Тфлопс — замер после разблокировки (95% от per-SM скорости A100). До разблокировки тензорный путь выдавал 6.3 Тфлопса, FP32 вообще падал до 0.39 Тфлопса",
    int8: "≈400 TOPS (расчётно, до разблокировки не использовались)",
    notes: "FP64 урезан до ~1/64 паспорта — карта не для научных расчётов двойной точности."
  },
  io: {
    pcieGen: 2,
    pcieLanes: 4,
    pcieNote: "Из коробки Gen1 x4 (~1 ГБ/с). После разблокировки — Gen2 x4 (~2 ГБ/с). До x16 можно дойти только пайкой конденсаторов",
    videoOut: false,
    nvlink: false,
    rebar: "BAR1 в 64 ГБ включается разблокировкой; на части карт именно этот шаг ломает загрузку"
  },
  power: {
    tdp: 250,
    tdpNote: "Существует VBIOS на 300 Вт; сообщество чаще держит лимит 150–200 Вт, и при этом карта не упирается в питание",
    measuredLoad: "50–80 Вт в генерации при лимите 150 Вт; 130–155 Вт под нагрузкой на пределе",
    connectors: "2×8-pin",
    cooling: "Пассивная турбина от исходного серверного шасси — в корпусе нужен вентилятор и шрауд"
  },
  software: {
    cuda: "sm_80, CUDA 12.x",
    driver: "Обязателен открытый драйвер nvidia-open 610.x (в отчётах фигурирует и 580.x)",
    backends: ["llama.cpp (CUDA)", "vLLM (W4A16/W8A8, MTP)", "exllamav2"],
    os: "Только Linux x86-64 — инструмент разблокировки под это и написан",
    notes: "Secure Boot должен быть выключен: патченные модули не подписаны. Обновление драйвера сносит разблокировку, пакеты держат на hold."
  },
  mods: [
    { toolId: "cmpunlocker-170hx", title: "cmpunlocker: полная разблокировка GA100", result: "8→64 ГБ, полная скорость SM, PCIe Gen2, BAR1", soldering: false },
    { toolId: "v100-cmp-fma", title: "FMA-обход (исторический)", result: "FP32 с 0.39 до ~6.2 Тфлопса — сегодня вытеснен полной разблокировкой", soldering: false },
    { toolId: "spark-decode", title: "Патч llama.cpp под CMP", result: "Заявлен прирост генерации на CMP-кремнии до ×2", soldering: false }
  ],
  benchmarks: [
    { model: "Qwen3.6-27B", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp (CUDA)", rig: "1×170HX 64 ГБ, лимит 250 Вт", tg: 38, pp: 2782, ppNote: "pp512 = 2994; pp8192 = 2782", src: "lttlabs-170hx", confidence: "measured" },
    { model: "Qwen3.8-27B (W4A16 AWQ, INT8 head)", quant: "W4A16/INT8", ctx: 131072, backend: "vLLM + MTP, 175 Вт", rig: "1×170HX 64 ГБ, Ryzen 5 5600X", tg: 84, pp: null, src: "reddit-170hx-uncertain", confidence: "measured", note: "84 ток/с на 1k контекста, 72 ток/с на 64k" },
    { model: "Qwen3.8-27B (INT8 + DFlash2)", quant: "INT8", ctx: 65536, backend: "vLLM", rig: "1×170HX 40 ГБ (Samsung)", tg: 97.8, pp: null, src: "cmp170hx-vllm", confidence: "measured", note: "8 параллельных потоков — 275 ток/с суммарно" },
    { model: "Qwen3.6-35B-A3B (MoE)", quant: "W8A8", ctx: 32768, backend: "vLLM + MTP2", rig: "1×170HX 64 ГБ", tg: 205, pp: 2950, src: "cmp170hx-bench", confidence: "measured", note: "PP указан ориентировочно для того же класса конфигураций" },
    { model: "Qwen3.6-27B", quant: "W4A16", ctx: 262144, backend: "vLLM, 2 карты TP+EP", rig: "2×170HX 64 ГБ", tg: 111, pp: 2295, src: "l1t-170hx", confidence: "measured", note: "prefill на 8k = 2476, на 262k = 2295 — почти без деградации" },
    { model: "DeepSeek V4-Flash", quant: "—", ctx: 32768, backend: "vLLM + dspark", rig: "3×170HX", tg: 57, pp: 5000, src: "reddit-170hx-test", confidence: "reported", note: "Автор сообщает 57–123 ток/с в зависимости от контекста" },
    { model: "Qwen3-Next-80B-A3B (MoE)", quant: "AWQ 4-bit (45.85 ГиБ)", ctx: 32768, backend: "vLLM", rig: "1×170HX 64 ГБ, X99 + 2×E5-2680 v4", tg: 110, pp: null, src: "juejin-170hx", confidence: "reported", note: "Модель на 80 млрд параметров целиком на одной карте — то, что делают 64 ГБ HBM" },
    { model: "Qwen 27B (FP16)", quant: "FP16, TP2", ctx: 262144, backend: "vLLM, 2 карты", rig: "2×170HX 64 ГБ", tg: 30, pp: null, src: "juejin-170hx", confidence: "reported", note: "Контекст 262k с полной точностью: скорость невелика, но объём позволяет" },
    { model: "Qwen3.8-27B (W8A8 INT8, BF16 KV, MTP=3)", quant: "INT8", ctx: 32768, backend: "vLLM", rig: "1×170HX 64 ГБ", tg: 50, pp: 1500, src: "jxxy-170hx", confidence: "reported", note: "40–60 ток/с генерации без глубокой оптимизации; prefill 1500–4000 ток/с, потери от роста контекста почти нет" },
    { model: "Qwen3.8-27B, 16 параллельных потоков", quant: "INT8", ctx: 8192, backend: "vLLM", rig: "1×170HX 64 ГБ, ~157 Вт", tg: 204.9, pp: null, src: "jxxy-170hx", confidence: "measured", note: "Суммарная пропускная способность на 16 запросах, TTFT 795 мс, 128 запросов пройдено целиком при 157 Вт" },
    { model: "Llama 2 7B", quant: "Q4", ctx: 4096, backend: "llama.cpp", rig: "1×170HX 64 ГБ", tg: 145, pp: null, src: "zhihu-170hx-price", confidence: "reported", note: "129–156 ток/с в зависимости от прогона — маленькая модель разгоняется до предела пропускной способности" },
    { model: "DeepSeek V4-Flash", quant: "—", ctx: 32768, backend: "vLLM", rig: "4×170HX 64 ГБ (256 ГБ)", tg: 98, pp: 5300, src: "zhihu-170hx-price", confidence: "reported", note: "Мультикарточная схема без P2P по Gen2 x4: decode держится, prefill в 4 раза лучше одиночной карты" }
  ],
  prices: {
    low: 1000, high: 2000, updated: "2026-10", currency: "USD",
    volatility: "экстремальная",
    note: "До разблокировки карта стоила $100–250 и считалась мусором. После публикации эксплойта (август 2026) проданные лоты ушли за $1000+, часть продавцов просит $2000. В Китае цена выросла в десять раз за считанные дни, и там же появились карты «с одним живым стеком памяти» — при покупке через 闲鱼 требуйте видео с nvidia-smi и прогон памяти.",
    history: [
      { date: "2026-06", price: 200, label: "до эксплойта" },
      { date: "2026-07", price: 250, label: "первые отчёты" },
      { date: "2026-08", price: 1050, label: "публикация cmpunlocker" },
      { date: "2026-10", price: 1500, label: "текущий ориентир" }
    ]
  },
  limits: [
    "PCIe Gen2 x4: загрузка большой модели занимает минуты, инференс страдает мало",
    "Нет ECC и нет Flash Attention-совместимых гарантий по стабильности на разогнанной геометрии памяти",
    "Не все карты открывают полный объём: нужно проверять продавца и просить отчёт memtest_vulkan",
    "10-ГБ (Samsung HBM2) версия даёт 40 ГБ, а не 64 — это разные карты по поведению"
  ],
  links: [
    { label: "cmpunlocker (инструмент)", url: "https://github.com/amoghmunikote/cmpunlocker" },
    { label: "170th-Street: документация по 170HX", url: "https://170th-street.gitbook.io/hx/unlock/current-unlock" },
    { label: "LTT Labs: тест до и после", url: "https://www.lttlabs.com/articles/2026/09/12/cmp-170hx-cmpunlocker" },
    { label: "Отчёт: 84 ток/с, 262k контекста", url: "https://www.reddit.com/r/LocalLLM/comments/1vw09b1/i_unlocked_a_800_mining_gpu_into_a_64gb/" },
    { label: "Предупреждение о покупке на Alibaba", url: "https://www.reddit.com/r/LocalLLaMA/comments/1v2fm3s/be_careful_when_purchasing_cmp_170hx_on_alibaba/" },
    { label: "arXiv: анализ производительности 170HX", url: "https://arxiv.org/pdf/2505.03782" },
    { label: "掘金: полный разбор разблокировки (8 ГБ → 64 ГБ)", url: "https://juejin.cn/post/7684049880511709236" },
    { label: "Китайский обзор: 170HX как AI-сервер, конкурентные замеры", url: "https://www.jxxy.net/ai/articles/nvidia-cmp-170hx-ai-server-revival/" },
    { label: "知乎: рост цен в 10 раз и замеры на 4 картах", url: "https://zhuanlan.zhihu.com/p/2073756134234765056" }
  ]
},

/* --------------------------------------------------------------- CMP 100-210 */
{
  id: "cmp-100-210",
  name: "NVIDIA CMP 100-210",
  short: "16 ГБ HBM2 на кремнии Volta",
  category: "mining",
  arch: "Volta, GV100 (тот же кристалл, что у V100/Titan V)",
  year: 2020,
  formFactor: "PCIe, 2 слота, пассивное охлаждение",
  verdict:
    "Самый недооценённый лот на вторичке: 16 ГБ HBM2 с 850+ ГБ/с за $100–150. Тензорные ядра задушены прошивкой до ~5% и по сей день не разблокированы, но для GGUF-инференса это не критично — карта упирается в пропускную способность памяти, а она отличная.",
  bestFor: [
    "GGUF-инференс квантованных моделей до 14B с большим запасом по скорости памяти",
    "MoE-модели, которым важна пропускная способность, а не тензорные ядра",
    "Дешёвый «много VRAM» под несколько карт, если PCIe x1 не мешает"
  ],
  risks: [
    "Тензорные ядра фактически нерабочие: FP16 медленнее FP32 — вся ценность карты в HBM",
    "PCIe 1.0 x1: загрузка модели на карту — минуты, потому что модель «втекает» по 1 ГБ/с",
    "Volta — конец поддержки: 580-я ветка драйвера последняя, CUDA 12.x последняя",
    "Апгрейд в V100 не удался: Falcon-процессор не принимает чужую подписанную прошивку"
  ],
  memory: {
    stock: 16, mod: null,
    type: "HBM2", busBits: 4096, bandwidth: 870,
    bandwidthNote: "Паспортные оценки расходятся: 829–900 ГБ/с (TechPowerUp / сообщество). Плюс карты с одной микросхемой HBM — 4 ГБ могут быть недоступны, если серийник начинается не с «1» (отчёт 2024 года, позже опровергнут на других экземплярах)",
    ecc: false
  },
  compute: {
    cores: 5120, coreLabel: "CUDA-ядер (80 SM, у V100 — 84 SM)",
    sms: "80 SM",
    tensor: "640 тензорных ядер — присутствуют физически, но HMMA-латентность растянута с 8 до 512 циклов",
    fp32: 10.56,
    fp16: 5.62,
    fp16Note: "Замер FP16-matmul = 5.62 Тфлопс против паспортных ~118 у V100 — это ~5% ожидаемого. FP32 при этом в норме: 10.56 из ~15 Тфлопс",
    int8: "—",
    notes: "TF32-путь тоже душится (10.82 Тфлопса ≈ 72% ожидаемого). Без Flash Attention (Volta его не получит)."
  },
  io: {
    pcieGen: 1, pcieLanes: 1,
    pcieNote: "Один линией на 1 ГБ/с — именно поэтому загрузка моделей идёт очень долго, а инференс почти не страдает. В части листингов указан 3.0 x16 — верить надо поведению карты, а не описанию",
    videoOut: false, nvlink: false,
    rebar: "Часть карт не умеет ReBAR — на X99 обычно и не требуется"
  },
  power: {
    tdp: 250,
    measuredLoad: "Разогревается заметно; при 250 Вт карта требует полноценного обдува",
    connectors: "2×8-pin",
    cooling: "Пассивная: нужен шрауд и турбинный вентилятор"
  },
  software: {
    cuda: "sm_70, CUDA 12.x (последняя ветка для Volta)",
    driver: "580.x (последняя ветка с поддержкой Volta); на Windows — принудительная установка",
    backends: ["llama.cpp (CUDA)", "exllamav2 (EXL2)", "Ollama (через форк под legacy)"],
    os: "Linux предпочтительно; в Windows карта ставится с ручными танцами",
    notes: "Flash Attention недоступен, vLLM практического смысла не имеет."
  },
  mods: [
    { toolId: "nvpatcher", title: "Патч драйвера", result: "Стабильная установка на Windows", soldering: false },
    { toolId: "ollama-legacy", title: "Ollama под legacy GPU", result: "Современные модели через готовый образ", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M (GGUF)", ctx: 8192, backend: "llama.cpp", rig: "1×CMP 100-210", tg: 31.3, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "11.75 Тфлопс FP32 по замеру автора" },
    { model: "Llama 3.1 8B", quant: "EXL2 4.0bpw", ctx: 8192, backend: "exllamav2", rig: "1×CMP 100-210", tg: 40.66, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "На EXL2 карта использует FP16-путь и обгоняет свой же GGUF-результат" },
    { model: "Qwen2.5 7B", quant: "Q4", ctx: 8192, backend: "Ollama", rig: "1×CMP 100-210, i5-7400", tg: 55, pp: null, src: "reddit-cmp210-tc", confidence: "measured", note: "Прямое сравнение с RTX 3060: 55 против 52 ток/с при вчетверо большей ПСП" },
    { model: "Mistral 7B", quant: "Q4", ctx: 4096, backend: "llama.cpp", rig: "1×CMP 100-210", tg: 60, pp: null, src: "respec-mining", confidence: "reported", note: "Скорость загрузки в этой же конфигурации — главная жалоба" },
    { model: "Phi-2 3B", quant: "Q8", ctx: 2048, backend: "llama.cpp", rig: "1×CMP 100-210", tg: 75, pp: null, src: "respec-mining", confidence: "reported" }
  ],
  prices: {
    low: 90, high: 170, updated: "2026-09", currency: "USD", volatility: "средняя",
    note: "Держится в коридоре $90–170 в зависимости от продавца и наличия охлаждения. На фоне роста цен на 170HX подтягивается вверх.",
    history: [
      { date: "2024-12", price: 150, label: "обзорные цены" },
      { date: "2026-03", price: 130, label: "" },
      { date: "2026-09", price: 125, label: "текущий ориентир" }
    ]
  },
  limits: [
    "PCIe x1 — не проблема для инференса, но убийственная для загрузки и для обучения",
    "Тензорные ядра не разблокированы: ждать переноса эксплойта Falcon на Volta можно, но пока это надежда, а не план",
    "Нет поддержки Flash Attention и BF16",
    "Экзотика: сообщество маленькое, готовых гайдов меньше, чем хотелось бы"
  ],
  links: [
    { label: "Замеры Tensor Core (gist)", url: "https://gist.github.com/synchronic1/94d6b8c2ce89cea8f616527b5d64300a" },
    { label: "Разбор в r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/comments/1frle3o/i_know_this_is_a_dumb_question_about_nvidia_cmp/" },
    { label: "Попытки превратить в V100", url: "https://www.reddit.com/r/homelab/comments/1l8c4sc/cmp100210_mods/" },
    { label: "Кастомный CUDA-движок под 100-210", url: "https://dev.to/haru-neo/i-wrote-a-custom-cuda-inference-engine-to-run-qwen35-27b-on-130-mining-cards-732" }
  ]
},

/* ------------------------------------------------------------------ CMP 90HX */
{
  id: "cmp-90hx",
  name: "NVIDIA CMP 90HX",
  short: "10 ГБ GDDR6X, Ampere GA102",
  category: "mining",
  arch: "Ampere, GA102 (урезанный)",
  year: 2021,
  formFactor: "PCIe, 2 слота, пассивное охлаждение",
  verdict:
    "Ближайший к «нормальной» видеокарте CMP: чип Ampere, GDDR6X, 760 ГБ/с. Проблема одна — 10 ГБ и троттлинг. Троттлинг снимается (cmpunlocker-rs, ForgeMiner), объём — нет.",
  bestFor: ["Любители покопаться в разблокировках", "Модели до 8 ГБ в квантах", "Как второй GPU «на подхват» под спекулятивное декодирование"],
  risks: [
    "10 ГБ — это тот же класс, что у обычной 3080, только без видеовыходов",
    "Разблокировка требует точного совпадения драйвера/ядра, иначе инструмент откажется работать",
    "Сообщество крошечное по сравнению с 170HX — поддержки мало"
  ],
  memory: { stock: 10, mod: null, type: "GDDR6X", busBits: 320, bandwidth: 760, ecc: false },
  compute: {
    cores: 6400, coreLabel: "CUDA-ядер (оценка по сообществу; точное число NVIDIA не публиковала)",
    sms: "—",
    tensor: "Есть, 3-е поколение — разблокируются вместе с общим лимитером",
    fp32: 21.9, fp16: 43, int8: "≈175 TOPS расчётно",
    notes: "Класс производительности — между RTX 3070 Ti и 3080 после разблокировки. Do 1000/разблокировки ядро душится троттлингом майнингового класса"
  },
  io: {
    pcieGen: 2, pcieLanes: 4,
    pcieNote: "Сообщается ширина x4 и включение Gen2 инструментами разблокировки",
    videoOut: false, nvlink: false, rebar: "Включается (cmp90hx_pwner, cmpunlocker-rs)"
  },
  power: { tdp: 320, connectors: "2×8-pin", cooling: "Пассивная", measuredLoad: "Под нагрузкой упирается в 320 Вт — отопление для комнаты" },
  software: {
    cuda: "sm_86, CUDA 12.x",
    driver: "nvidia-open 610.x (протестировано также на 580.159.03)",
    backends: ["llama.cpp (CUDA)", "vLLM (ограниченно)"],
    os: "Linux обязателен для разблокировки",
    notes: "В Windows карта определяется как неизвестное устройство до патча драйвера."
  },
  mods: [
    { toolId: "cmpunlocker-rs", title: "cmpunlocker-rs: compute + PCIe Gen2", result: "Полная частота вычислений, ReBAR, Gen2", soldering: false },
    { toolId: "cmp90hx-pwner", title: "cmp90hx_pwner", result: "Compute, Gen2 и P2P по отдельности", soldering: false },
    { toolId: "forgeminer-cmp", title: "ForgeMiner --cmp-install", result: "Снятие троттлинга одним скриптом", soldering: false }
  ],
  benchmarks: [
    { model: "Qwen3 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (CUDA)", rig: "1×CMP 90HX (разблокирована)", tg: 42, pp: 900, src: null, confidence: "estimated", note: "Оценка по ПСП 760 ГБ/с: 760 / (4.9 ГБ × 1.15) ≈ 60 ток/с потолка, реально ожидается 40–55. Прямых замеров в открытых источниках мало — цифра помечена как оценка, а не замер" }
  ],
  prices: {
    low: 120, high: 220, updated: "2026-09", currency: "USD", volatility: "средняя",
    note: "Митинг имеет смысл только если карта дешевле, чем 2080 Ti: по производительности это близко, а по объёму — 10 против 22 ГБ.",
    history: [{ date: "2026-03", price: 130, label: "" }, { date: "2026-09", price: 170, label: "текущий ориентир" }]
  },
  limits: ["10 ГБ мало для 27B в Q4 без вытеснения слоёв на CPU", "Требуется точная версия драйвера", "Мало публичных замеров именно инференса"],
  links: [
    { label: "cmpunlocker-rs", url: "https://github.com/pearlfortune/cmpunlocker" },
    { label: "cmp90hx_pwner", url: "https://github.com/iatethelogs/cmp90hx_pwner" },
    { label: "Обсуждение утилиты", url: "https://www.reddit.com/r/LocalLLM/comments/1wsi50n/cmp_90hx_compute_unlock_utility/" }
  ]
},

/* ------------------------------------------------------------------ CMP 70HX */
{
  id: "cmp-70hx",
  name: "NVIDIA CMP 70HX",
  short: "8 ГБ GDDR6X",
  category: "mining",
  arch: "Ampere, GA104",
  year: 2021,
  formFactor: "PCIe, 2 слота, пассивное охлаждение",
  verdict:
    "Редкий гость: 8 ГБ и узкое место по PCIe. Смысл имеет только как очень дешёвый второй GPU — 8 ГБ сегодня живёт разве что на 8B Q4.",
  bestFor: ["Спекулятивное декодирование / второй GPU", "Очень бюджетная обвязка к более мощной карте"],
  risks: ["8 ГБ", "Мало отчётов", "Ограничения PCIe"],
  memory: { stock: 8, mod: null, type: "GDDR6X", busBits: 256, bandwidth: 608, ecc: false },
  compute: { cores: 6144, coreLabel: "CUDA-ядер (диапазон по сообществу)", sms: "—", tensor: "Есть, залочены", fp32: 21, fp16: 42, int8: "—", notes: "Оценки по классу GA104" },
  io: { pcieGen: 1, pcieLanes: 4, pcieNote: "Жалобы на Gen1 x4 — до включения разблокировки", videoOut: false, nvlink: false, rebar: "Включается разблокировкой" },
  power: { tdp: 250, connectors: "2×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "sm_86", driver: "nvidia-open 610.x", backends: ["llama.cpp (CUDA)"], os: "Linux", notes: "Разблокировка — по цепочке инструментов CMP." },
  mods: [
    { toolId: "forgeminer-cmp", title: "ForgeMiner --cmp-install", result: "Снятие троттлинга (доступно с --cmp-verify для 70HX)", soldering: false },
    { toolId: "cmpunlocker-rs", title: "cmpunlocker-rs", result: "Схожий путь (протестирован в первую очередь на 50/90HX)", soldering: false }
  ],
  benchmarks: [],
  prices: { low: 80, high: 150, updated: "2026-09", currency: "USD", volatility: "средняя", note: "Продаются редко; ориентир — уровень 40HX.", history: [{ date: "2026-09", price: 110, label: "" }] },
  limits: ["Пустая ниша: за те же деньги 22 ГБ 2080 Ti куда полезнее"],
  links: [{ label: "ForgeMiner: список поддерживаемых CMP", url: "https://github.com/0xHashRaptor/ForgeMiner/wiki/CMP-unlock" }]
},

/* ------------------------------------------------------------------ CMP 50HX */
{
  id: "cmp-50hx",
  name: "NVIDIA CMP 50HX",
  short: "10 ГБ GDDR6, разблокируется до уровня 2080 Ti",
  category: "mining",
  arch: "Turing, TU102 (урезанный)",
  year: 2021,
  formFactor: "PCIe, 2 слота, пассивное охлаждение",
  verdict:
    "Самая «разблокируемая» из младших CMP: сообщество довело её до полной скорости вычислений, сопоставимой с RTX 2080 Ti, плюс PCIe Gen2 и ReBAR. Упирается в 10 ГБ.",
  bestFor: ["Бюджетный Turing с тензорными ядрами под 8B-модели", "Эксперименты с патчами llama.cpp под CMP-кремний"],
  risks: ["10 ГБ", "Часть карт — OEM-варианты, которым нужен отдельный путь разблокировки", "Мало замеров инференса"],
  memory: { stock: 10, mod: null, type: "GDDR6", busBits: 320, bandwidth: 616, ecc: false },
  compute: { cores: 4352, coreLabel: "CUDA-ядер", sms: "—", tensor: "Есть, 2-е поколение (частично возвращаются RT-ядра)", fp32: 13.4, fp16: 26.9, int8: "≈107 TOPS", notes: "После разблокировки владельцы сообщают о полной скорости, соответствующей RTX 2080 Ti по вычислениям" },
  io: { pcieGen: 2, pcieLanes: 16, pcieNote: "Включается Gen2; ширина x16 в отчётах фигурирует как отдельный, аппаратный вопрос", videoOut: false, nvlink: false, rebar: "Включается" },
  power: { tdp: 250, connectors: "2×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "sm_75", driver: "nvidia-open 580.x / 610.x", backends: ["llama.cpp (CUDA)", "exllamav2"], os: "Linux", notes: "Для удвоения скорости генерации рекомендуют пересобрать llama.cpp с -DDISABLE_DP4A --fmad=false." },
  mods: [
    { toolId: "cmpunlocker-rs", title: "cmpunlocker-rs: compute-unlock v534", result: "Полная скорость + Gen2 + ReBAR; есть и временный, и персистентный режим", soldering: false },
    { toolId: "spark-decode", title: "Патч llama.cpp", result: "Владелец сообщает о двукратном росте tok/s", soldering: false },
    { toolId: "nvpatcher", title: "Патч драйвера", result: "Работа под Windows с оговорками", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp (CUDA, патченый)", rig: "1×CMP 50HX 10 ГБ", tg: 45, pp: null, src: "reddit-50hx-dp4a", confidence: "reported", note: "До патча автор получал примерно вдвое меньше" }
  ],
  prices: { low: 100, high: 190, updated: "2026-09", currency: "USD", volatility: "средняя", note: "10 ГБ за эти деньги конкурируют с 2080 Ti 11 ГБ — выбирайте по объёму.", history: [{ date: "2026-09", price: 140, label: "" }] },
  limits: ["10 ГБ — потолок, разблокировка объём не добавляет", "Персистентный режим требует подмены модулей ядра и аккуратности с откатом", "OEM-карты (subsystem 1462:371f) имеют другой путь"],
  links: [
    { label: "cmpunlocker-rs: инструкция для 50HX", url: "https://github.com/pearlfortune/cmpunlocker" },
    { label: "Отчёт: удвоение TG на llama.cpp", url: "https://www.reddit.com/r/LocalLLM/comments/1vaby7g/how_i_doubled_the_tg_of_llamacpp_on_cmp_50hx_gpu/" },
    { label: "Issue #575 в NVIDIA-patcher", url: "https://github.com/dartraiden/NVIDIA-patcher/issues/575" }
  ]
},

/* ------------------------------------------------------------------ CMP 40HX */
{
  id: "cmp-40hx",
  name: "NVIDIA CMP 40HX",
  short: "8 ГБ GDDR6, TU106",
  category: "mining",
  arch: "Turing, TU106 (урезанный)",
  year: 2021,
  formFactor: "PCIe, 2 слота, пассивное охлаждение",
  verdict:
    "Младший CMP с тензорными ядрами. 8 ГБ сегодня — это 8B-модель в Q4 и не больше. Как «просто попробовать» — годится, как основная карта — нет.",
  bestFor: ["Самый дешёвый вход в CUDA-инференс с тензорными ядрами", "Плата для обучения и экспериментов"],
  risks: ["8 ГБ", "Пассивное охлаждение", "Слабый запас по производительности"],
  memory: { stock: 8, mod: null, type: "GDDR6", busBits: 256, bandwidth: 448, ecc: false },
  compute: { cores: 2304, coreLabel: "CUDA-ядер", sms: "—", tensor: "Есть, 2-е поколение, залочены до разблокировки", fp32: 7.9, fp16: 15.9, int8: "≈63 TOPS", notes: "Класс RTX 2060/2060 Super" },
  io: { pcieGen: 1, pcieLanes: 4, pcieNote: "Разблокировка включает Gen2", videoOut: false, nvlink: false, rebar: "Включается" },
  power: { tdp: 185, connectors: "1×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "sm_75", driver: "nvidia-open 610.x", backends: ["llama.cpp (CUDA)"], os: "Linux (для разблокировки)", notes: "" },
  mods: [{ toolId: "forgeminer-cmp", title: "ForgeMiner --cmp-install", result: "Снятие троттлинга; статус читается по хешрейту", soldering: false }],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 4096, backend: "llama.cpp", rig: "1×CMP 40HX", tg: 32, pp: 600, src: null, confidence: "estimated", note: "Оценка по ПСП 448 ГБ/с, сопоставима с RTX 2060 Super" }
  ],
  prices: { low: 60, high: 120, updated: "2026-09", currency: "USD", volatility: "низкая", note: "Дёшево ровно потому, что 8 ГБ никого не впечатляют.", history: [{ date: "2026-09", price: 85, label: "" }] },
  limits: ["8 ГБ", "После разблокировки статус на 40HX не читается из userspace — проверять только по нагрузке"],
  links: [{ label: "ForgeMiner: CMP unlock", url: "https://github.com/0xHashRaptor/ForgeMiner/wiki/CMP-unlock" }]
},

/* ------------------------------------------------------------------ CMP 30HX */
{
  id: "cmp-30hx",
  name: "NVIDIA CMP 30HX",
  short: "6 ГБ — не разблокируется в принципе",
  category: "mining",
  arch: "Turing, TU116",
  year: 2021,
  formFactor: "PCIe, 2 слота, пассивное охлаждение",
  verdict:
    "Единственный CMP, для которого не существует разблокировки вообще: механизм, который используют инструменты на 40/50/70/90HX, на TU116 физически отсутствует. Брать только за бесценок и только под задачу, которая влезает в 6 ГБ.",
  bestFor: ["Нишевые задачи с моделями до 3B", "Не рекомендуется как основа для LLM-станции"],
  risks: [
    "Разблокировка невозможна: это подтверждено и инструментами, и сообществом",
    "Попытки применить сторонние разблокировщики могут подвесить систему",
    "6 ГБ"
  ],
  memory: { stock: 6, mod: null, type: "GDDR6", busBits: 192, bandwidth: 336, ecc: false },
  compute: { cores: 1408, coreLabel: "CUDA-ядер", sms: "—", tensor: "Нет", fp32: 5.0, fp16: 10, int8: "—", notes: "Троттлинг не снимается, поэтому практическая производительность ниже паспортной" },
  io: { pcieGen: 1, pcieLanes: 4, pcieNote: "", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 125, connectors: "1×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "sm_75", driver: "nvidia-open 610.x / патч драйвера", backends: ["llama.cpp (CUDA)"], os: "Linux / Windows с патчем", notes: "" },
  mods: [],
  benchmarks: [],
  prices: { low: 30, high: 70, updated: "2026-09", currency: "USD", volatility: "низкая", note: "Идёт по цене металлолома — и это справедливо.", history: [{ date: "2026-09", price: 45, label: "" }] },
  limits: ["Нет разблокировки — и не будет", "6 ГБ", "Нет тензорных ядер"],
  links: [{ label: "ForgeMiner: «30HX не поддерживается, никогда»", url: "https://github.com/0xHashRaptor/ForgeMiner/wiki/CMP-unlock" }]
},

/* ---------------------------------------------------------------- P102-100 */
{
  id: "p102-100",
  name: "NVIDIA P102-100",
  short: "5 ГБ → 10 ГБ прошивкой BIOS",
  category: "mining",
  arch: "Pascal, GP102 (обрезок 1080 Ti)",
  year: 2018,
  formFactor: "PCIe x4 электрически, 2 слота",
  verdict:
    "Легенда «дешёвого интеллекта»: 10 ГБ после прошивки, 3200 CUDA-ядер, ПСП 440 ГБ/с — и всё это за $40–60. Практически: PCIe-линии узкие, поддержка в Windows требует патча драйвера, но для инференса квантованных 8B это рабочая лошадка.",
  bestFor: [
    "Самый дешёвый способ получить 10 ГБ VRAM и 440 ГБ/с",
    "Многокарточные стенды, где важна суммарная VRAM, а не ширина линий",
    "Модели до 8B в Q4/K-квантах"
  ],
  risks: [
    "PCIe x4 (по факту Gen1 в большинстве карт) — долгая загрузка модели",
    "Официальной поддержки нет: в Windows нужен патч драйвера или принудительная установка",
    "Не все карты — реально 10 ГБ: часть физически укомплектована половиной чипов",
    "Без видеовыходов, пассивное охлаждение"
  ],
  memory: {
    stock: 5, mod: 10, modNote: "Прошивка BIOS с корректной таблицей памяти. Физически на плате 10 чипов GDDR5X по 1 ГБ",
    type: "GDDR5X", busBits: 320, bandwidth: 440, ecc: false
  },
  compute: { cores: 3200, coreLabel: "CUDA-ядер", sms: "—", tensor: "Нет", fp32: 10.77, fp16: 0.15, int8: "≈43 TOPS (через DP4A, где поддерживается)", notes: "FP16 практически отсутствует — это Pascal. INT8-инструкции есть и используются в llama.cpp (DP4A)" },
  io: { pcieGen: 1, pcieLanes: 4, pcieNote: "≈1 ГБ/с. В паспорте значится 3.0 x4, но реальные карты работают на Gen1", videoOut: false, nvlink: false, rebar: "Не требуется" },
  power: { tdp: 250, connectors: "2×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: {
    cuda: "sm_61, CUDA 12.x",
    driver: "Linux — из коробки; Windows — NVIDIA-patcher или NVCleanstall с ID 1B47/1B07",
    backends: ["llama.cpp (CUDA)", "Ollama", "Vulkan (llama.cpp)"],
    os: "Linux проще всего", notes: ""
  },
  mods: [
    { toolId: "p102-bios", title: "Прошивка BIOS 5 → 10 ГБ", result: "Полный объём VRAM", soldering: false },
    { toolId: "nvpatcher", title: "Патч драйвера (Windows)", result: "Карта работает под Windows", soldering: false },
    { toolId: "spark-decode", title: "Патч llama.cpp", result: "Обход заблокированных инструкций применим и к P102", soldering: false }
  ],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M (GGUF)", ctx: 8192, backend: "llama.cpp", rig: "1×P102-100 10 ГБ", tg: 22.6, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "Стоимость на момент теста — $40" },
    { model: "Llama 3.1 8B", quant: "Q4_K_M", ctx: 8192, backend: "llama.cpp", rig: "1×P102-100 в Octominer X12, i7-6700", tg: 15.7, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "Просадка из-за процессора/чипсета; сброс GPU поднял до 19+" },
    { model: "Llama 3.1 8B", quant: "Q5", ctx: 8192, backend: "llama.cpp", rig: "1×P102-100", tg: 32, pp: null, src: "reddit-battle-cheap", confidence: "reported", note: "Сообщение владельца трёх P102 в комментариях" }
  ],
  prices: { low: 35, high: 75, updated: "2026-09", currency: "USD", volatility: "низкая", note: "Самый дешёвый вход в 10 ГБ CUDA. 10 ГБ на доллар — рекорд базы.", history: [{ date: "2024-09", price: 40, label: "" }, { date: "2026-09", price: 55, label: "текущий ориентир" }] },
  limits: ["Нет FP16 — только FP32 и INT8-пути", "x4-линии: обучение и большие загрузки — боль", "Не поддерживает современные оптимизации вроде Flash Attention"],
  links: [
    { label: "Сравнение дешёвых GPU (P102, M40, P100, CMP)", url: "https://www.reddit.com/r/LocalLLaMA/comments/1f6hjwf/battle_of_the_cheap_gpus_lllama_31_8b_gguf_vs/" },
    { label: "Скорборд CUDA в llama.cpp (#15013)", url: "https://github.com/ggml-org/llama.cpp/discussions/15013" },
    { label: "Инструкция по установке майнинговых карт", url: "https://respec.io/mining-gpu-installation/" }
  ]
},

/* ---------------------------------------------------------------- P104-100 */
{
  id: "p104-100",
  name: "NVIDIA P104-100",
  short: "8 ГБ GDDR5X",
  category: "mining",
  arch: "Pascal, GP104 (обрезок 1080)",
  year: 2017,
  formFactor: "PCIe x4, 2 слота",
  verdict:
    "Середнячок: 8 ГБ и 320 ГБ/с. Есть версии на 4 и 8 ГБ — берите восьмигигабайтные. Часто идёт по $30–50, и в этой цене это честная карта для 8B в Q4.",
  bestFor: ["Дешёвый 8-гигабайтный узел", "Стенды, где карты считаются десятками, а не поштучно"],
  risks: ["PCIe x4", "Пассивное охлаждение", "Разные версии по объёму — легко купить 4-ГБ по ошибке"],
  memory: { stock: 8, mod: null, type: "GDDR5X", busBits: 256, bandwidth: 320, ecc: false, modNote: "Существует вариант 4 ГБ — не путать" },
  compute: { cores: 1920, coreLabel: "CUDA-ядер", sms: "—", tensor: "Нет", fp32: 6.65, fp16: 0.1, int8: "≈27 TOPS", notes: "Класс GTX 1070" },
  io: { pcieGen: 1, pcieLanes: 4, pcieNote: "≈1 ГБ/с", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 180, connectors: "1×8-pin", cooling: "Пассивная", measuredLoad: "—" },
  software: { cuda: "sm_61, CUDA 12.x", driver: "Linux из коробки / патч под Windows", backends: ["llama.cpp (CUDA)", "Vulkan"], os: "Linux", notes: "" },
  mods: [{ toolId: "nvpatcher", title: "Патч драйвера (Windows)", result: "Работа под Windows", soldering: false }],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q6_K_L", ctx: 8192, backend: "llama.cpp (GGUF)", rig: "1×P104-100", tg: 16.9, pp: null, src: "reddit-battle-cheap", confidence: "measured" },
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×P104-100", tg: 48.6, pp: 325.3, src: "scoreboard-vulkan", confidence: "measured" },
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA)", rig: "1×P104-100", tg: 46.2, pp: 311.9, src: "scoreboard-cuda", confidence: "measured" }
  ],
  prices: { low: 25, high: 60, updated: "2026-09", currency: "USD", volatility: "низкая", note: "", history: [{ date: "2026-09", price: 40, label: "" }] },
  limits: ["8 ГБ и 320 ГБ/с — потолок для 8B в Q4", "Pascal: нет тензорных ядер, нет FP16"],
  links: [{ label: "Скорборд Vulkan (#10879)", url: "https://github.com/ggml-org/llama.cpp/discussions/10879" }]
},

/* ---------------------------------------------------------------- P106-100 */
{
  id: "p106-100",
  name: "NVIDIA P106-100",
  short: "6 ГБ, самый дешёвый вход",
  category: "mining",
  arch: "Pascal, GP106",
  year: 2017,
  formFactor: "PCIe x16 физически, Gen1",
  verdict:
    "Массовая майнинговая карта, коих тысячи. 6 ГБ и 192 ГБ/с. Сегодня годится ровно для двух вещей: 3–4B модели и донор опыта «как вообще запускается локальная LLM на старом железе».",
  bestFor: ["Самый дешёвый старт", "3B–4B модели, эмбеддинги, STT/TTS"],
  risks: ["6 ГБ мало даже для 8B в Q4 без выгрузки слоёв на CPU", "Gen1 x16 (≈4 ГБ/с) режет скорость загрузки"],
  memory: { stock: 6, mod: null, type: "GDDR5", busBits: 192, bandwidth: 192, ecc: false },
  compute: { cores: 1280, coreLabel: "CUDA-ядер", sms: "—", tensor: "Нет", fp32: 4.4, fp16: "—", int8: "≈26 TOPS", notes: "Класс GTX 1060 6 ГБ, но с урезанной шиной" },
  io: { pcieGen: 1, pcieLanes: 16, pcieNote: "Gen1.1: ≈4 ГБ/с максимум, а в x8-слоте — 2 ГБ/с", videoOut: false, nvlink: false, rebar: "—" },
  power: { tdp: 120, connectors: "1×6-pin", cooling: "Активное у большинства экземпляров", measuredLoad: "До 100 Вт под нагрузкой при 80 °C и слышимом вентиляторе; около половины скорости RTX 2060 Super в генерации изображений" },
  software: { cuda: "sm_61", driver: "Обычно работает и без патча — самая «дружелюбная» из P10x", backends: ["llama.cpp (CUDA)", "Vulkan"], os: "Linux / Windows", notes: "" },
  mods: [],
  benchmarks: [
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (CUDA)", rig: "1×P106-100", tg: 30.4, pp: 406.9, src: "scoreboard-cuda", confidence: "measured" },
    { model: "Llama 2 7B", quant: "Q4_0", ctx: 4096, backend: "llama.cpp (Vulkan)", rig: "1×P106-100", tg: 29.8, pp: 183.8, src: "scoreboard-vulkan", confidence: "measured" },
    { model: "Qwen 14B", quant: "Q4, частичная выгрузка", ctx: 4096, backend: "Ollama", rig: "1×P106-100 + рабочая станция", tg: 1.9, pp: null, src: "zhihu-cpu-only-fail", confidence: "measured", note: "Тот же тест на CPU без карты — 1.54 ток/с, на голом серверном железе 32B — 0.82. Карта уровня P106 меняет картину мало" }
  ],
  prices: { low: 15, high: 45, updated: "2026-10", currency: "USD", volatility: "низкая", note: "Цена одной пиццы за карту с CUDA. В Китае такие карты уходят за ¥50–100, а версия P106-090 (3 ГБ, PCIe x4 1.1) — ещё дешевле. Оба варианта продаются без гарантии.", history: [{ date: "2026-06", price: 25, label: "наплыв списанных карт" }, { date: "2026-10", price: 30, label: "текущий ориентир" }] },
  limits: ["6 ГБ — жёсткий потолок", "Gen1 x16 по 4 ГБ/с", "Нет FP16-путей", "Версия P106-090 отличается радикально: 3 ГБ и PCIe x4 1.1 — для LLM она не годится совсем"],
  links: [{ label: "llama.cpp CUDA-скорборд", url: "https://github.com/ggml-org/llama.cpp/discussions/15013" }, { label: "知乎: почему сервер без GPU проигрывает даже P106", url: "https://zhuanlan.zhihu.com/p/28904808972" }, { label: "什么值得买: замеры потребления и температур P106-100", url: "https://post.smzdm.com/p/a0q2nd0z/" } ]
},

/* ----------------------------------------------------------- Titan V (майнинг) */
{
  id: "titan-v",
  name: "NVIDIA Titan V (в т. ч. майнинговая ревизия)",
  short: "12 ГБ HBM2, единственный потребительский Volta",
  category: "pro",
  arch: "Volta, GV100",
  year: 2017,
  formFactor: "PCIe x16, 2 слота",
  verdict:
    "Компактный Volta с видеовыходами: 12 ГБ HBM2, 652 ГБ/с, FP64 приличной скорости. Майнинговые версии (без видеовыходов, с турбиной) уходят за $200–300 и это, пожалуй, оптимальный «серверный» Volta для дома — если 12 ГБ хватает.",
  bestFor: ["14B в Q5/Q6, 12 ГБ с высокой ПСП", "Задачи, где нужен FP64", "Как быстрый доп. GPU к основной карте"],
  risks: ["12 ГБ", "Volta = конец поддержки драйверов", "Майнинговые версии без видеовыходов и с неудобным расположением питания"],
  memory: { stock: 12, mod: null, type: "HBM2", busBits: 3072, bandwidth: 652, ecc: false },
  compute: { cores: 5120, coreLabel: "CUDA-ядер", sms: "80 SM", tensor: "640 тензорных ядер 1-го поколения — работают (в отличие от CMP 100-210)", fp32: 14.9, fp16: 29.8, int8: "—", notes: "FP64: 7.45 Тфлопс — на порядок лучше любой потребительской карты" },
  io: { pcieGen: 3, pcieLanes: 16, pcieNote: "", videoOut: true, nvlink: false, rebar: "—" },
  power: { tdp: 250, connectors: "1×8-pin + 1×6-pin", cooling: "Турбина (майнинговые — пассивные/турбинные)", measuredLoad: "—" },
  software: { cuda: "sm_70, CUDA 12.x", driver: "580.x — последняя ветка", backends: ["llama.cpp (CUDA)", "exllamav2"], os: "Linux / Windows", notes: "В части сборок llama.cpp Titan V отказывался запускаться — карта капризна к конфигурации" },
  mods: [],
  benchmarks: [
    { model: "Llama 3.1 8B", quant: "Q4_K_M (GGUF)", ctx: 8192, backend: "llama.cpp", rig: "1×Titan V", tg: 37.4, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "Автор отметил, что llama.cpp на карте не завёлся, поэтому для сравнения использовались другие бэкенды" },
    { model: "Llama 3.1 8B", quant: "EXL2 4.0bpw", ctx: 8192, backend: "exllamav2", rig: "1×Titan V", tg: 45.7, pp: null, src: "reddit-battle-cheap", confidence: "measured", note: "Загрузка модели 6.3 с против 40 с у CMP 100-210" }
  ],
  prices: { low: 200, high: 400, updated: "2026-09", currency: "USD", volatility: "средняя", note: "Майнинговые версии дешевле retail-версии с турбиной на $100–150.", history: [{ date: "2024-09", price: 300, label: "" }, { date: "2026-09", price: 280, label: "текущий ориентир" }] },
  limits: ["12 ГБ", "Драйверная поддержка Volta завершена", "Мало кто делится конфигурациями — придётся разбираться самому"],
  links: [{ label: "Сравнение дешёвых GPU", url: "https://www.reddit.com/r/LocalLLaMA/comments/1f6hjwf/battle_of_the_cheap_gpus_lllama_31_8b_gguf_vs/" }]
}

);
