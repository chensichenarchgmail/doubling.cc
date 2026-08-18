const compareByEnglishName = (a, b) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" });
const schools = window.SCHOOLS
  .map((school) => ({
    ...school,
    programs: [...school.programs].sort(compareByEnglishName)
  }))
  .sort(compareByEnglishName);
const programs = schools.flatMap((school) =>
  school.programs.map((program) => ({ ...program, school }))
);
const app = document.querySelector("#app");
const state = {
  view: localStorage.getItem("doubling-test-view") || "schools",
  query: "",
  country: "全部",
  direction: "全部",
  language: "全部",
  compare: JSON.parse(localStorage.getItem("doubling-test-compare") || "[]").slice(0, 5),
  portfolio: JSON.parse(localStorage.getItem("doubling-test-portfolio") || "[]"),
  abilities: JSON.parse(localStorage.getItem("doubling-test-abilities") || "[]"),
  timeline: JSON.parse(localStorage.getItem("doubling-test-timeline") || "[]").slice(0, 8),
  differencesOnly: false
};

const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));
const href = (view, id = "") => `?view=${view}${id ? `&id=${encodeURIComponent(id)}` : ""}`;
const programById = (id) => programs.find((item) => item.id === id);
const schoolById = (id) => schools.find((item) => item.id === id);

const directionGroups = [
  {
    label: "建筑设计与实践",
    keywords: ["建筑设计", "建筑实践", "专业实践", "综合训练", "小班", "小班工作室", "设计建造"]
  },
  {
    label: "城市、社会与公共空间",
    keywords: ["城市", "城市研究", "城市设计", "规划", "公共性", "公共政策", "社会参与", "社会生态", "社会空间", "社会转型", "政治建筑"]
  },
  {
    label: "可持续与环境",
    keywords: ["可持续", "批判性可持续", "气候", "气候适应", "环境性能", "寒地建筑", "极端环境", "地域"]
  },
  {
    label: "遗产、历史与更新",
    keywords: ["遗产", "遗产改造", "修复", "再利用", "更新", "建筑历史", "历史城市", "历史理论"]
  },
  {
    label: "技术、建造与材料",
    keywords: ["技术整合", "建造", "木构", "材料实验", "材料研究", "数字制造", "计算设计", "设计制作"]
  },
  {
    label: "实验、研究与跨学科",
    keywords: ["实验建筑", "原型", "批判实践", "设计批评", "设计研究", "自主研究", "建筑文化", "艺术实践", "跨学科"]
  }
];

function programDirections(program) {
  const matches = directionGroups
    .filter((group) => program.tags.some((tag) => group.keywords.includes(tag)))
    .map((group) => group.label);
  return matches.length ? matches : ["建筑设计与实践"];
}

function programLanguage(program) {
  const language = program.language.trim();
  if (/^英语(?:$| ·)/.test(language)) return "英语授课";
  if (language.includes("英语路径") || language.includes("英语 B2 路径")) return "英语路径";
  return "其他语言 / 待核实";
}

function navigate(view, id = "", replace = false) {
  const url = new URL(location.href);
  url.search = "";
  if (view !== "home") url.searchParams.set("view", view);
  if (id) url.searchParams.set("id", id);
  history[replace ? "replaceState" : "pushState"]({}, "", url);
  renderRoute();
}

function headerControls() {
  document.querySelectorAll("[data-home]").forEach((item) => {
    item.onclick = (event) => { event.preventDefault(); navigate("home"); };
  });
  document.querySelectorAll("[data-open-compare]").forEach((item) => {
    item.onclick = () => navigate("compare");
  });
  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.classList.toggle("active-nav", new URLSearchParams(location.search).get("view") === item.dataset.nav);
    item.onclick = (event) => { event.preventDefault(); navigate(item.dataset.nav); };
  });
  document.querySelectorAll("[data-contact]").forEach((item) => {
    item.onclick = (event) => { event.preventDefault(); navigate("contact"); };
  });
}

function updateCompareUI() {
  localStorage.setItem("doubling-test-compare", JSON.stringify(state.compare));
  document.querySelectorAll("[data-compare-count]").forEach((item) => item.textContent = state.compare.length);
  const dock = document.querySelector("[data-compare-dock]");
  dock.hidden = state.compare.length === 0 || new URLSearchParams(location.search).get("view") === "compare";
  document.querySelector("[data-dock-label]").textContent = `已选择 ${state.compare.length} / 5`;
  document.querySelector("[data-compare-mini]").innerHTML = state.compare.map((id) => {
    const p = programById(id);
    return p ? `<span class="compare-mini">${esc(p.school.cn)} · ${esc(p.name)} <button type="button" data-remove="${id}" aria-label="移除">×</button></span>` : "";
  }).join("");
  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.onclick = () => {
      state.compare = state.compare.filter((id) => id !== button.dataset.remove);
      updateCompareUI();
      syncCompareButtons();
    };
  });
}

function toggleCompare(id) {
  if (state.compare.includes(id)) state.compare = state.compare.filter((item) => item !== id);
  else if (state.compare.length < 5) state.compare.push(id);
  else {
    const dock = document.querySelector("[data-compare-dock]");
    dock.animate([{ transform: "translateY(0)" }, { transform: "translateY(-8px)" }, { transform: "translateY(0)" }], { duration: 260 });
    return;
  }
  updateCompareUI();
  syncCompareButtons();
}

function syncCompareButtons() {
  document.querySelectorAll("[data-compare]").forEach((button) => {
    const selected = state.compare.includes(button.dataset.compare);
    button.classList.toggle("selected", selected);
    button.textContent = selected ? "已加入比较" : "加入比较";
    button.setAttribute("aria-pressed", selected);
  });
}

function bindCompareButtons() {
  document.querySelectorAll("[data-compare]").forEach((button) => {
    button.onclick = (event) => { event.preventDefault(); event.stopPropagation(); toggleCompare(button.dataset.compare); };
  });
  syncCompareButtons();
}

