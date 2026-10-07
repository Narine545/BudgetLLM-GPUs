/* =========================================================================
   BudgetLLM GPUs — метаданные, категории, справочник моделей и реестр источников.
   Обычный скрипт (не модуль) — чтобы страница открывалась и по file://.
   ========================================================================= */
window.BLDL = window.BLDL || {};

BLDL.meta = {
  version: "0.9.0",
  updated: "2026-10-07",
  currencyNote:
    "Цены — вторичный рынок (eBay/Alibaba/Avito/Goofish), только ориентир. На таких картах цена меняется за дни: разблокировка CMP 170HX подняла её с $100–250 до $1000+ за пару недель. У каждой карты указана дата и волатильность.",
  disclaimer:
    "Разблокировка прошивок и модификации VRAM выполняются на ваш риск: возможны потеря данных, нестабильность, отказ оборудования и потеря гарантии. Материал носит информационный характер и не является инструкцией к действию.",

  /* Категории карт: цвет используется в оформлении бейджей и карточек */
  categories: {
    mining: {
      label: "Майнинговая",
      color: "#a4503a", ink: "#a4503a", soft: "#f2e0d8",
      blurb: "Карты, выпущенные только для майнинга: без видеовыходов, часто с урезанным PCIe и залоченными блоками."
    },
    datacenter: {
      label: "Серверная (Tesla/Instinct)",
      color: "#40668a", ink: "#40668a", soft: "#e0e8f0",
      blurb: "Ускорители для стоек: пассивное охлаждение, нет видеовыходов, требуют обдува и переходников питания."
    },
    pro: {
      label: "Профессиональная",
      color: "#4f7a52", ink: "#4f7a52", soft: "#e2ece1",
      blurb: "Рабочие станции (Quadro/RTX A, Radeon Pro, Arc Pro): есть видеовыходы, официальные драйверы, ECC."
    },
    "consumer-mod": {
      label: "Потребительская (мод VRAM)",
      color: "#a97a20", ink: "#a97a20", soft: "#f6ebd3",
      blurb: "Обычные игровые карты, у которых в кустарных мастерских заменены чипы памяти: 11→22 ГБ, 24→48 ГБ и т. п."
    },
    consumer: {
      label: "Потребительская",
      color: "#7d746b", ink: "#7d746b", soft: "#ebe4d7",
      blurb: "Массовые карты. В базе нужны как точка отсчёта цены и скорости."
    },
    apu: {
      label: "APU/плата целиком",
      color: "#6d5a86", ink: "#6d5a86", soft: "#e9e2f2",
      blurb: "Не карта, а цельная плата с общей памятью (BC-250 и подобные майнинговые платформы)."
    }
  },

  /* Достоверность данных */
  confidence: {
    measured:  { label: "замер",     cls: "good", hint: "ток/с получены владельцем на его железе, есть ссылка" },
    reported:  { label: "отчёт",     cls: "info", hint: "сообщение в трекере/на форуме, замер не приложен" },
    estimated: { label: "оценка",    cls: "warn", hint: "рассчитано по ПСП и размеру модели — не замер" },
    vendor:    { label: "паспорт",   cls: "",     hint: "данные производителя или TechPowerUp" }
  },

  /* Справочник моделей для раздела «Подбор под модель».
     bytes — вес модели в ГБ (GGUF/сейфтензорс, без KV-кэша).
     kvGBper1k — KV-кэш на 1000 токенов контекста, fp16, ГБ. */
  models: [
    { id: "llama32-3b",  name: "Llama 3.2 3B",        params: 3,    active: 3,   dense: true,  bytes: { q4: 2.0, q5: 2.3, q8: 3.4, fp16: 6.4 },   kvGBper1k: 0.05 },
    { id: "qwen3-8b",    name: "Qwen3 8B",            params: 8,    active: 8,   dense: true,  bytes: { q4: 4.9, q5: 5.7, q8: 8.5, fp16: 16.0 },  kvGBper1k: 0.13 },
    { id: "llama31-8b",  name: "Llama 3.1 8B",        params: 8,    active: 8,   dense: true,  bytes: { q4: 4.9, q5: 5.7, q8: 8.5, fp16: 16.0 },  kvGBper1k: 0.13 },
    { id: "gemma3-12b",  name: "Gemma 3 12B",         params: 12,   active: 12,  dense: true,  bytes: { q4: 7.3, q5: 8.6, q8: 12.7, fp16: 24.0 }, kvGBper1k: 0.11 },
    { id: "qwen3-14b",   name: "Qwen3 14B",           params: 14,   active: 14,  dense: true,  bytes: { q4: 9.0, q5: 10.5, q8: 15.7, fp16: 29.0 }, kvGBper1k: 0.20 },
    { id: "qwen3-30a3",  name: "Qwen3 30B-A3B (MoE)", params: 30,   active: 3,   dense: false, bytes: { q2: 10.7, q4: 18.6, q5: 20.4, q8: 32.0, fp16: 61.0 }, kvGBper1k: 0.09 },
    { id: "qwen3-32b",   name: "Qwen3 32B",           params: 32,   active: 32,  dense: true,  bytes: { q4: 19.8, q5: 23.0, q8: 34.8, fp16: 65.0 }, kvGBper1k: 0.25 },
    { id: "gemma4-26a4", name: "Gemma 4 26B-A4B (MoE)",params: 25.2,active: 4,   dense: false, bytes: { q2: 8.5, q4: 14.0, q5: 16.5, q8: 26.0, fp16: 50.0 }, kvGBper1k: 0.08 },
    { id: "llama33-70b", name: "Llama 3.3 70B",       params: 70,   active: 70,  dense: true,  bytes: { q2: 26.0, q4: 40.0, q5: 48.0, q8: 71.0, fp16: 141.0 }, kvGBper1k: 0.33 },
    { id: "gptoss-120",  name: "gpt-oss 120B (MoE)",  params: 120,  active: 5.1, dense: false, bytes: { q2: 36.0, q4: 63.0, q5: 71.0, q8: 113.0, fp16: 234.0 }, kvGBper1k: 0.07 },
    { id: "qwen3-235a22", name: "Qwen3 235B-A22B (MoE)", params: 235, active: 22, dense: false, bytes: { q1: 50.7, q2: 62.0, q4: 121.0, q8: 215.0, fp16: 470.0 }, kvGBper1k: 0.10 }
  ],

  /* Реестр источников: то, что стоит парсить в первую очередь */
  sources: [
    /* --- GitHub: разблокировки и прошивки --- */
    { id: "cmpunlocker", title: "amoghmunikote/cmpunlocker", url: "https://github.com/amoghmunikote/cmpunlocker", kind: "github",
      take: "Основной инструмент разблокировки CMP 170HX: SM-производительность, геометрия HBM2e (64/40 ГБ), PCIe Gen2, ECC, BAR1, JTAG, VFIO. Таблица «что разблокировано» и требования (nvidia-open 610.x, отключённый Secure Boot).", priority: 1 },
    { id: "170th-street", title: "amoghmunikote/170th-Street", url: "https://github.com/amoghmunikote/170th-Street", kind: "github",
      take: "Самое полное сообществное описание CMP 170HX: разбор платы, сравнение с A100, что именно вырезала NVIDIA, мод PCIe-конденсаторов, водянка, FP16/FMA-воркэраунд.", priority: 1 },
    { id: "170th-gitbook", title: "170th Street (GitBook)", url: "https://170th-street.gitbook.io/hx/unlock/current-unlock", kind: "docs",
      take: "Актуальный статус разблокировки, пошаговое описание пайплайна, известные проблемы (ECC, NVLink, Gen4).", priority: 1 },
    { id: "cmpunlocker-rs", title: "pearlfortune/cmpunlocker", url: "https://github.com/pearlfortune/cmpunlocker", kind: "github",
      take: "Разблокировка лимитера вычислений у CMP 90HX и 50HX: команды run/verify, таблица протестированных драйверов/ядер, персистентная установка через patched-модули.", priority: 1 },
    { id: "cmp90hx-pwner", title: "iatethelogs/cmp90hx_pwner", url: "https://github.com/iatethelogs/cmp90hx_pwner", kind: "github",
      take: "Утилита для 90HX: отдельные действия — compute-unlock, PCIe Gen2, P2P.", priority: 2 },
    { id: "forgeminer-cmp", title: "ForgeMiner: CMP hardware unlock", url: "https://github.com/0xHashRaptor/ForgeMiner/wiki/CMP-unlock", kind: "github",
      take: "Одна команда --cmp-install для 40HX/50HX/70HX/90HX, PCI ID, требования, проверка статуса, откат. Явно сказано: 30HX не разблокируется — это аппаратное ограничение.", priority: 2 },
    { id: "nvpatcher", title: "dartraiden/NVIDIA-patcher", url: "https://github.com/dartraiden/NVIDIA-patcher", kind: "github",
      take: "Патчер драйверов: поддержка P102/P104/P106/CMP и NVENC/NVIF у потребительских карт. Первый источник по «как завести майнинговую карту в Windows».", priority: 1 },
    { id: "nvpatcher-575", title: "Issue #575: CMP 50/90/170HX full compute + PCIe Gen2", url: "https://github.com/dartraiden/NVIDIA-patcher/issues/575", kind: "issue",
      take: "Отчёт владельца CMP 50HX: полная скорость = 2080 Ti, PCIe Gen2, ReBAR; вопрос о переносе в Windows-патч.", priority: 2 },
    { id: "unlock-170hx", title: "abobasixseven/unlock-cmp-170hx", url: "https://github.com/abobasixseven/unlock-cmp-170hx", kind: "github",
      take: "Альтернативный инструмент разблокировки памяти; отдельно фиксирует, что ширина x4 — аппаратное ограничение платы.", priority: 3 },
    { id: "consensus-170hx", title: "Consensus-Protocol/cmp170hx", url: "https://github.com/Consensus-Protocol/cmp170hx", kind: "github",
      take: "Кремний, прошивка и процедуры разблокировки: уровни защиты GA100, CFG1-страпы, DFA/voltage glitch.", priority: 2 },
    { id: "ga100-vbios", title: "GA100 VBIOS comparison (gist)", url: "https://gist.github.com/amoghmunikote/dafea7b6663c13edc28b33872f6e51be", kind: "gist",
      take: "Таблица VBIOS: 170HX 8/10/16 ГБ против A100 PCIe и Drive A100, байты страпов, какие пути разблокировки требуют паяльника/программатора.", priority: 2 },
    { id: "cmp170hx-vllm", title: "ahnguyen17/cmp-170hx-vllm", url: "https://github.com/ahnguyen17/cmp-170hx-vllm", kind: "github",
      take: "Рабочий рецепт vLLM на 170HX: Qwen3.8-27B INT8 + MTP, 65–98 ток/с, 262k контекста, fp8 KV, борьба с Xid 31.", priority: 1 },
    { id: "cmp170hx-bench", title: "Highwayaiexpose/CMP-170hx-64gb-LLM-benchmarks", url: "https://github.com/Highwayaiexpose/CMP-170hx-64gb-LLM-benchmarks", kind: "github",
      take: "Сравнительная таблица ток/с: 170HX против RTX PRO 6000, 2×2080 Ti 22G, 3090, Arc Pro B70. Удобно как «линейка».", priority: 2 },
    { id: "colibri-1652", title: "JustVugg/colibri — issue #1652 (Tesla M10)", url: "https://github.com/JustVugg/colibri/issues/1652", kind: "issue",
      take: "Первый валидный Maxwell-датапоинт: 4×M10 держат все 10 240 экспертов MoE в VRAM, 2.45 ток/с colibri против 7.3 ток/с llama.cpp на том же железе, разбор узкого места.", priority: 1 },
    { id: "colibri", title: "JustVugg/colibri", url: "https://github.com/JustVugg/colibri", kind: "github",
      take: "Движок для MoE на старых GPU (Maxwell/RDNA2 и т. д.). В issues регулярно появляются датапоинты по нишевому железу — золотая жила для базы.", priority: 1 },
    { id: "ollama-legacy", title: "h3rb3rn/ollama-legacy-gpu", url: "https://github.com/h3rb3rn/ollama-legacy-gpu", kind: "github",
      take: "Форк Ollama под Maxwell…Blackwell с готовыми Docker-сборками, патчами и пресетами. Отчёты BONSAI-M10/M60 — реальные прогоны на старых Tesla.", priority: 1 },
    { id: "ollama-legacy-ms", title: "Измерения M10/M60 в ollama-legacy-gpu", url: "https://github.com/h3rb3rn/ollama-legacy-gpu/blob/main/BONSAI-M10-PRODUCTION-Q8-2026-10-01.md", kind: "github",
      take: "Продакшн-замеры Q8/Q4 на Tesla M10 и M60: что реально работает на Maxwell в 2026.", priority: 2 },

    /* --- GitHub: AMD и прочее железо --- */
    { id: "bc250-docs", title: "kalpakprod/awesome-bc250 (AI/LLM)", url: "https://github.com/kalpakprod/awesome-bc250/blob/main/docs/en/12-ai-llm.md", kind: "github",
      take: "Почему на BC-250 нет ROCm (gfx1013 вне списка), как поднять Vulkan, ttm.pages_limit, честные ожидания по ток/с.", priority: 1 },
    { id: "bc250-akandr", title: "akandr/bc250 — гайд и бенчмарки", url: "https://github.com/akandr/bc250", kind: "github",
      take: "Полный дневник внедрения: 24 CU против 40 CU, таблицы ток/с и prefill, энергопотребление, тупик с ROCm, 4×M10-подобные сценарии.", priority: 1 },
    { id: "bc250-unlock", title: "duggasco/bc250-40cu-unlock", url: "https://github.com/duggasco/bc250-40cu-unlock", kind: "github",
      take: "Патч ядра, включающий все 40 CU вместо 24 (+66% шейдерных блоков). Патч amdgpu через modprobe, требует пересборки.", priority: 1 },
    { id: "bc250-llama", title: "TechMakesArt/llama.cpp-bc250", url: "https://github.com/TechMakesArt/llama.cpp-bc250", kind: "github",
      take: "Форк llama.cpp с Vulkan-оптимизациями под gfx1013: 37 → 55 ток/с на 9B Q4_K, разбор по патчам и потолок по ПСП.", priority: 2 },
    { id: "bc250-eeb", title: "BC-250: модифицированный BIOS (GitLab)", url: "https://gitlab.com/TuxThePenguin0/bc250-bios", kind: "git",
      take: "Прошивка с разделом VRAM/GTT, меню чипсета и fan control. Без неё 16 ГБ памяти не отдать GPU целиком.", priority: 2 },
    { id: "mi50-rocm", title: "llama.cpp: Performance on AMD ROCm (discussion #15021)", url: "https://github.com/ggml-org/llama.cpp/discussions/15021", kind: "scoreboard",
      take: "Скорборд: MI50 32 ГБ — pp512 ≈ 1057–1129, tg128 ≈ 99–106 при разных коммитах. Лучший источник для сравнения «до/после» оптимизаций.", priority: 1 },
    { id: "mi50-mx", title: "mx-llama.cpp (форк под gfx906)", url: "https://github.com/mxdzyx/mx-llama.cpp", kind: "github",
      take: "Форк llama.cpp с тюнингом кернелов под gfx906: поддерживает MI50/MI60/Radeon VII, тензорный параллелизм и MTP.", priority: 2 },

    /* --- Скорборды llama.cpp (лучший источник сравнимых цифр) --- */
    { id: "scoreboard-cuda", title: "llama.cpp: Performance on Nvidia CUDA (#15013)", url: "https://github.com/ggml-org/llama.cpp/discussions/15013", kind: "scoreboard",
      take: "pp512/tg128 для P4, P40, P100, P102-100, P104-100, P106-100, V100, M10 и др. на одном коммите — самая честная сравнительная таблица для старых NVIDIA.", priority: 1 },
    { id: "scoreboard-vulkan", title: "llama.cpp: Performance with Vulkan (#10879)", url: "https://github.com/ggml-org/llama.cpp/discussions/10879", kind: "scoreboard",
      take: "То же для Vulkan-бэкенда: BC-250, P102/P104/P106, Vega 64, MI50. Позволяет заводить AMD без ROCm.", priority: 1 },
    { id: "scoreboard-rocm", title: "llama.cpp: Performance on AMD ROCm/HIP (#15021)", url: "https://github.com/ggml-org/llama.cpp/discussions/15021", kind: "scoreboard",
      take: "ROCm-скорборд: MI50/MI60/Radeon VII и современные RDNA. Ключ к пониманию, что gfx906 всё ещё живой, но неофициально.", priority: 1 },

    /* --- Reddit: r/LocalLLaMA и профильные сабреддиты --- */
    { id: "reddit-battle-cheap", title: "Battle of the cheap GPUs: P102-100, M40, P100, CMP 100-210, Titan V", url: "https://www.reddit.com/r/LocalLLaMA/comments/1f6hjwf/battle_of_the_cheap_gpus_lllama_31_8b_gguf_vs/", kind: "reddit",
      take: "Один из лучших сравнительных постов: ток/с Llama-3.1-8B в GGUF и EXL2, время загрузки, цены, выводы по каждой карте.", priority: 1 },
    { id: "reddit-p40-guide", title: "Nvidia Tesla P40 performs amazingly well for llama.cpp GGUF", url: "https://www.reddit.com/r/LocalLLaMA/comments/17zpr2o/nvidia_tesla_p40_performs_amazingly_well_for/", kind: "reddit",
      take: "Канонический тред по P40: конфигурация X99 + 3×P40, Mixtral 20 ток/с, потребление под нагрузкой, влияние PCIe-линий на multi-GPU.", priority: 1 },
    { id: "reddit-170hx-test", title: "I tested the CMP170HX", url: "https://www.reddit.com/r/LocalLLaMA/comments/1vlwjr8/i_tested_the_cmp170hx/", kind: "reddit",
      take: "4 разблокированные 170HX = 256 ГБ HBM, замеры tg/pp в llama.cpp при 150 Вт, сравнение с vLLM от комментаторов (агрегация, спекулятивное декодирование).", priority: 1 },
    { id: "reddit-170hx-uncertain", title: "Be Careful when Purchasing CMP 170HX on Alibaba", url: "https://www.reddit.com/r/LocalLLaMA/comments/1v2fm3s/be_careful_when_purchasing_cmp_170hx_on_alibaba/", kind: "reddit",
      take: "Риски покупки: 8 ГБ (Hynix) → 64 ГБ, 10 ГБ (Samsung) → 40 ГБ стабильно, 80 ГБ нестабильны; просадки напряжения на HBM без ECC.", priority: 1 },
    { id: "reddit-170hx-price", title: "Nvidia CMP 170HX Unlock 8GB to 64GB (r/StableDiffusion)", url: "https://www.reddit.com/r/StableDiffusion/comments/1v0a7wn/nvidia_cmp_170hx_unlock_8gb_to_64gb/", kind: "reddit",
      take: "Динамика цен до и после обнародования эксплойта: sold-листинги $200–300 → $1000+.", priority: 2 },
    { id: "reddit-x99", title: "Let's talk about Chinese X99 motherboards for LLM builds", url: "https://www.reddit.com/r/LocalLLaMA/comments/1d9q1sn/lets_talk_about_chinese_x99_motherboards_for_llm/", kind: "reddit",
      take: "Что реально важно на китайских X99: ReBAR/Above 4G, бифуркация, Huananzhi F8 как проверенная плата, ограничение в 40 линий PCIe.", priority: 1 },
    { id: "reddit-vrampower", title: "VRAM powerhouse: X99 Dual Plus + 4×3090", url: "https://www.reddit.com/r/LocalLLaMA/comments/1d6cefm/vram_powerhouse/", kind: "reddit",
      take: "Пример сборки «много VRAM дёшево» на китайской двухсокетной плате — 96 ГБ без райзеров.", priority: 2 },
    { id: "reddit-p40-p100", title: "P40 vs P100 for LLMs", url: "https://www.reddit.com/r/LocalLLaMA/comments/191yd31/p40_vs_p100_for_llms/", kind: "reddit",
      take: "Разбор FP16-возможностей: у P40 183 Гфлопс FP16 против 19 Тфлопс у P100 — почему EXL2 «не для Pascal».", priority: 2 },
    { id: "reddit-m40", title: "216GB VRAM on the bench — сравнение комбинаций", url: "https://www.reddit.com/r/LocalLLaMA/comments/1qni356/216gb_vram_on_the_bench_time_to_see_which/", kind: "reddit",
      take: "Актуальная (2026) экспертиза по deprecation: P40/P100 ещё живут, K/M — «больше мороки, чем пользы», MoE на Pascal дают 25 ток/с на 8×P40.", priority: 2 },
    { id: "reddit-bc250", title: "Did anyone try to use AMD BC-250 for inference?", url: "https://www.reddit.com/r/LocalLLaMA/comments/1mqjdmn/did_anyone_tried_to_use_amd_bc250_for_inference/", kind: "reddit",
      take: "Практика BC-250: тюнинг VRAM в BIOS, 390 Вт из розетки под нагрузкой, ROCm не работает, реальные ток/с на Qwen MoE и плотных 32B.", priority: 1 },
    { id: "reddit-p4", title: "LLM people: how do we feel about Nvidia Tesla P4 8GB", url: "https://www.reddit.com/r/homelab/comments/1t3h53a/llm_people_how_do_we_feel_about_nvidia_tesla_p4_8gb/", kind: "reddit",
      take: "Ниша P4: 75 Вт из слота, «инференс-сайдкар» для логов и рутины, а не для длинных контекстов.", priority: 3 },
    { id: "reddit-70hx", title: "CMP 100HX-210: почему не подходит для LLM (и почему не правы)", url: "https://www.reddit.com/r/LocalLLaMA/comments/1frle3o/i_know_this_is_a_dumb_question_about_nvidia_cmp/", kind: "reddit",
      take: "Разбор мифа: 850 ГБ/с HBM2 против 288 ГБ/с у 4060 Ti; PCIe x1 почти не влияет на инференс, но замедляет загрузку модели.", priority: 2 },
    { id: "reddit-cmp210-tc", title: "CMP 100-210: Tensor Cores прошиты на 5%", url: "https://www.reddit.com/r/hardware/comments/1sjjnzn/benchmark_evidence_nvidia_cmp_100210_tensor_cores/", kind: "reddit",
      take: "Доказательная база: FP16 5.62 Тфлопс против паспортных ~118 — тензорные ядра задушены в прошивке; FP32 при этом в норме.", priority: 1 },

    /* --- Блоги и статьи --- */
    { id: "medium-pl", title: "We Benchmarked Polish LLMs on Used P40, P100 and V100", url: "https://medium.com/@przemyslaw.rafal.jez/we-benchmarked-polish-llms-on-used-p40-p100-and-v100-gpus-15870eb343bd", kind: "blog",
      take: "Методически чистые замеры pp512/tg128: P40 593/28.5, P100 419/27.2, V100 1963/77.7. Плюс важный вывод: узкое место — prefill, а не генерация.", priority: 1 },
    { id: "tinycomputers", title: "Repurposing Enterprise GPUs: The Tesla P40 Home Lab Story", url: "https://tinycomputers.io/posts/repurposing-enterprise-gpus-the-tesla-p40-home-lab-story.html", kind: "blog",
      take: "4×P40 под Ollama: плотные модели, MoE (gpt-oss-120b на 28 ток/с), и честное «70B плотный = 0.033 ток/с».", priority: 1 },
    { id: "roksblog-v100", title: "Can Two Old Tesla V100s Beat an RTX 4090?", url: "https://www.roksblog.de/can-two-old-tesla-v100s-beat-an-rtx-4090-for-a-fully-local-hermes-agent/", kind: "blog",
      take: "2×V100 16 ГБ против 4090 на 27B с 131k контекста: 50–52 ток/с против 90 — что важнее NVLink и MTP.", priority: 2 },
    { id: "lttlabs-170hx", title: "LTT Labs: CMP 170HX + cmpunlocker", url: "https://www.lttlabs.com/articles/2026/09/12/cmp-170hx-cmpunlocker", kind: "blog",
      take: "Независимая лаборатория: memtest_vulkan, пропускная способность 640–930 ГБ/с, llama-bench до/после (pp512 306→2994), энергоэффективность и провалы на «плохих» картах.", priority: 1 },
    { id: "wtarreau-mi50", title: "Willy Tarreau: AMD Radeon Instinct MI50-32GB", url: "http://wtarreau.blogspot.com/2025/12/amd-radeon-instinct-mi50-32gb-best-ai.html", kind: "blog",
      take: "Аккуратные llama-bench на MI50: 1200–1300 pp / 100–110 tg на Llama-7B, 76 ток/с на MoE 30B-A3B, масштабирование на две карты (235B IQ1_S на 50 ГБ).", priority: 1 },
    { id: "ahelpme-mi50", title: "llama-bench на MI50: Qwen3.6-27B по квантизациям", url: "https://ahelpme.com/ai/llamacpp-ai/llama-bench-the-qwen3-6-27b-and-amd-radeon-instinct-mi50-32gb/", kind: "blog",
      take: "Подробная матрица pp/tg по Q4_K_M…BF16 и сравнение «одна карта против двух» — видно, где ломается масштабирование.", priority: 2 },
    { id: "al-si-k80", title: "Running modern LLMs on a 2014 Tesla K80", url: "https://al-si.com/en/article/llm-modernes-tesla-k80-2014/", kind: "blog",
      take: "Единственный внятный отчёт по Kepler в 2026: 3.25 → 6.3 ток/с через пересборку квантизации и параллельный сплит, спекулятивное декодирование до 29 ток/с.", priority: 1 },
    { id: "runaihome-v100", title: "Модифицированный Tesla V100 SXM2 + PCIe-адаптер", url: "https://runaihome.com/blog/modded-tesla-v100-budget-ai-gpu-2026/", kind: "blog",
      take: "Полная смета сборки (~$200–270), 130 ток/с на gpt-oss-20B, и важный минус: Ollama 0.30+ ломает поддержку — нужен ручной билд.", priority: 1 },
    { id: "openclaw-mi50", title: "Is the AMD MI50 32GB worth it? (2026)", url: "https://openclawdc.com/blog/amd-mi50-32gb-local-llm/", kind: "blog",
      take: "Официальный статус ROCm 7.14 (gfx906 — unsupported), сравнение с R9700 по pp/tg, честный вывод «хобби, а не продакшн».", priority: 2 },
    { id: "dev-cmp210", title: "Кастомный CUDA-движок под Qwen3.5-27B на CMP 100-210", url: "https://dev.to/haru-neo/i-wrote-a-custom-cuda-inference-engine-to-run-qwen35-27b-on-130-mining-cards-732", kind: "blog",
      take: "Инженерный разбор 100-210: HMMA-латентность 8 → 512 циклов, 5 Тфлопс потолок, Gen1 x1, отсутствие P2P — почему стандартные стеки не работают.", priority: 1 },
    { id: "gpu-p4-price", title: "gpudojo: цены и история Tesla P4/P40", url: "https://gpudojo.com/tesla-p4", kind: "price",
      take: "Трекер вторичных цен с историей: удобно для графика волатильности.", priority: 2 },
    { id: "serverflow-p40", title: "Тестируем Tesla P40 в LM Studio (по-русски)", url: "https://serverflow.ru/blog/stati/testiruem-tesla-p40-v-lm-studio-neyroseti-i-llm-na-windows/", kind: "blog",
      take: "Русскоязычный практикум: 14 моделей и квантизаций, время до первого токена, температуры и реальное потребление до 227 Вт.", priority: 1 },
    { id: "habr-p40-p100", title: "Хабр: тесты Pixtral 12B и LLaMA 3.2 11B на P100 и P40", url: "https://habr.com/ru/companies/serverflow/articles/851712/", kind: "blog",
      take: "Мультимодальные тесты на Pascal и объяснение, почему P100 обгоняет P40 в 3.6–4.7 раза на FP16-путях.", priority: 2 },

    /* --- Пресса --- */
    { id: "tomshw-2080ti", title: "Tom's Hardware: 22 ГБ RTX 2080 Ti за $499", url: "https://www.tomshardware.com/pc-components/gpus/chinese-workshops-recondition-nvidias-old-flagship-gaming-gpu-for-ai-rtx-2080-ti-upgraded-to-22gb-for-dollar499", kind: "press",
      take: "Как устроен китайский мод 11→22 ГБ (замена 1-ГБ чипов на 2-ГБ), сервис за $120 и что осталось прежним (ПСП 616 ГБ/с).", priority: 2 },
    { id: "videocardz-v100", title: "VideoCardz: V100 SXM2 + PCIe адаптер за $200 обходит 3060", url: "https://videocardz.com/newz/200-nvidia-v100-server-gpu-mod-beats-rtx-3060-in-local-llm-test", kind: "press",
      take: "Верификация сценария «серверный модуль + китайский переходник» и необходимые доработки (охлаждение, вывод изображения).", priority: 2 },
    { id: "korben-170hx", title: "Korben: VRAM всё это время был там, его заблокировала прошивка", url: "https://korben.info/en/nvidia-cmp-170hx-vram-unlocked-firmware.html", kind: "press",
      take: "Хорошее объяснение уровней защиты Falcon BootROM и того, что после разблокировки остаётся ограниченным (ECC, NVLink, Gen4).", priority: 2 },
    { id: "wccftech-170hx", title: "Wccftech: цены на CMP 170HX взлетели в 4 раза", url: "https://wccftech.com/nvidia-cmp-170hx-8-10-gb-prices-explode-over-1000-usd-as-tool-unlocks-hidden-64-80gb-vram/", kind: "press",
      take: "Динамика цены и предостережение: полный стек памяти откроется не на каждой карте (низкий бин A100).", priority: 3 },
    { id: "phoronix-580", title: "Phoronix: драйвер 580 — последний для Maxwell/Pascal/Volta", url: "https://www.phoronix.com/news/NVIDIA-580-Linux-Driver-Last-HW", kind: "press",
      take: "Официальная точка отсчёта по поддержке: 580-я ветка — последняя, дальше только security-обновления; CUDA 12.x — последний тулкит для sm_50…sm_72.", priority: 1 },
    { id: "nvidia-deprecation", title: "NVIDIA Unix graphics feature deprecation schedule", url: "https://forums.developer.nvidia.com/t/unix-graphics-feature-deprecation-schedule/60588", kind: "docs",
      take: "Первоисточник по срокам поддержки архитектур — проверяйте перед покупкой любой старой карты.", priority: 1 },

    /* --- Формы и обсуждения --- */
    { id: "l1t-170hx", title: "Level1Techs: CMP 170HX и длинный контекст", url: "https://forum.level1techs.com/t/couldnt-resist-grabbing-a-cmp-170hx-and-now-im-in-a-sticky-position/253947", kind: "forum",
      take: "Развёрнутый разбор prefill llama.cpp против vLLM на 170HX: 727 → 2476 ток/с на 8k и 10-кратный выигрыш на 262k контекста при том же decode.", priority: 1 },
    { id: "l1t-mi25", title: "Level1Techs: MI25 — «скрытый зверь» за $100", url: "https://forum.level1techs.com/t/mi25-stable-diffusions-100-hidden-beast/194172", kind: "forum",
      take: "Перепрошивка MI25 в WX9100/Vega 64, тюнинг таблиц PowerPlay, ограничения драйверов.", priority: 2 },
    { id: "homelab-cmp210", title: "r/homelab: попытки превратить CMP 100-210 в V100", url: "https://www.reddit.com/r/homelab/comments/1l8c4sc/cmp100210_mods/", kind: "reddit",
      take: "Что уже не сработало: страпы, конденсаторы PCIe, VBIOS от V100 — Falcon не пропускает подпись. Ожидание переноса эксплойта на Volta.", priority: 2 },
    { id: "developer-nvidia-cmp", title: "NVIDIA Devtalk: анатомия блокировок CMP", url: "https://forums.developer.nvidia.com/t/an-interesting-development-new-cmp-architecture/168779", kind: "forum",
      take: "Официальная позиция о «secure handshake» между драйвером, чипом и BIOS — важно как контекст, почему разблокировки вообще стали возможны.", priority: 3 },
    { id: "arxiv-cmp", title: "arXiv 2505.03782: повторное использование майнинговых GPU в AI", url: "https://arxiv.org/pdf/2505.03782", kind: "paper",
      take: "Академическое измерение CMP 170HX: FP32 был 0.39 Тфлопс (1/32 от паспорта), после отключения FMA — ~6.2 Тфлопса; энергоэффективность против A100. Хорошая научная опора.", priority: 1 },

    /* --- Русскоязычные и ценовые --- */
    { id: "overclockers", title: "Overclockers.ru — форумные отчёты по GPU для LLM", url: "https://overclockers.ru/", kind: "forum",
      take: "Русскоязычные замеры по P40/2080 Ti 22 ГБ/MI50, обсуждения поставщиков и «серых» модов.", priority: 3 },
    { id: "price-170hx-ebay", title: "eBay: проданные лоты CMP 170HX", url: "https://www.ebay.com/sch/i.html?_nkw=cmp+170hx&LH_Sold=1&LH_Complete=1", kind: "price",
      take: "Смотреть именно Sold/Completed: листинги-«хотелки» за $3000 не значат, что по ним покупают.", priority: 2 },

    /* --- Эксплуатация майнинговых карт и замеры по конкретным моделям --- */
    { id: "respec-mining", title: "Respec: установка майнинговых карт под вычисления", url: "https://respec.io/mining-gpu-installation/", kind: "docs",
      take: "Практика эксплуатации P102/P104/P106 и CMP: установка драйверов, типичная скорость моделей 3–7B и главная жалоба — время загрузки модели.", priority: 2 },
    { id: "reddit-50hx-dp4a", title: "CMP 50HX: правка DP4A в llama.cpp удваивает TG", url: "https://www.reddit.com/r/LocalLLM/comments/1vaby7g/how_i_doubled_the_tg_of_llamacpp_on_cmp_50hx_gpu/", kind: "reddit",
      take: "Отчёт с патчем: правка условия DP4A в ggml-cuda/common.cuh и пересборка дают удвоение генерации на разблокированной 50HX — важный вывод про узкое место в ядрах.", priority: 1 },
    { id: "reddit-mi50-dual", title: "Гайд по двум MI50 32 ГБ под Ubuntu 22.04", url: "https://www.reddit.com/r/LocalLLaMA/comments/1rzlhfk/getting_dual_mi50_32gb_cards_working_with/", kind: "reddit",
      take: "Пошаговая настройка пары MI50: ROCm 5.7 либо Vulkan, слоистая раскладка, решение проблем с драйвером и реальные цифры.", priority: 1 },
    { id: "reddit-a770", title: "llama.cpp на Arc A770: SYCL против Vulkan", url: "https://www.reddit.com/r/IntelArc/comments/1enunga/llamacpp_benchmarks_of_llama318b_on_arc_a770/", kind: "reddit",
      take: "Замеры обеих сборок: SYCL заметно быстрее и по генерации, и особенно по prefill — обязательная проверка при выборе бэкенда для Arc.", priority: 1 },
    { id: "insiderllm-arc", title: "InsiderLLM: состояние Arc для локального ИИ", url: "https://insiderllm.com/guides/intel-arc-local-ai/", kind: "blog",
      take: "Обзор драйверов, IPEX-LLM/Ollama и дисперсии результатов: что уже работает, а что требует ручной сборки llama.cpp.", priority: 2 },
    { id: "bestllmfor-arc", title: "Battlemage B580: IPEX-LLM против SYCL/llama.cpp", url: "https://bestllmfor.com/best/intel-arc-battlemage/", kind: "blog",
      take: "Сравнение рантаймов на одной карте: 42 против 28 ток/с на 8B — читать перед покупкой Arc, чтобы не разочароваться в первом прогоне.", priority: 2 },
    { id: "krusic-mi25", title: "Разгон MI25 / WX 9100 через PowerPlay", url: "https://krusic22.com/2025/08/09/mi25-overclocking/", kind: "blog",
      take: "Правка таблиц PowerPlay утилитой upp: лимит мощности, напряжение, частоты HBM — рабочий способ снять искусственные ограничения на MI25.", priority: 2 },
    { id: "hiveon-mi25", title: "Hiveon: прошивка BIOS MI25 от WX 9100", url: "https://hiveon.com/forum/t/radeon-instinct-mi25-vbios/65992", kind: "forum",
      take: "Практика перепрошивки MI25 в WX 9100: чем отличаются BIOS, как вернуть карту, что меняется в системе после прошивки.", priority: 2 },
    { id: "itechguides-2080ti", title: "Риски мода VRAM на 2080 Ti 22 ГБ", url: "https://www.itechguides.com/if-nvidia-wont-add-enough-vram-modders-will-22gb-rtx-2080-ti-cards-for-less-than-500/", kind: "press",
      take: "Критический взгляд на кустарные моды: гарантия, качество пайки, контрфакты и почему стабильность зависит от мастерской.", priority: 2 },
    { id: "nvcleanstall-tpu", title: "TechPowerUp NVCleanstall", url: "https://www.techpowerup.com/download/techpowerup-nvcleanstall/", kind: "github",
      take: "Инструмент для сборки драйвера вручную: удаление телеметрии и установка только нужных компонентов — базовый способ завести майнинговую карту под Windows.", priority: 1 }
  ]
};
