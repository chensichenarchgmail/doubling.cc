(function () {
  const TEST_VERIFIED_AT = "2026.08.17";
  const allPrograms = window.SCHOOLS.flatMap((school) =>
    school.programs.map((program) => ({ ...program, school }))
  );

  const html = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

  const applicationPaths = {
    "芬兰": "Studyinfo 与学校项目页；以当轮 programme-specific instructions 为准。",
    "瑞典": "UniversityAdmissions.se 主申请；项目指定作品集或补充材料按学校说明提交。",
    "丹麦": "学校年度 admission call / 申请系统；项目与 studio 开放情况逐年确认。",
    "挪威": "学校年度申请系统；学历资格、作品集与学费身份须在提交前确认。",
    "瑞士": "大学在线申请系统；需要签证者通常适用更早节点。",
    "意大利": "学校国际申请流程；录取后的预注册/注册要求按当轮说明办理。",
    "捷克": "学校在线申请系统；签证申请者需预留更长办理时间。",
    "列支敦士登": "大学在线申请；非 EU/EEA/Swiss 截止与签证要求单独确认。",
    "冰岛": "学校在线申请；学费身份与英语材料按当轮项目页确认。"
  };

  const directionData = [
    {
      key: "spatial",
      en: "Spatial / Interior / Inhabitation",
      cn: "空间、室内与栖居",
      description: "比较不同项目如何从身体、尺度、室内、家具、居住与空间经验进入建筑，而不把 Spatial Design 误解为单纯室内装饰。",
      featured: ["kadk-spatial-design", "kadk-furniture", "kadk-spatial-ecologies", "rca-architecture"]
    },
    {
      key: "sustainability",
      en: "Sustainability",
      cn: "可持续与气候",
      description: "区分环境性能、资源生命周期、社会—生态转型、寒地与极端环境等不同路径，判断“可持续”在各校究竟是一种技术、议题还是设计方法。",
      featured: ["tampere-sustainable", "chalmers-apbs", "polimi-sald", "aa-sed", "rca-environmental", "edinburgh-asd", "polito-sustainability", "gsa-energy-environment"]
    },
    {
      key: "reuse",
      en: "Adaptive Reuse",
      cn: "再利用与更新",
      description: "关注既有建筑如何通过测绘、判断、拆改、材料与新旧关系被重新使用，而不是只把改造当作视觉风格。",
      featured: ["manchester-adaptive-reuse", "polito-sustainability", "polito-heritage", "polimi-architecture", "iuav-architecture", "tampere-sustainable"]
    },
    {
      key: "heritage",
      en: "Heritage",
      cn: "遗产、历史与修复",
      description: "比较保护、修复、历史城市、建筑文化与当代设计之间的不同立场，适合判断意大利及欧洲遗产方向的真实差异。",
      featured: ["polito-heritage", "polimi-adh", "iuav-architecture", "mendrisio-architecture", "cambridge-maus"]
    },
    {
      key: "urban",
      en: "Urban",
      cn: "城市与领土",
      description: "从城市设计、规划、景观、治理与领土研究中区分空间设计项目和研究型项目，避免把所有 Urban 项目视为同一种训练。",
      featured: ["aalto-urban", "chalmers-aud", "lund-sud", "manchester-urbanism", "rca-city-design", "ucl-urban-design", "edinburgh-usd", "aa-housing-urbanism"]
    },
    {
      key: "material",
      en: "Material / Making",
      cn: "材料、建造与制作",
      description: "关注材料实验、构造、木构、原型与设计建造如何成为空间判断的证据，而不只是一组工艺图片。",
      featured: ["lund-daef", "kadk-computation", "kadk-furniture", "liechtenstein-architecture", "ucl-bio-integrated", "aa-emtech", "bas-architecture"]
    },
    {
      key: "computation",
      en: "Computation",
      cn: "计算与数字制造",
      description: "比较计算设计、数字制造、参数化方法与建筑研究的关系，重点判断工具是否真正改变材料、生产和空间结果。",
      featured: ["lund-daef", "kadk-computation", "aa-drl", "aa-emtech", "gsa-digital-creativity", "ucl-architectural-design", "ucl-bio-integrated"]
    },
    {
      key: "social",
      en: "Social / Public",
      cn: "社会、公共性与参与",
      description: "观察住房、公共空间、社会正义、社区参与与政治性议题如何进入具体空间决策，而不是停留在动机陈述。",
      featured: ["chalmers-apbs", "umea-aud", "kadk-critical-sustainability", "kadk-urbanism", "aa-housing-urbanism", "rca-city-design", "sheffield-march", "manchester-march"]
    }
  ];

  function countryKey(country) {
    return Object.keys(applicationPaths).find((key) => country.includes(key));
  }

  function applicationPath(program) {
    const key = countryKey(program.school.country);
    if (key) return applicationPaths[key];
    if (program.school.country.includes("英国")) {
      return "学校在线申请系统；职业资格、作品集与英语要求按 2027 项目页确认。";
    }
    return "学校官方申请系统；以 2027 年度 admission call 为准。";
  }

  function teachingModel(program) {
    const text = `${program.name} ${program.intro} ${program.tags.join(" ")}`.toLowerCase();
    if (/computation|digital|计算|数字制造/.test(text)) return "计算 / 制作导向的设计研究与 studio；具体课程和导师按年度更新。";
    if (/urban|城市|规划|领土/.test(text)) return "城市或跨尺度 studio 与研究并行；需核对项目内的 track / studio 选择。";
    if (/heritage|遗产|修复|保护/.test(text)) return "历史与既有条件研究结合设计 studio；atelier / 课程主题按年度更新。";
    if (/sustain|可持续|气候|生态/.test(text)) return "议题型设计 studio，结合环境、社会或技术研究；年度 studio 主题可能变化。";
    return "以设计 studio 为核心，结合理论、技术或专业课程；具体 studio / atelier 以当年教学目录为准。";
  }

  function trackInfo(program) {
    const isNamedTrack = /–|:|·|and|design|architecture/i.test(program.name);
    return `${isNamedTrack ? `当前数据库按“${program.name}”作为项目或方向记录。` : "当前数据库按项目层级记录。"} Studio、atelier、profile 或 unit 可能逐年调整，申请前须在官方课程与招生页交叉确认。`;
  }

  function projectFromRoute() {
    const params = new URLSearchParams(location.search);
    if (params.get("view") !== "project") return null;
    return allPrograms.find((program) => program.id === params.get("id"));
  }

  function renderDirections() {
    if (app.querySelector('[data-test-render="directions"]')) return;
    app.innerHTML = `
      <div class="page" data-test-render="directions">
        <nav class="breadcrumbs"><a href="./">学校与项目</a><span>/</span><span>方向地图</span></nav>
        <section class="direction-hero">
          <span class="eyebrow">Explore by direction</span>
          <h1>从方向理解学校<span>.</span></h1>
          <p>方向地图不是关键词筛选，而是帮助你判断同一个词在不同学校里对应怎样的设计问题、教学方式与作品集证据。先理解方向，再决定学校。</p>
        </section>
        <section class="direction-grid">
          ${directionData.map((direction, index) => {
            const matched = direction.featured.map((id) => allPrograms.find((program) => program.id === id)).filter(Boolean);
            return `<article class="direction-card">
              <span class="eyebrow">${String(index + 1).padStart(2, "0")} · ${html(direction.en)}</span>
              <h2>${html(direction.cn)}</h2>
              <p>${html(direction.description)}</p>
              <div class="direction-programs">
                ${matched.map((program) => `<a href="?view=project&id=${encodeURIComponent(program.id)}">${html(program.school.cn)} · ${html(program.name)}</a>`).join("")}
              </div>
            </article>`;
          }).join("")}
        </section>
      </div>`;
  }

  function renderGuidance() {
    if (app.querySelector('[data-test-render="guidance"]')) return;
    app.innerHTML = `
      <div class="page" data-test-render="guidance">
        <nav class="breadcrumbs"><a href="./">学校与项目</a><span>/</span><span>Portfolio Guidance</span></nav>
        <section class="guidance-hero">
          <span class="eyebrow">Portfolio guidance</span>
          <h1>作品集不是项目合集<span>.</span></h1>
          <p>辅导从申请方向与现有作品出发，建立项目选择、叙事、图纸和材料之间的连续关系。目标不是统一风格，而是让每个项目清楚显示你的判断。</p>
        </section>
        <section class="guidance-steps">
          <article class="guidance-step"><h2>方向与诊断</h2><p>根据本科训练、项目基础和目标学校，判断哪些内容应该保留、重做或补足，并建立学校—方向—作品证据的对应关系。</p></article>
          <article class="guidance-step"><h2>项目深化</h2><p>从问题、场地与研究推进到空间、结构、材料和环境判断。重点处理完整项目链条，不用最终效果图掩盖过程缺失。</p></article>
          <article class="guidance-step"><h2>叙事与排版</h2><p>统一全册主题与阅读节奏，明确个人贡献、图纸层级和文字作用，让招生评审能快速读懂你的方法及差异。</p></article>
          <article class="guidance-step"><h2>申请适配</h2><p>按学校当年的页数、文件大小、附加文本、面试或任务要求调整版本。不同方向不机械复用同一套动机与排序。</p></article>
        </section>
        <section class="guidance-contact">
          <div><h2>需要一起判断你的作品集？</h2><p>通过小红书发送背景、目标学校和现有项目概况。</p></div>
          <a class="button button-orange" href="?view=contact">查看联系方式 →</a>
        </section>
      </div>`;
  }

  function enhanceHome() {
    const page = app.querySelector(".page");
    const topline = page?.querySelector(".topline");
    if (!page || !topline || page.dataset.testEnhanced) return;
    page.dataset.testEnhanced = "home";
    topline.insertAdjacentHTML("afterend", `
      <section class="decision-intro">
        <div><span class="eyebrow">Application decision system</span><h2>不只查学校，<br>先建立申请判断<span>.</span></h2></div>
        <div><p>从方向、资格、作品集要求、教学方式和数据状态理解项目差异。所有日期与费用都保留核验状态，避免把历史信息当作 2027 已公布内容。</p><div class="decision-links"><a class="button" href="?view=directions">浏览方向地图 →</a><a class="button" href="?view=guidance">Portfolio Guidance →</a></div></div>
      </section>`);
  }

  function enhanceProject(program) {
    const page = app.querySelector(".page");
    const layout = page?.querySelector(".project-layout");
    if (!page || !layout || page.dataset.testEnhanced) return;
    page.dataset.testEnhanced = "project";
    mainContentBlocks(layout).forEach((block) => block.remove());
    layout.insertAdjacentHTML("beforebegin", `
      <section class="data-panel" aria-label="数据状态">
        <div class="data-panel-grid">
          <div class="data-panel-item"><small>数据状态</small><strong>${html(program.status)}</strong></div>
          <div class="data-panel-item"><small>最后核验</small><strong>${TEST_VERIFIED_AT}<br>官方项目 / 招生页面</strong></div>
          <div class="data-panel-item"><small>官方来源</small><strong><a class="compare-source-link" href="${html(program.url)}" target="_blank" rel="noopener noreferrer">打开学校页面 ↗</a></strong></div>
        </div>
        <p class="data-panel-note">“待更新”表示 2027 当轮信息尚未完整发布；历史日期和费用只用于准备排期，不构成当轮承诺。</p>
      </section>`);

    const mainColumn = layout.firstElementChild;
    mainColumn.insertAdjacentHTML("beforeend", `
      <div class="content-block">
        <h2>结构化申请判断</h2>
        <dl class="structured-grid">
          <div class="structured-row"><dt>学历与基本资格</dt><dd>${html(program.requirements)}</dd></div>
          <div class="structured-row"><dt>Portfolio 内容 / 格式</dt><dd>${html(program.portfolio)}</dd></div>
          <div class="structured-row"><dt>评审与面试</dt><dd>${html(program.interview)}</dd></div>
          <div class="structured-row"><dt>教学模式</dt><dd>${html(teachingModel(program))}</dd></div>
          <div class="structured-row"><dt>Track / Studio / Atelier</dt><dd>${html(trackInfo(program))}</dd></div>
          <div class="structured-row"><dt>申请机制</dt><dd>${html(applicationPath(program))}</dd></div>
        </dl>
      </div>`);
  }

  function mainContentBlocks(layout) {
    const movedToStructuredTable = new Set(["作品集重点", "基本资格与材料", "面试要求"]);
    return [...layout.firstElementChild.querySelectorAll(":scope > .content-block")].filter((block) =>
      movedToStructuredTable.has(block.querySelector("h2")?.textContent.trim())
    );
  }

  function enhanceCompare() {
    const page = app.querySelector(".page");
    const table = page?.querySelector(".compare-table");
    if (!page || !table || page.dataset.testEnhanced) return;
    page.dataset.testEnhanced = "compare";
    const selected = [0, 1, 2, 3, 4].map((index) => allPrograms.find((program) => program.id === state.compare[index]));
    const rows = [
      ["教学模式", (program) => teachingModel(program)],
      ["Track / Studio", (program) => trackInfo(program)],
      ["申请机制", (program) => applicationPath(program)],
      ["数据状态", (program) => `${program.status}；核验 ${TEST_VERIFIED_AT}`],
      ["官方来源", (program) => `<a class="compare-source-link" href="${html(program.url)}" target="_blank" rel="noopener noreferrer">学校官方页面 ↗</a>`, true]
    ];
    table.insertAdjacentHTML("beforeend", rows.map(([label, getter, raw]) => `
      <div class="compare-row is-decision-row"><div class="compare-label">${label}</div>${selected.map((program) => `<div class="compare-cell">${program ? (raw ? getter(program) : html(getter(program))) : "—"}</div>`).join("")}</div>`).join(""));
  }

  function setActiveNav(view) {
    document.querySelectorAll("[data-test-view]").forEach((link) => {
      link.classList.toggle("active", link.dataset.testView === view);
    });
  }

  function applyEnhancements() {
    const params = new URLSearchParams(location.search);
    const view = params.get("view") || "home";
    setActiveNav(view);
    if (view === "directions") renderDirections();
    else if (view === "guidance") renderGuidance();
    else if (view === "project") {
      const program = projectFromRoute();
      if (program) enhanceProject(program);
    } else if (view === "compare") enhanceCompare();
    else if (view === "home") enhanceHome();
  }

  const observer = new MutationObserver(() => applyEnhancements());
  observer.observe(app, { childList: true });
  window.addEventListener("popstate", () => setTimeout(applyEnhancements, 0));
  applyEnhancements();
}());