function programCard(program) {
  return `
    <article class="program-card">
      <div class="program-card-head">
        <span class="school-label">${esc(program.school.cn)} · ${esc(program.school.city)}</span>
        <span class="status">${esc(program.status)}</span>
      </div>
      <h2>${esc(program.name)}</h2>
      <span class="school-label">${esc(program.degree)}</span>
      <div class="program-facts">
        <div class="fact"><small>学制</small><span>${esc(program.duration)}</span></div>
        <div class="fact"><small>语言</small><span>${esc(program.language)}</span></div>
        <div class="fact"><small>学费</small><span>${esc(program.tuition)}</span></div>
        <div class="fact"><small>申请</small><span>${esc(program.deadline)}</span></div>
      </div>
      <div class="card-actions">
        <a class="text-link" href="${href("project", program.id)}" data-link="project" data-id="${program.id}">查看项目 →</a>
        <button class="compare-toggle" type="button" data-compare="${program.id}">加入比较</button>
      </div>
    </article>`;
}

function renderHome() {
  const countries = ["全部", ...new Set(schools.map((s) => s.country))];
  const directions = ["全部", ...decisionDirections.map((group) => group.label)];
  const languages = ["全部", "英语授课", "英语路径", "其他语言 / 待核实"];
  app.innerHTML = `
    <div class="page">
      <section class="topline">
        <h1>建筑申请决策<span>.</span></h1>
        <p class="topline-meta">2027 秋季入学准备版<br>${schools.length} 所学校 · ${programs.length} 个建筑与城市方向</p>
      </section>
      <section class="quick-entry">
        <a class="quick-card" href="${href("directions")}" data-link="directions"><span class="eyebrow">01 Explore</span><strong>从方向理解项目</strong><p>比较不同学校如何定义同一个方向。</p></a>
        <a class="quick-card" href="${href("portfolio")}" data-link="portfolio"><span class="eyebrow">02 Match</span><strong>从作品集反向找项目</strong><p>显示透明的匹配理由，不预测录取。</p></a>
        <a class="quick-card" href="${href("diagnosis")}" data-link="diagnosis"><span class="eyebrow">03 Diagnose</span><strong>检查证据结构</strong><p>研究、图纸、材料、过程与个人贡献。</p></a>
        <a class="quick-card" href="${href("timeline")}" data-link="timeline"><span class="eyebrow">04 Plan</span><strong>生成申请时间线</strong><p>汇总项目节点与提交清单。</p></a>
      </section>
      <section class="filters" aria-label="筛选">
        <input class="search" type="search" placeholder="搜索学校、城市、项目或方向" aria-label="搜索" value="${esc(state.query)}" data-search />
        <select class="select" aria-label="地区或国家" data-country>${countries.map((c) => `<option value="${esc(c)}" ${c === state.country ? "selected" : ""}>${c === "全部" ? "地区 / 国家：全部" : esc(c)}</option>`)}</select>
        <select class="select" aria-label="项目方向" data-direction>${directions.map((c) => `<option value="${esc(c)}" ${c === state.direction ? "selected" : ""}>${c === "全部" ? "项目方向：全部" : esc(c)}</option>`)}</select>
        <select class="select" aria-label="授课语言" data-language>${languages.map((c) => `<option value="${esc(c)}" ${c === state.language ? "selected" : ""}>${c === "全部" ? "授课语言：全部" : esc(c)}</option>`)}</select>
        <div class="view-toggle" aria-label="显示方式">
          <button type="button" data-view="schools" class="${state.view === "schools" ? "active" : ""}">学校</button>
          <button type="button" data-view="programs" class="${state.view === "programs" ? "active" : ""}">项目</button>
        </div>
      </section>
      <div class="result-line"><span data-result></span><span>可选择最多 5 个项目比较</span></div>
      <section data-results></section>
    </div>`;

  const filter = () => {
    const query = state.query.trim().toLowerCase();
    const selectedSchools = schools.filter((school) => {
      const countryMatch = state.country === "全部" || school.country === state.country;
      const relevantPrograms = school.programs.filter((program) => {
        const directionMatch = state.direction === "全部" || decisionDirectionsFor(program).some((group) => group.label === state.direction);
        const languageMatch = state.language === "全部" || programLanguage(program) === state.language;
        const haystack = [school.name, school.cn, school.city, school.country, school.position, program.name, program.degree, ...program.tags].join(" ").toLowerCase();
        return directionMatch && languageMatch && (!query || haystack.includes(query));
      });
      return countryMatch && relevantPrograms.length > 0;
    });
    const selectedPrograms = programs.filter((program) => {
      const countryMatch = state.country === "全部" || program.school.country === state.country;
      const directionMatch = state.direction === "全部" || decisionDirectionsFor(program).some((group) => group.label === state.direction);
      const languageMatch = state.language === "全部" || programLanguage(program) === state.language;
      const haystack = [program.school.name, program.school.cn, program.school.city, program.name, program.degree, program.intro, ...program.tags].join(" ").toLowerCase();
      return countryMatch && directionMatch && languageMatch && (!query || haystack.includes(query));
    });
    const results = document.querySelector("[data-results]");
    document.querySelector("[data-result]").textContent = state.view === "schools" ? `${selectedSchools.length} 所学校` : `${selectedPrograms.length} 个项目`;
    if (state.view === "schools") {
      results.className = "school-grid";
      results.innerHTML = selectedSchools.length ? selectedSchools.map((school, index) => `
        <a class="school-row" href="${href("school", school.id)}" data-link="school" data-id="${school.id}">
          <span class="school-index">${String(index + 1).padStart(2, "0")}</span>
          <div class="school-name">
            <h2>${esc(school.name)}</h2>
            <p>${esc(school.cn)}</p>
          </div>
          <p class="school-position">${esc(school.position)}<span class="program-count">${school.programs.length} 个项目方向 →</span></p>
          <p class="school-location">${esc(school.country)}<br>${esc(school.city)}</p>
        </a>`).join("") : `<p class="empty">没有找到匹配的学校。</p>`;
    } else {
      results.className = "program-grid";
      results.innerHTML = selectedPrograms.length ? selectedPrograms.map(programCard).join("") : `<p class="empty">没有找到匹配的项目。</p>`;
      bindCompareButtons();
    }
    bindInternalLinks();
  };
  document.querySelector("[data-search]").oninput = (event) => { state.query = event.target.value; filter(); };
  document.querySelector("[data-country]").onchange = (event) => { state.country = event.target.value; filter(); };
  document.querySelector("[data-direction]").onchange = (event) => { state.direction = event.target.value; filter(); };
  document.querySelector("[data-language]").onchange = (event) => { state.language = event.target.value; filter(); };
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.onclick = () => {
      state.view = button.dataset.view;
      localStorage.setItem("doubling-test-view", state.view);
      document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
      filter();
    };
  });
  filter();
}

