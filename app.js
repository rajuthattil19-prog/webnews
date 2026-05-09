const API_BASE_URL = "https://cryptweb.onrender.com";

const state = {
  view: "home",
  tab: "feed",
  activeCoinId: null,
  coins: [],
  news: [],
  searchQuery: "",
  isSearching: false,
  isLoadingCoins: true,
  isLoadingNews: true,
};

const app = document.getElementById("app");

if (!app) {
  throw new Error("App root not found.");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(value) {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

function formatBig(value) {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

function timeAgo(isoString) {
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60000),
  );

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

function trendClass(sentiment) {
  switch (sentiment) {
    case "Mooning":
      return "trend-mooning";
    case "Steady":
      return "trend-steady";
    case "Chilly":
      return "trend-chilly";
    case "Bleeding":
      return "trend-bleeding";
    case "Heating Up":
      return "trend-heating";
    default:
      return "";
  }
}

function syncViewAndTab() {
  if (state.view === "home") {
    state.tab = "feed";
  }
  if (state.view === "market") {
    state.tab = "market";
  }
}

function getCoins() {
  return state.coins;
}

function getNews() {
  return state.news;
}

function getActiveCoin() {
  return getCoins().find((coin) => coin.id === state.activeCoinId) || null;
}

function renderTicker(coins) {
  if (coins.length === 0) {
    return `
      <div class="ticker" aria-label="Live market ticker">
        <div class="ticker-track ticker-track-static">
          <div class="ticker-item ticker-empty">
            ${state.isLoadingCoins ? "Loading live market feed..." : "No live price data available."}
          </div>
        </div>
      </div>
    `;
  }

  const items = coins.concat(coins);
  const duration = `${Math.max(20, coins.length * 3)}s`;

  return `
    <div class="ticker" aria-label="Live market ticker">
      <div class="ticker-track" style="animation-duration: ${duration};">
        ${items
          .map((coin) => {
            const change = Number(coin.price_change_24h_pct || 0);
            const directionClass = change >= 0 ? "up" : "down";
            const sign = change >= 0 ? "+" : "";

            return `
              <button
                class="ticker-item"
                type="button"
                data-action="open-coin"
                data-coin-id="${escapeHtml(coin.id)}"
                aria-label="Open ${escapeHtml(coin.name)} snapshot"
              >
                <span class="ticker-symbol">${escapeHtml(coin.symbol)}</span>
                <span class="ticker-price">$${formatPrice(Number(coin.price_usd || 0))}</span>
                <span class="ticker-change ${directionClass}">${sign}${change.toFixed(2)}%</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderHeader() {
  return `
    <header class="header">
      <h1 class="header-brand">The Ledger<span class="dot">.</span></h1>
      <div class="header-meta">
        <div class="live"><span class="live-pulse"></span> Live</div>
        <div>v1.0 &middot; Terminal</div>
      </div>
    </header>
  `;
}

function renderTabs() {
  if (state.view === "me") {
    return "";
  }

  return `
    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected="${state.tab === "feed"}"
        class="tab ${state.tab === "feed" ? "active" : ""}"
        data-action="set-tab"
        data-tab="feed"
      >
        Smart Feed
      </button>
      <button
        type="button"
        role="tab"
        aria-selected="${state.tab === "market"}"
        class="tab ${state.tab === "market" ? "active" : ""}"
        data-action="set-tab"
        data-tab="market"
      >
        Market Vibe
      </button>
    </div>
  `;
}

function renderNewsCard(item) {
  const symbols = Array.isArray(item.related_symbols) ? item.related_symbols.join(" &middot; ") : "";
  const headline = `
    <h2 class="news-headline">${escapeHtml(item.headline)}</h2>
  `;

  // Append a dummy query parameter to bypass Telegram's broken Instant View for CoinTelegraph
  let safeLink = item.link || "";
  if (safeLink) {
    try {
      const u = new URL(safeLink);
      u.searchParams.set("noiv", "1");
      safeLink = u.toString();
    } catch (e) {}
  }

  return `
    <article class="news-card">
      <img
        class="news-image"
        src="${escapeHtml(item.image_url)}"
        alt="${escapeHtml(item.headline)}"
        loading="lazy"
      />
      <div class="news-meta">
        <span class="news-tag">${escapeHtml(item.category)}</span>
        <span>${escapeHtml(item.source)}</span>
        <span>&middot; ${escapeHtml(timeAgo(item.published_at))}</span>
      </div>
      ${
        safeLink
          ? `<a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer" class="news-headline-link">${headline}</a>`
          : headline
      }
      <div class="ai-box">
        <div class="ai-label">AI &middot; The Lowdown</div>
        <p class="ai-text">${escapeHtml(item.ai_summary)}</p>
      </div>
      <div class="news-footer">
        <span>${symbols}</span>
        <span>${escapeHtml(item.read_minutes)} min read</span>
        ${
          safeLink
            ? `<a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer" class="news-read-link">Read full &#8599;</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderFeed() {
  const content = state.isSearching
    ? `
      <div class="loading-state">
        <span class="live-pulse"></span>
        Searching the database...
      </div>
    `
    : state.isLoadingNews
      ? `
        <div class="loading-state">
          <span class="live-pulse"></span>
          Loading latest news...
        </div>
      `
      : getNews().length === 0
        ? `
          <section class="empty-state">
            <h2>No news in the database yet.</h2>
            <p>Once the backend cron collects and summarizes articles, the feed will appear here.</p>
          </section>
        `
    : getNews()
        .map((item) => renderNewsCard(item))
        .join("");

  return `
    <div class="feed">
      <div class="search-container">
        <form data-role="search-form">
          <input
            type="text"
            class="search-input"
            name="search"
            placeholder="Search news by topic or coin..."
            value="${escapeHtml(state.searchQuery)}"
          />
        </form>
      </div>
      ${content}
    </div>
  `;
}

function renderMarket() {
  if (getCoins().length === 0) {
    return `
      <section class="empty-state">
        <h2>${state.isLoadingCoins ? "Loading market prices..." : "No market prices available."}</h2>
        <p>${state.isLoadingCoins ? "Waiting for the backend to return live coin data." : "Seed or refresh Redis price data and this view will fill in automatically."}</p>
      </section>
    `;
  }

  return `
    <section class="market">
      <div class="market-header">
        <span>Asset &middot; Vibe</span>
        <span class="right">Price</span>
        <span class="right">24h</span>
      </div>
      ${getCoins()
        .map((coin) => {
          const change = Number(coin.price_change_24h_pct || 0);
          const sign = change >= 0 ? "+" : "";

          return `
            <button
              type="button"
              class="market-row"
              data-action="open-coin"
              data-coin-id="${escapeHtml(coin.id)}"
            >
              <div class="market-coin">
                <div>
                  <span class="market-name">${escapeHtml(coin.name)}</span>
                  <span class="market-symbol">${escapeHtml(coin.symbol)}</span>
                </div>
                <span class="market-trend ${trendClass(coin.sentiment)}">${escapeHtml(coin.sentiment)}</span>
              </div>
              <div class="market-stats">
                <div class="market-price">$${formatPrice(Number(coin.price_usd || 0))}</div>
              </div>
              <div class="market-stats">
                <div class="market-change ${change >= 0 ? "up" : "down"}">${sign}${change.toFixed(2)}%</div>
              </div>
            </button>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderProfile() {
  return `
    <section class="info">
      <div>
        <h2>My Profile</h2>
        <p>Welcome to your Ledger terminal.</p>
      </div>
      <div class="info-block">
        <div class="lbl">The Pitch</div>
        <p>News + on-chain + sentiment, distilled. No paywalls, no FUD, no shilling.</p>
      </div>
      <div class="info-block">
        <div class="lbl">Built For</div>
        <p>Telegram-native traders who live in chats and want a calmer way to stay sharp.</p>
      </div>
      <div class="info-block">
        <div class="lbl">Privacy</div>
        <p>No wallets connected. Read-only by design. Your alpha stays yours.</p>
      </div>
    </section>
  `;
}

function renderModal() {
  const coin = getActiveCoin();
  if (!coin) {
    return "";
  }

  const change = Number(coin.price_change_24h_pct || 0);
  const arrow = change >= 0 ? "&#9650;" : "&#9660;";
  const sign = change >= 0 ? "+" : "";

  return `
    <div class="modal-backdrop" data-action="close-modal" role="dialog" aria-modal="true">
      <div class="modal">
        <div class="modal-header">
          <button type="button" class="modal-back" data-action="close-modal" aria-label="Close snapshot">
            &larr; Back
          </button>
          <span class="modal-tag">Coin Snapshot</span>
        </div>

        <div class="snapshot-hero">
          <div class="snapshot-name">${escapeHtml(coin.name)}</div>
          <div class="snapshot-symbol">${escapeHtml(coin.symbol)} / USD</div>
          <div class="snapshot-price">$${formatPrice(Number(coin.price_usd || 0))}</div>
          <div class="snapshot-change ${change >= 0 ? "up" : "down"}">
            ${arrow} ${sign}${change.toFixed(2)}% &middot; 24h
          </div>
        </div>

        <div class="snapshot-grid">
          <div class="snap-stat">
            <div class="lbl">Market Cap</div>
            <div class="val">${formatBig(Number(coin.market_cap_usd || 0))}</div>
          </div>
          <div class="snap-stat">
            <div class="lbl">24h Volume</div>
            <div class="val">${formatBig(Number(coin.volume_24h_usd || 0))}</div>
          </div>
          <div class="snap-stat">
            <div class="lbl">Vibe</div>
            <div class="val ${trendClass(coin.sentiment)}">${escapeHtml(coin.sentiment)}</div>
          </div>
          <div class="snap-stat">
            <div class="lbl">Ticker</div>
            <div class="val">${escapeHtml(coin.symbol)}</div>
          </div>
        </div>

        <div class="snapshot-ai">
          <div class="ai-box">
            <div class="ai-label">AI &middot; Market Vibe</div>
            <p class="ai-text">${escapeHtml(coin.ai_sentiment_summary)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBottomNav() {
  const items = [
    { id: "home", label: "Home", icon: "\u25A4" },
    { id: "market", label: "Market", icon: "\u25EB" },
    { id: "me", label: "Me", icon: "\uD83D\uDC64" },
  ];

  return `
    <nav class="bottom-nav" aria-label="Primary">
      ${items
        .map(
          (item) => `
            <button
              type="button"
              class="nav-item ${state.view === item.id ? "active" : ""}"
              data-action="set-view"
              data-view="${item.id}"
              ${state.view === item.id ? 'aria-current="page"' : ""}
            >
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderMain() {
  if (state.view === "me") {
    return renderProfile();
  }

  if (state.tab === "feed") {
    return renderFeed();
  }

  return renderMarket();
}

function renderApp() {
  syncViewAndTab();
  app.innerHTML = `
    ${renderTicker(getCoins())}
    ${renderHeader()}
    ${renderTabs()}
    <main class="main">${renderMain()}</main>
    ${renderModal()}
    ${renderBottomNav()}
  `;

  document.body.style.overflow = state.activeCoinId ? "hidden" : "";
}

function setView(view) {
  state.view = view;
  renderApp();
}

function setTab(tab) {
  state.tab = tab;
  state.view = tab === "feed" ? "home" : "market";
  renderApp();
}

function openCoin(coinId) {
  state.activeCoinId = coinId;
  renderApp();
}

function closeModal() {
  state.activeCoinId = null;
  renderApp();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadInitialData() {
  try {
    const priceData = await fetchJson(`${API_BASE_URL}/api/prices`);
    if (priceData && Array.isArray(priceData.data) && priceData.data.length > 0) {
      state.coins = priceData.data;
    }
  } catch (error) {
    console.error(error);
  } finally {
    state.isLoadingCoins = false;
    renderApp();
  }

  try {
    const newsData = await fetchJson(`${API_BASE_URL}/api/news`);
    if (newsData && Array.isArray(newsData.data) && newsData.data.length > 0) {
      state.news = newsData.data;
    }
  } catch (error) {
    console.error(error);
  } finally {
    state.isLoadingNews = false;
    renderApp();
  }
}

async function runSearch() {
  state.isSearching = true;
  renderApp();

  try {
    const query = state.searchQuery.trim();
    const endpoint = query
      ? `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/api/news`;
    const data = await fetchJson(endpoint);
    state.news = Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error(error);
  } finally {
    state.isSearching = false;
    renderApp();
  }
}

app.addEventListener("click", (event) => {
  const origin = event.target;
  if (!(origin instanceof Element)) {
    return;
  }

  const target = origin.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  if (action === "set-view") {
    setView(target.dataset.view);
    return;
  }

  if (action === "set-tab") {
    setTab(target.dataset.tab);
    return;
  }

  if (action === "open-coin") {
    openCoin(target.dataset.coinId);
    return;
  }

  if (
    action === "close-modal" &&
    (target.classList.contains("modal-backdrop") || target.classList.contains("modal-back"))
  ) {
    closeModal();
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.name === "search") {
    state.searchQuery = target.value;
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.dataset.role !== "search-form") {
    return;
  }

  event.preventDefault();
  runSearch();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.activeCoinId) {
    closeModal();
  }
});

renderApp();
loadInitialData();
