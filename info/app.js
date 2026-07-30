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
  view: localStorage.getItem("doubling-view") || "schools",
  query: "",
  country: "全部",
  direction: "全部",
  language: "全部",
  compare: JSON.parse(localStorage.getItem("doubling-compare") || "[]").slice(0, 5)
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
  document.querySelectorAll("[data-contact]").forEach((item) => {
    item.onclick = (event) => { event.preventDefault(); navigate("contact"); };
  });
}

function updateCompareUI() {
  localStorage.setItem("doubling-compare", JSON.stringify(state.compare));
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
  const directions = ["全部", ...directionGroups.map((group) => group.label)];
  const languages = ["全部", "英语授课", "英语路径", "其他语言 / 待核实"];
  app.innerHTML = `
    <div class="page">
      <section class="topline">
        <h1>欧洲建筑硕士<span>.</span></h1>
        <p class="topline-meta">2027 秋季入学准备版<br>${schools.length} 所学校 · ${programs.length} 个建筑与城市方向</p>
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
        const directionMatch = state.direction === "全部" || programDirections(program).includes(state.direction);
        const languageMatch = state.language === "全部" || programLanguage(program) === state.language;
        const haystack = [school.name, school.cn, school.city, school.country, school.position, program.name, program.degree, ...program.tags].join(" ").toLowerCase();
        return directionMatch && languageMatch && (!query || haystack.includes(query));
      });
      return countryMatch && relevantPrograms.length > 0;
    });
    const selectedPrograms = programs.filter((program) => {
      const countryMatch = state.country === "全部" || program.school.country === state.country;
      const directionMatch = state.direction === "全部" || programDirections(program).includes(state.direction);
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
      localStorage.setItem("doubling-view", state.view);
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
    ["主要方向", "intro"], ["适合申请者", "suitable"], ["作品集重点", "portfolio"], ["资格与材料", "requirements"], ["需要注意", "warning"]
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

function renderRoute() {
  const params = new URLSearchParams(location.search);
  const view = params.get("view") || "home";
  const id = params.get("id") || "";
  if (view === "school" && schoolById(id)) renderSchool(schoolById(id));
  else if (view === "project" && programById(id)) renderProject(programById(id));
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