function renderSchool(school) {
  app.innerHTML = `
    <div class="page">
      <nav class="breadcrumbs"><a href="./" data-link="home">学校与项目</a><span>/</span><span>${esc(school.cn)}</span></nav>
      <section class="detail-hero">
        <div><span class="eyebrow">${esc(school.country)} · ${esc(school.city)}</span><h1>${esc(school.name)}</h1><p class="cn-name">${esc(school.cn)}</p></div>
        <div class="hero-side"><span class="eyebrow">学校定位</span><p>${esc(school.position)}</p><div class="location-line">${school.programs.length} 个可查看项目方向</div></div>
      </section>
      <div class="section-title"><h2>项目方向</h2><span>${school.programs.length} programmes</span></div>
      <section class="school-program-list">
        ${school.programs.map((program) => `
          <article class="school-program">
            <div><h3><a href="${href("project", program.id)}" data-link="project" data-id="${program.id}">${esc(program.name)} →</a></h3><p>${esc(program.degree)}</p></div>
            <span>${esc(program.duration)}<br>${esc(program.language)}</span>
            <span>${esc(program.tuition)}<br>${esc(program.deadline)}</span>
            <button class="compare-toggle" type="button" data-compare="${program.id}">加入比较</button>
          </article>`).join("")}
      </section>
    </div>`;
  bindInternalLinks();
  bindCompareButtons();
}

function renderProject(program) {
  app.innerHTML = `
    <div class="page">
      <nav class="breadcrumbs"><a href="./" data-link="home">学校与项目</a><span>/</span><a href="${href("school", program.school.id)}" data-link="school" data-id="${program.school.id}">${esc(program.school.cn)}</a><span>/</span><span>${esc(program.name)}</span></nav>
      <section class="project-hero">
        <div><span class="eyebrow">${esc(program.school.country)} · ${esc(program.school.city)}</span><h1>${esc(program.name)}</h1><p class="degree">${esc(program.school.name)} · ${esc(program.degree)}</p></div>
      </section>
      <section class="project-factbar">
        <div class="fact"><small>学制</small><span>${esc(program.duration)}</span></div>
        <div class="fact"><small>授课语言</small><span>${esc(program.language)}</span></div>
        <div class="fact"><small>非欧盟学费</small><span>${esc(program.tuition)}</span></div>
        <div class="fact"><small>申请节点</small><span>${esc(program.deadline)}</span></div>
      </section>
      <section class="project-layout">
        <div>
          <div class="content-block"><h2>主要方向</h2><p>${esc(program.intro)}</p><div class="tags">${program.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div></div>
          <div class="content-block"><h2>适合怎样的申请者</h2><p>${esc(program.suitable)}</p></div>
          <div class="content-block"><h2>作品集重点</h2><p>${esc(program.portfolio)}</p></div>
          <div class="content-block"><h2>基本资格与材料</h2><p>${esc(program.requirements)}</p></div>
          <div class="content-block"><h2>面试要求</h2><p>${esc(program.interview)}</p></div>
        </div>
        <aside class="project-side">
          <button class="button button-orange" type="button" data-compare="${program.id}">加入比较</button>
          <a class="button" href="${href("school", program.school.id)}" data-link="school" data-id="${program.school.id}">查看学校</a>
          <div class="warning"><span class="eyebrow">申请判断</span><p>${esc(program.warning)}</p></div>
          <p class="official-link"><a href="${esc(program.url)}" target="_blank" rel="noopener noreferrer">打开学校官方项目页 ↗</a></p>
        </aside>
      </section>
    </div>`;
  bindInternalLinks();
  bindCompareButtons();
}

function renderContact() {
  const xhsUrl = "https://xhslink.cn/m/5hU8gL6OSXb";
  app.innerHTML = `
    <div class="page">
      <nav class="breadcrumbs"><a href="./" data-link="home">学校与项目</a><span>/</span><span>联系</span></nav>
      <section class="contact-heading">
        <span class="eyebrow">Contact</span>
        <h1>联系<span>.</span></h1>
        <p>如需咨询建筑设计硕士选校、项目方向或作品集，请通过小红书主页联系。</p>
      </section>
      <section class="contact-card">
        <div>
          <span class="eyebrow">小红书</span>
          <h2>小红书主页</h2>
          <a class="contact-url" href="${xhsUrl}" target="_blank" rel="noopener noreferrer">${xhsUrl}</a>
        </div>
        <a class="button button-orange contact-button" href="${xhsUrl}" target="_blank" rel="noopener noreferrer">打开小红书主页 ↗</a>
      </section>
    </div>`;
  bindInternalLinks();
}

