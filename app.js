const API_BASE_URL = "https://cryptweb.onrender.com";

// ─── Telegram Mini App Detection ───
const tg = window.Telegram?.WebApp || null;
const tgUser = tg?.initDataUnsafe?.user || null;

if (tg) {
  tg.ready();
  tg.expand();
}

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
  newsPage: 1,
  hasMoreNews: true,
  isLoadingMoreNews: false,
  telegramUser: tgUser,
};

let feedObserver = null;

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
  let safeLink = item.short_link || "";
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
        
  const loadMoreBtn = (!state.isSearching && state.hasMoreNews && state.news.length > 0)
    ? `
      <div class="load-more-container load-more-trigger">
        <div class="loading-state" style="padding: 20px;">
          <span class="live-pulse"></span> Loading older news...
        </div>
      </div>
    `
    : (!state.hasMoreNews && !state.isSearching && state.news.length > 0) 
      ? `<div class="end-of-feed">You've reached the end of the ledger.</div>`
      : "";

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
      ${loadMoreBtn}
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
  const u = state.telegramUser;

  const userCard = u
    ? `
      <div class="tg-profile-card">
        <div class="tg-profile-avatar-wrap">
          ${u.photo_url
            ? `<img src="${escapeHtml(u.photo_url)}" alt="Profile" class="tg-profile-avatar" />`
            : `<div class="tg-profile-avatar tg-profile-avatar-placeholder">${escapeHtml((u.first_name || "?")[0])}</div>`
          }
        </div>
        <div class="tg-profile-name">${escapeHtml(u.first_name || "")}${u.last_name ? " " + escapeHtml(u.last_name) : ""}</div>
        ${u.username ? `<div class="tg-profile-username">@${escapeHtml(u.username)}</div>` : ""}
        <div class="tg-profile-details">
          <div class="tg-detail-row">
            <span class="lbl">User ID</span>
            <span class="val">${escapeHtml(String(u.id))}</span>
          </div>
          ${u.language_code ? `
          <div class="tg-detail-row">
            <span class="lbl">Language</span>
            <span class="val">${escapeHtml(u.language_code.toUpperCase())}</span>
          </div>` : ""}
          ${u.is_premium ? `
          <div class="tg-detail-row">
            <span class="lbl">Status</span>
            <span class="val tg-premium">⭐ Premium</span>
          </div>` : ""}
        </div>
      </div>
    `
    : `
      <div class="tg-profile-card tg-profile-guest">
        <div class="tg-profile-avatar-wrap">
          <div class="tg-profile-avatar tg-profile-avatar-placeholder">👤</div>
        </div>
        <div class="tg-profile-name">Guest</div>
        <div class="tg-profile-username">Open via Telegram for full profile</div>
      </div>
    `;

  return `
    <section class="info">
      ${userCard}
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

function formatSupply(value) {
  if (!value || value === 0) return "N/A";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
}

function renderModal() {
  const coin = getActiveCoin();
  if (!coin) {
    return "";
  }

  const change = Number(coin.price_change_24h_pct || 0);
  const arrow = change >= 0 ? "&#9650;" : "&#9660;";
  const sign = change >= 0 ? "+" : "";
  const high24h = Number(coin.high_24h || 0);
  const low24h = Number(coin.low_24h || 0);
  const supply = Number(coin.circulating_supply || 0);
  const description = coin.description || "";

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
          <div class="snapshot-hero-top">
            ${coin.image
              ? `<img src="${escapeHtml(coin.image)}" alt="${escapeHtml(coin.name)}" class="snapshot-coin-img" />`
              : ""}
            <div>
              <div class="snapshot-name">${escapeHtml(coin.name)}</div>
              <div class="snapshot-symbol">${escapeHtml(coin.symbol)} / USD</div>
            </div>
          </div>
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
            <div class="lbl">24h High</div>
            <div class="val up">${high24h > 0 ? "$" + formatPrice(high24h) : "N/A"}</div>
          </div>
          <div class="snap-stat">
            <div class="lbl">24h Low</div>
            <div class="val down">${low24h > 0 ? "$" + formatPrice(low24h) : "N/A"}</div>
          </div>
          <div class="snap-stat">
            <div class="lbl">Circulating Supply</div>
            <div class="val">${formatSupply(supply)}</div>
          </div>
          <div class="snap-stat">
            <div class="lbl">Vibe</div>
            <div class="val ${trendClass(coin.sentiment)}">${escapeHtml(coin.sentiment)}</div>
          </div>
        </div>

        ${description ? `
        <div class="snapshot-desc">
          <div class="ai-label">About ${escapeHtml(coin.name)}</div>
          <p class="snapshot-desc-text">${escapeHtml(description)}</p>
        </div>
        ` : ""}

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
  const meIcon = state.telegramUser?.photo_url
    ? `<img src="${escapeHtml(state.telegramUser.photo_url)}" alt="Me" class="tg-avatar" />`
    : "\uD83D\uDC64";

  const items = [
    { id: "home", label: "Home", icon: "\u25A4" },
    { id: "market", label: "Market", icon: "\u25EB" },
    { id: "me", label: "Me", icon: meIcon },
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

function setupInfiniteScroll() {
  if (feedObserver) {
    feedObserver.disconnect();
  }

  const trigger = document.querySelector('.load-more-trigger');
  if (!trigger) return;

  feedObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      loadMoreNews();
    }
  }, {
    root: null,
    rootMargin: '200px', // trigger fetch 200px before reaching the bottom
    threshold: 0
  });

  feedObserver.observe(trigger);
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
  
  if (state.view === "home" && state.tab === "feed") {
    setTimeout(setupInfiniteScroll, 0);
  }
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
    const newsData = await fetchJson(`${API_BASE_URL}/api/news?page=1&limit=10`);
    if (newsData && Array.isArray(newsData.data)) {
      state.news = newsData.data;
      state.newsPage = 1;
      if (newsData.data.length < 10) {
        state.hasMoreNews = false;
      } else {
        state.hasMoreNews = true;
      }
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

async function loadMoreNews() {
  if (state.isLoadingMoreNews || !state.hasMoreNews || state.isSearching) return;
  
  state.isLoadingMoreNews = true;
  renderApp(); // show loading state on button

  try {
    const nextPage = state.newsPage + 1;
    const newsData = await fetchJson(`${API_BASE_URL}/api/news?page=${nextPage}&limit=10`);
    
    if (newsData && Array.isArray(newsData.data)) {
      if (newsData.data.length > 0) {
        state.news = [...state.news, ...newsData.data];
        state.newsPage = nextPage;
      }
      if (newsData.data.length < 10) {
        state.hasMoreNews = false;
      }
    } else {
      state.hasMoreNews = false;
    }
  } catch (error) {
    console.error("Failed to load more news", error);
  } finally {
    state.isLoadingMoreNews = false;
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
