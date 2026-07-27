const articles = [
  {
    title: "“生存的诗学”，拒绝对贫穷的浪漫化，关于 Lina Bo Bardi 展览",
    date: "2026.07.26",
    category: "评论",
    url: "/articles/poetics-of-survival-lina-bo-bardi/",
    summary:
      "从“生存的文明”到“生存的诗学”，重新追问展览如何把结构性贫困转化为可以欣赏的设计资源，以及劳动者的创造力应当通向什么。",
    tags: [
      "Lina Bo Bardi",
      "展览批评",
      "贫困浪漫化",
      "生存的文明",
      "劳动",
      "公共性",
      "博物馆",
      "意识形态",
    ],
    searchableText:
      "生存的诗学 生存的文明 东北展览 匮乏 贫困 浪漫化 结构性贫困 设计资源 劳动者 建筑师 美术馆 意识形态 殖民遗产 干旱 工业发展 生产方式 社会关系 历史暴力 丰盛 废弃材料 共同体 真实性 创造力 历史断裂 土地 种族 劳动 政治压迫 Ana María León 去殖民化 现代主义 原住民 民间文化 韧性 公共资源 社区 公共设施 工艺 工业 城市更新 公共空间 女性 生态 再利用 地方性 财政 组织 政治力量 解放",
  },
];

const searchInput = document.querySelector("[data-search]");
const clearButton = document.querySelector("[data-search-clear]");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const cards = [...document.querySelectorAll("[data-article]")];
const resultCount = document.querySelector("[data-result-count]");
const emptyState = document.querySelector("[data-empty]");
let activeCategory = "全部";

function normalize(value) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function applyFilters() {
  const query = normalize(searchInput?.value || "");
  let visible = 0;

  cards.forEach((card, index) => {
    const article = articles[index];
    const corpus = normalize(
      [
        article.title,
        article.summary,
        article.category,
        article.tags.join(" "),
        article.searchableText,
      ].join(" "),
    );
    const matchesQuery = !query || corpus.includes(query);
    const matchesCategory = activeCategory === "全部" || article.category === activeCategory;
    const shouldShow = matchesQuery && matchesCategory;
    card.hidden = !shouldShow;
    if (shouldShow) visible += 1;
  });

  clearButton?.classList.toggle("is-visible", Boolean(query));
  resultCount?.classList.toggle("is-visible", Boolean(query));
  if (resultCount) {
    resultCount.textContent = `找到 ${visible} 篇文章`;
  }
  emptyState?.classList.toggle("is-visible", visible === 0);
}

async function hydrateSearchIndex() {
  await Promise.all(
    articles.map(async (article) => {
      try {
        const response = await fetch(article.url);
        if (!response.ok) return;
        const html = await response.text();
        const documentFragment = new DOMParser().parseFromString(html, "text/html");
        const body = documentFragment.querySelector(".article-body");
        if (body) article.searchableText += ` ${body.textContent}`;
      } catch {
        // The curated fallback index remains available if a page cannot be fetched.
      }
    }),
  );
  applyFilters();
}

searchInput?.addEventListener("input", applyFilters);
clearButton?.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  applyFilters();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    filterButtons.forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === button);
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
    applyFilters();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput?.focus();
  }
});

applyFilters();
hydrateSearchIndex();