function renderCompare() {
  const slots = [0, 1, 2, 3, 4];
  const rows = [
    ["学制", "duration"], ["授课语言", "language"], ["非欧盟学费", "tuition"], ["申请节点", "deadline"],
    ["主要方向", "intro"], ["适合申请者", "suitable"], ["作品集重点", "portfolio"], ["资格与材料", "requirements"], ["面试要求", "interview"], ["需要注意", "warning"]
  ];
  const selected = slots.map((i) => programById(state.compare[i]));
  const options = (current) => `<option value="">选择一个项目</option>${schools.map((school) =>
    `<optgroup label="${esc(school.cn)}">${school.programs.map((program) =>
      `<option value="${program.id}" ${current?.id === program.id ? "selected" : ""}>${esc(program.name)}</option>`).join("")}</optgroup>`
  ).join("")}`;
  app.innerHTML = `
    <div class="page">
      <nav class="breadcrumbs"><a href="./" data-link="home">学校与项目</a><span>/</span><span>项目比较</span></nav>
      <section class="compare-heading"><span class="eyebrow">最多选择五个项目</span><h1>项目比较<span style="color:var(--orange)">.</span></h1><p>从方向、资格、费用和作品集重点逐项判断，不以学校排名替代项目匹配。</p></section>
      <section class="compare-selectors">
        ${slots.map((index) => `<div class="selector-slot"><label>项目 ${index + 1}</label><select data-slot="${index}">${options(selected[index])}</select></div>`).join("")}
      </section>
      <section class="compare-table">
        <div class="compare-row">
          <div class="compare-label">项目</div>
          ${selected.map((program) => `<div class="compare-cell compare-name">${program ? `<span class="eyebrow">${esc(program.school.cn)}</span><h2>${esc(program.name)}</h2><p>${esc(program.degree)}</p><a class="text-link" href="${href("project", program.id)}" data-link="project" data-id="${program.id}">查看详情 →</a>` : `<span style="color:var(--muted)">尚未选择</span>`}</div>`).join("")}
        </div>
        ${rows.map(([label, key]) => `<div class="compare-row"><div class="compare-label">${label}</div>${selected.map((program) => `<div class="compare-cell">${program ? esc(program[key]) : "—"}</div>`).join("")}</div>`).join("")}
      </section>
    </div>`;
  document.querySelectorAll("[data-slot]").forEach((select) => {
    select.onchange = () => {
      const index = Number(select.dataset.slot);
      const next = [...state.compare];
      const value = select.value;
      if (value && next.some((id, i) => id === value && i !== index)) {
        select.value = state.compare[index] || "";
        return;
      }
      if (value) next[index] = value; else next.splice(index, 1);
      state.compare = next.filter(Boolean).slice(0, 5);
      updateCompareUI();
      renderCompare();
    };
  });
  bindInternalLinks();
}

function bindInternalLinks() {
  document.querySelectorAll("[data-link]").forEach((link) => {
    link.onclick = (event) => {
      event.preventDefault();
      navigate(link.dataset.link, link.dataset.id || "");
    };
  });
}

/* --- Decision-system test modules --- */
const decisionDirections = [
  { id:"space", label:"空间、室内与居住", short:"Space / Interior / Inhabitation", tags:["空间设计","室内","住房","家具设计"], question:"空间如何被身体感知、占用并形成日常生活？", evidence:"尺度、动线、剖面、材料细部与使用情境。" },
  { id:"architecture", label:"建筑、类型与形式", short:"Architecture / Type / Form", tags:["建筑设计","公共建筑","建筑实践","专业实践"], question:"类型、构成与空间秩序如何回应具体问题？", evidence:"完整项目、平剖关系、构造与清楚的设计判断。" },
  { id:"climate", label:"可持续与气候", short:"Sustainability / Climate", tags:["可持续","批判性可持续","气候","气候适应","环境性能","低碳","极端环境"], question:"环境约束如何真正改变空间、材料和生命周期？", evidence:"性能依据、季节策略、资源逻辑与设计后果。" },
  { id:"transformation", label:"改造与再利用", short:"Transformation / Adaptive Reuse", tags:["再利用","更新","城市转型","遗产改造","修复"], question:"既有建筑如何通过判断、取舍和介入获得新的生命？", evidence:"测绘、现状诊断、介入层次与新旧关系。" },
  { id:"heritage", label:"遗产、历史与理论", short:"Heritage / History", tags:["遗产","遗产改造","修复","建筑历史","历史城市","历史理论","建筑文化"], question:"历史不是背景时，设计如何与时间和文化证据对话？", evidence:"档案、类型分析、价值判断与精确介入。" },
  { id:"urban", label:"城市、地域与公共空间", short:"Urban / Territory", tags:["城市","城市研究","城市设计","规划","跨尺度","公共性","公共政策"], question:"建筑如何进入更大的城市关系、治理与公共生活？", evidence:"多尺度图纸、田野研究、利益相关者与空间规则。" },
  { id:"material", label:"材料、构造与制作", short:"Material / Tectonics", tags:["建造","材料","材料建造","材料研究","制作","设计制作","设计建造","木构","足尺建造","原型"], question:"材料与制作如何成为设计方法，而不是最后的表皮？", evidence:"模型、原型、节点、试验过程与失败记录。" },
  { id:"computation", label:"计算与数字制造", short:"Computation / Fabrication", tags:["计算设计","数字制造","机器人制造","人工智能"], question:"数字工具如何产生可解释的空间、材料或建造结果？", evidence:"规则、代码或流程、制造约束与实体结果。" },
  { id:"social", label:"社会、公共与批判实践", short:"Social / Political Architecture", tags:["社会参与","社会生态","社会空间","社会议题","社会转型","政治建筑","批判实践"], question:"谁在使用、决定并承担空间改变带来的后果？", evidence:"真实主体、调研方法、协作过程与空间回应。" },
  { id:"ecology", label:"景观与空间生态", short:"Landscape / Ecology", tags:["景观","空间生态","生物材料","生物设计","资源流","工业共生"], question:"建筑、景观与生态过程如何形成跨尺度系统？", evidence:"时间过程、资源流、生态关系与场地策略。" }
];

const portfolioTypes = [
  ["housing","居住 / Housing","住宅、日常生活",["住房","空间设计","室内"]], ["public","公共建筑","文化、教育、公共性",["公共建筑","公共性","建筑设计"]],
  ["reuse","改造再利用","既有建筑、更新",["再利用","更新","遗产改造","修复"]], ["urban","城市设计","多尺度、规划",["城市","城市设计","规划","跨尺度"]],
  ["material","材料原型","模型、足尺、制作",["材料","原型","制作","设计建造","足尺建造"]], ["computational","计算项目","参数化、制造、机器人",["计算设计","数字制造","机器人制造","人工智能"]],
  ["social","社会性建筑","参与、公共议题",["社会参与","社会空间","社会议题","政治建筑"]], ["interior","室内 / 空间","身体、尺度、家具",["空间设计","室内","家具设计"]],
  ["heritage","历史与遗产","修复、理论、档案",["遗产","建筑历史","历史理论","历史城市"]], ["landscape","景观与生态","场地、资源流",["景观","空间生态","资源流","生物设计"]],
  ["climate","气候与环境","低碳、性能、适应",["可持续","气候","气候适应","环境性能","低碳"]], ["research","设计研究","批判、实验、跨学科",["设计研究","批判实践","实验建筑","跨学科","自主研究"]]
].map(([id,label,hint,keys]) => ({id,label,hint,keys}));

const abilityTypes = [
  ["site","场地研究","调研"],["user","使用者研究","调研"],["programme","功能与问题推理","空间"],["plans","平面","表达"],
  ["sections","剖面","表达"],["structure","结构逻辑","建造"],["material","材料与节点","建造"],["environment","环境策略","建造"],
  ["process","设计过程","过程"],["models","实体模型","过程"],["prototype","1:1 原型","过程"],["contribution","个人贡献说明","申请"],
  ["survey","既有建筑测绘","调研"],["detail","细部","建造"],["urban","城市尺度","空间"],["writing","研究写作","申请"]
].map(([id,label,group]) => ({id,label,group}));

const programmeText = (p) => [p.name,p.degree,p.intro,p.suitable,p.portfolio,p.requirements,...p.tags].join(" ").toLowerCase();
const decisionDirectionsFor = (p) => decisionDirections.filter((d) => d.tags.some((tag) => p.tags.includes(tag)));
function decisionTeaching(p) {
  const id = p.school.id;
  if (id === "mendrisio") return { model:"Atelier-based", mechanism:"申请 Architecture；入学后进入 Atelier 体系", when:"方向主要通过 Atelier 展开" };
  if (id === "kadk") return { model:"Pathway-based", mechanism:"直接申请具体 MA Architecture pathway", when:"申请时确定方向" };
  if (id === "aarhus") return { model:"Studio-based", mechanism:"申请 MA Architecture，并表达 studio 兴趣", when:"录取后仍有 studio selection" };
  if (id === "aa") return { model:"Programme / unit-based", mechanism:"直接申请具体 programme", when:"申请时确定 programme" };
  if (id === "ucl") return { model:"Programme / unit-based", mechanism:"直接申请 programme；部分课程内部采用 unit / studio", when:"申请时确定 programme" };
  if (["kth","aho","umea","bas","chalmers","lund","iceland"].includes(id)) return { model:"Studio-based", mechanism:"申请 programme，在课程中进入 studio / profile", when:"通常在入学后或课程阶段选择" };
  if (["polito","polimi","gsa","manchester","rca","edinburgh"].includes(id)) return { model:"Programme / track-based", mechanism:"直接申请当前具体 programme 或 track", when:"申请阶段确定主要方向" };
  return { model:"Programme-based", mechanism:"直接申请 programme", when:"具体 studio / 选修以当年课程为准" };
}
function decisionFreshness(p) {
  if (/2027 已公布|2027\./.test(p.status + p.deadline)) return { label:"2027 CONFIRMED", cls:"confirmed" };
  if (/待更新|待公布|待确认/.test(p.status + p.deadline)) return { label:"2027 PENDING", cls:"pending" };
  return { label:"LATEST PUBLIC", cls:"" };
}
const portfolioSignals = (p) => portfolioTypes.filter((item) => item.keys.some((key) => programmeText(p).includes(key.toLowerCase()))).slice(0,6).map((item) => item.label);
const moduleHero = (eyebrow,title,intro) => `<section class="module-hero"><div><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}<span>.</span></h1></div><p>${esc(intro)}</p></section>`;

function programCard(program) {
  const fresh = decisionFreshness(program), teaching = decisionTeaching(program);
  return `<article class="program-card"><div class="program-card-head"><span class="school-label">${esc(program.school.cn)} · ${esc(program.school.city)}</span><span class="status-badge ${fresh.cls}">${fresh.label}</span></div><h2>${esc(program.name)}</h2><span class="school-label">${esc(program.degree)}</span><div class="program-facts"><div class="fact"><small>教学</small><span>${esc(teaching.model)}</span></div><div class="fact"><small>语言</small><span>${esc(program.language)}</span></div><div class="fact"><small>学费</small><span>${esc(program.tuition)}</span></div><div class="fact"><small>申请</small><span>${esc(program.deadline)}</span></div></div><div class="card-actions"><a class="text-link" href="${href("project",program.id)}" data-link="project" data-id="${program.id}">查看项目 →</a><button class="compare-toggle" type="button" data-compare="${program.id}">加入比较</button></div></article>`;
}

function renderDirections(selectedId="") {
  const selected = decisionDirections.find((d) => d.id === selectedId);
  if (selected) {
    const matches = programs.filter((p) => decisionDirectionsFor(p).some((d) => d.id === selected.id));
    app.innerHTML = `<div class="page"><nav class="breadcrumbs"><a href="${href("directions")}" data-link="directions">方向地图</a><span>/</span><span>${esc(selected.label)}</span></nav>${moduleHero(selected.short,selected.label,selected.question)}<section class="direction-definition"><div class="definition-box"><h3>这个方向在问什么</h3><p>${esc(selected.question)}</p></div><div class="definition-box"><h3>作品集应提供什么证据</h3><p>${esc(selected.evidence)}</p></div></section><div class="section-title"><h2>值得继续研究的项目</h2><span>${matches.length} programmes</span></div><section class="program-grid">${matches.map(programCard).join("")}</section></div>`;
    bindInternalLinks(); bindCompareButtons(); return;
  }
  app.innerHTML = `<div class="page">${moduleHero("Explore by direction","方向地图","不是搜索名称里是否出现某个词，而是比较不同学校如何定义空间、技术、社会、材料与环境问题。")}<p class="module-note">方向归类来自项目标签与公开课程描述，用于发现值得研究的项目，不代替资格审核。</p><section class="direction-grid">${decisionDirections.map((d,i) => { const count=programs.filter((p)=>decisionDirectionsFor(p).some((x)=>x.id===d.id)).length; return `<a class="direction-card" href="${href("directions",d.id)}" data-link="directions" data-id="${d.id}"><span class="direction-no">${String(i+1).padStart(2,"0")}</span><h2>${esc(d.label)}</h2><p>${esc(d.question)}</p><div class="direction-foot"><span class="direction-examples">${esc(d.short)}</span><span class="direction-count">${count} 项目 →</span></div></a>`; }).join("")}</section></div>`;
  bindInternalLinks();
}

function renderProject(program) {
  const t=decisionTeaching(program), fresh=decisionFreshness(program), dirs=decisionDirectionsFor(program), signals=portfolioSignals(program);
  app.innerHTML = `<div class="page"><nav class="breadcrumbs"><a href="./" data-link="home">学校与项目</a><span>/</span><a href="${href("school",program.school.id)}" data-link="school" data-id="${program.school.id}">${esc(program.school.cn)}</a><span>/</span><span>${esc(program.name)}</span></nav><section class="project-hero"><div><span class="status-badge ${fresh.cls}">${fresh.label}</span><h1>${esc(program.name)}</h1><p class="degree">${esc(program.school.name)} · ${esc(program.degree)}</p></div><p class="project-summary">${esc(program.intro)}</p></section><section class="project-factbar"><div class="fact"><small>学制</small><span>${esc(program.duration)}</span></div><div class="fact"><small>授课语言</small><span>${esc(program.language)}</span></div><div class="fact"><small>非欧盟学费</small><span>${esc(program.tuition)}</span></div><div class="fact"><small>申请节点</small><span>${esc(program.deadline)}</span></div></section><section class="project-meta-grid"><div class="meta-card"><small>Teaching model</small><strong>${esc(t.model)}</strong><p>${esc(t.when)}</p></div><div class="meta-card"><small>Application mechanism</small><strong>${esc(t.mechanism)}</strong></div><div class="meta-card"><small>Directions</small><strong>${esc(dirs.map((d)=>d.label).join(" / ") || "建筑综合训练")}</strong></div></section><section class="project-layout"><div>
    <div class="numbered-block"><span class="num">01</span><div><h2>Overview</h2><p>${esc(program.school.position)}</p></div></div>
    <div class="numbered-block"><span class="num">02</span><div><h2>What you study</h2><p>${esc(program.intro)}</p><div class="tags">${program.tags.map((tag)=>`<span class="tag">${esc(tag)}</span>`).join("")}</div></div></div>
    <div class="numbered-block"><span class="num">03</span><div><h2>Admission</h2><p>${esc(program.requirements)}</p><p style="margin-top:14px"><strong>面试：</strong>${esc(program.interview)}</p></div></div>
    <div class="numbered-block"><span class="num">04</span><div><h2>Portfolio</h2><p>${esc(program.portfolio)}</p><div class="tags">${signals.map((s)=>`<span class="tag">+ ${esc(s)}</span>`).join("")}</div></div></div>
    <div class="numbered-block"><span class="num">05</span><div><h2>Fit</h2><p>${esc(program.suitable)}</p></div></div>
    <div class="numbered-block"><span class="num">06</span><div><h2>Sources & status</h2><p>${esc(program.status)}。数据库核验于 2026.08.17；带“待更新”的日期、费用与格式必须在当轮网申开放后复核。</p><div class="source-stack"><a href="${esc(program.url)}" target="_blank" rel="noopener noreferrer">学校官方项目页 ↗</a></div></div></div>
    </div><aside class="project-side"><button class="button button-orange" type="button" data-compare="${program.id}">加入比较</button><button class="button" type="button" data-add-timeline="${program.id}">加入时间线</button><div class="warning"><span class="eyebrow">申请判断</span><p>${esc(program.warning)}</p></div></aside></section></div>`;
  bindInternalLinks(); bindCompareButtons(); document.querySelector("[data-add-timeline]").onclick=()=>{ if(!state.timeline.includes(program.id)&&state.timeline.length<8) state.timeline.push(program.id); localStorage.setItem("doubling-test-timeline",JSON.stringify(state.timeline)); navigate("timeline"); };
}

function matchPortfolio() {
  const selected=portfolioTypes.filter((item)=>state.portfolio.includes(item.id));
  return programs.map((program)=>{ const text=programmeText(program), reasons=selected.filter((item)=>item.keys.some((key)=>text.includes(key.toLowerCase()))); return {program,reasons,score:Math.round(reasons.length/Math.max(selected.length,1)*100)}; }).filter((x)=>x.reasons.length).sort((a,b)=>b.score-a.score||compareByEnglishName(a.program,b.program)).slice(0,15);
}
function renderPortfolio() {
  const matches=matchPortfolio();
  app.innerHTML=`<div class="page">${moduleHero("Portfolio ↔ School","作品集反向匹配","先选择已经存在的项目证据，再查看哪些项目值得进一步研究。结果不是录取概率。")}<section class="choice-grid">${portfolioTypes.map((item)=>`<button class="choice ${state.portfolio.includes(item.id)?"selected":""}" type="button" data-choice="${item.id}"><strong>${esc(item.label)}</strong><small>${esc(item.hint)}</small></button>`).join("")}</section><div class="tool-actions"><p>项目描述或标签与所选内容重叠即计入，并显示具体匹配理由。</p><button class="button" type="button" data-clear>清空</button></div><div class="section-title"><h2>匹配结果</h2><span>${matches.length?`前 ${matches.length} 项`:"等待选择"}</span></div><section class="match-list">${matches.length?matches.map(({program,reasons,score})=>`<article class="match-row"><div class="match-score">${score}<small>%</small></div><div><h3>${esc(program.school.cn)}<br>${esc(program.name)}</h3><p>${esc(decisionTeaching(program).model)}</p></div><div><p>${esc(program.suitable)}</p><div class="reason-tags">${reasons.map((r)=>`<span>匹配：${esc(r.label)}</span>`).join("")}</div></div><a class="text-link" href="${href("project",program.id)}" data-link="project" data-id="${program.id}">查看项目 →</a></article>`).join(""):`<p class="empty">选择至少一项作品集内容后生成结果。</p>`}</section></div>`;
  document.querySelectorAll("[data-choice]").forEach((button)=>{button.onclick=()=>{const id=button.dataset.choice;state.portfolio=state.portfolio.includes(id)?state.portfolio.filter((x)=>x!==id):[...state.portfolio,id];localStorage.setItem("doubling-test-portfolio",JSON.stringify(state.portfolio));renderPortfolio();};}); document.querySelector("[data-clear]").onclick=()=>{state.portfolio=[];localStorage.removeItem("doubling-test-portfolio");renderPortfolio();}; bindInternalLinks();
}

function renderDiagnosis() {
  const selected=abilityTypes.filter((item)=>state.abilities.includes(item.id)), groups=[...new Set(abilityTypes.map((x)=>x.group))], missing=abilityTypes.filter((item)=>!state.abilities.includes(item.id));
  const strength=groups.map((group)=>{const total=abilityTypes.filter((x)=>x.group===group).length,count=selected.filter((x)=>x.group===group).length;return {group,pct:Math.round(count/total*100)};}).sort((a,b)=>b.pct-a.pct);
  app.innerHTML=`<div class="page">${moduleHero("Portfolio evidence map","作品集能力诊断","检查作品集是否具有支撑申请判断的证据。这里评估证据结构，不是审美分数或录取概率。")}<section class="choice-grid">${abilityTypes.map((item)=>`<button class="choice ${state.abilities.includes(item.id)?"selected":""}" type="button" data-ability="${item.id}"><strong>${esc(item.label)}</strong><small>${esc(item.group)}</small></button>`).join("")}</section><div class="tool-actions"><p>已具备 ${selected.length} / ${abilityTypes.length} 项证据</p><button class="button" data-clear>重新诊断</button></div>${selected.length?`<section class="diagnosis-summary"><div class="diagnosis-card"><span class="eyebrow">Evidence profile</span><h2>当前证据结构</h2>${strength.map((s)=>`<p>${esc(s.group)} · ${s.pct}%</p><div class="meter"><span style="width:${s.pct}%"></span></div>`).join("")}</div><div class="diagnosis-card"><span class="eyebrow">Priority gaps</span><h2>优先补齐</h2><ul>${missing.slice(0,6).map((item)=>`<li>${esc(item.label)}：为${esc(item.group)}判断补充可见证据</li>`).join("")||"<li>基础证据较完整，下一步应按项目重排叙事。</li>"}</ul></div></section>`:""}</div>`;
  document.querySelectorAll("[data-ability]").forEach((button)=>{button.onclick=()=>{const id=button.dataset.ability;state.abilities=state.abilities.includes(id)?state.abilities.filter((x)=>x!==id):[...state.abilities,id];localStorage.setItem("doubling-test-abilities",JSON.stringify(state.abilities));renderDiagnosis();};});document.querySelector("[data-clear]").onclick=()=>{state.abilities=[];localStorage.removeItem("doubling-test-abilities");renderDiagnosis();};
}

function renderTimeline() {
  const selected=state.timeline.map(programById).filter(Boolean), available=programs.filter((p)=>!state.timeline.includes(p.id));
  const phases=[["2026 AUG–SEP","资格审查与母版结构","确认本科背景、语言路径和资格风险；完成项目取舍与缺口诊断。"],["2026 SEP–OCT","项目重构与证据补齐","补齐过程、平剖、构造、材料、环境与个人贡献，不先做最终排版。"],["2026 OCT–NOV","完成母版作品集","形成完整版本，并为不同教学模式准备不同项目顺序与摘要。"],["2026 NOV–DEC","按学校生成申请版本","核验页数、文件大小、匿名、CV、动机信、AI 声明和推荐信。"],["2026 DEC–2027 SPRING","提交、面试与签证","按当前公开节点提交；待更新项目必须先回到官网复核。"]];
  const checklist=["Programme 名称与方向","学历与成绩单","英语 / 当地语言","作品集页数与大小","个人贡献标注","CV 与动机信","推荐信 / Essay / Video","AI 使用声明","申请费与材料截止","面试准备","职业资格复核","签证时间预留"];
  app.innerHTML=`<div class="page">${moduleHero("My 2027 timeline","申请时间线","选择最多 8 个项目，把共通准备阶段、项目当前公开节点和提交前检查放在同一页。")}<section class="timeline-controls"><select data-add><option value="">添加一个项目</option>${schools.map((school)=>`<optgroup label="${esc(school.cn)}">${school.programs.filter((p)=>available.some((a)=>a.id===p.id)).map((p)=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</optgroup>`).join("")}</select><button class="button" data-use-compare>导入比较组合</button></section><div class="saved-strip">${selected.map((p)=>`<span class="saved-pill">${esc(p.school.cn)} · ${esc(p.name)} <button data-timeline-remove="${p.id}">×</button></span>`).join("")||`<span class="module-note">尚未选择项目。</span>`}</div><section class="timeline">${phases.map(([date,title,copy],i)=>`<article class="timeline-item"><div class="timeline-date">${date}</div><div class="timeline-body"><h3>${title}</h3><p>${copy}</p>${i===phases.length-1&&selected.length?`<div class="checklist">${selected.map((p)=>{const f=decisionFreshness(p);return `<div class="check-item"><strong>${esc(p.school.cn)} · ${esc(p.name)}</strong><br>${esc(p.deadline)}<br><span class="status-badge ${f.cls}" style="margin-top:8px">${f.label}</span></div>`;}).join("")}</div>`:""}</div></article>`).join("")}</section><div class="section-title"><h2>提交前 Checklist</h2><span>逐项目复核</span></div><section class="checklist">${checklist.map((item)=>`<div class="check-item">□ ${esc(item)}</div>`).join("")}</section></div>`;
  document.querySelector("[data-add]").onchange=(e)=>{if(e.target.value&&state.timeline.length<8)state.timeline.push(e.target.value);localStorage.setItem("doubling-test-timeline",JSON.stringify(state.timeline));renderTimeline();};document.querySelector("[data-use-compare]").onclick=()=>{state.timeline=[...new Set([...state.timeline,...state.compare])].slice(0,8);localStorage.setItem("doubling-test-timeline",JSON.stringify(state.timeline));renderTimeline();};document.querySelectorAll("[data-timeline-remove]").forEach((button)=>{button.onclick=()=>{state.timeline=state.timeline.filter((id)=>id!==button.dataset.timelineRemove);localStorage.setItem("doubling-test-timeline",JSON.stringify(state.timeline));renderTimeline();};});
}

function renderCompare() {
  const selected=[0,1,2,3,4].map((i)=>programById(state.compare[i]));
  const groups=[["Programme",[["学位类型","degree"],["教学模式",(p)=>decisionTeaching(p).model],["申请机制",(p)=>decisionTeaching(p).mechanism],["方向选择时间",(p)=>decisionTeaching(p).when],["核心方向",(p)=>decisionDirectionsFor(p).map((d)=>d.label).join(" / ")]]],["Admission",[["学制","duration"],["授课语言","language"],["非欧盟学费","tuition"],["申请节点","deadline"],["资格与材料","requirements"],["面试","interview"]]],["Portfolio",[["作品集要求","portfolio"],["应强化的证据",(p)=>portfolioSignals(p).join(" / ")||"完整建筑项目"]]],["Student fit",[["适合申请者","suitable"],["需要注意","warning"],["信息状态",(p)=>decisionFreshness(p).label]]]];
  const val=(p,key)=>p?(typeof key==="function"?key(p):p[key]):"—", visible=(rows)=>rows.filter(([,key])=>!state.differencesOnly||new Set(selected.filter(Boolean).map((p)=>val(p,key))).size>1), options=(current)=>`<option value="">选择一个项目</option>${schools.map((s)=>`<optgroup label="${esc(s.cn)}">${s.programs.map((p)=>`<option value="${p.id}" ${current?.id===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</optgroup>`).join("")}`;
  app.innerHTML=`<div class="page"><section class="compare-heading"><span class="eyebrow">最多选择五个项目</span><h1>决策比较<span style="color:var(--orange)">.</span></h1><p>比较教学机制、资格、Portfolio 证据与适配逻辑，而不是只比较参数。</p></section><section class="compare-selectors">${selected.map((p,i)=>`<div class="selector-slot"><label>项目 ${i+1}</label><select data-slot="${i}">${options(p)}</select></div>`).join("")}</section><div class="compare-options"><label class="switch"><input type="checkbox" data-differences ${state.differencesOnly?"checked":""}> 只显示差异</label></div><section class="compare-table"><div class="compare-row"><div class="compare-label">项目</div>${selected.map((p)=>`<div class="compare-cell compare-name">${p?`<span class="eyebrow">${esc(p.school.cn)}</span><h2>${esc(p.name)}</h2><p>${esc(p.degree)}</p><a class="text-link" href="${href("project",p.id)}" data-link="project" data-id="${p.id}">查看详情 →</a>`:"尚未选择"}</div>`).join("")}</div>${groups.map(([group,rows])=>`<div class="compare-group">${group}</div>${visible(rows).map(([label,key])=>`<div class="compare-row"><div class="compare-label">${label}</div>${selected.map((p)=>`<div class="compare-cell">${esc(val(p,key))}</div>`).join("")}</div>`).join("")}`).join("")}</section></div>`;
  document.querySelectorAll("[data-slot]").forEach((select)=>{select.onchange=()=>{const index=Number(select.dataset.slot),next=[...state.compare],id=select.value;if(id&&next.some((x,i)=>x===id&&i!==index))return;if(id)next[index]=id;else next.splice(index,1);state.compare=next.filter(Boolean).slice(0,5);updateCompareUI();renderCompare();};});document.querySelector("[data-differences]").onchange=(e)=>{state.differencesOnly=e.target.checked;renderCompare();};bindInternalLinks();
}

function renderRoute() {
  const params = new URLSearchParams(location.search);
  const view = params.get("view") || "home";
  const id = params.get("id") || "";
  if (view === "school" && schoolById(id)) renderSchool(schoolById(id));
  else if (view === "project" && programById(id)) renderProject(programById(id));
  else if (view === "directions") renderDirections(id);
  else if (view === "portfolio") renderPortfolio();
  else if (view === "diagnosis") renderDiagnosis();
  else if (view === "timeline") renderTimeline();
  else if (view === "compare") renderCompare();
  else if (view === "contact") renderContact();
  else renderHome();
  updateCompareUI();
  headerControls();
  window.scrollTo({ top: 0, behavior: "instant" });
  app.focus({ preventScroll: true });
}

window.addEventListener("popstate", renderRoute);
renderRoute();
