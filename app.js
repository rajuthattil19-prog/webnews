const API_BASE_URL = "https://kljnoiubpiuvb.vercel.app";

const DEFAULT_COINS = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price_usd: 71240.55,
    price_change_24h_pct: 2.41,
    market_cap_usd: 1402000000000,
    volume_24h_usd: 38400000000,
    sentiment: "Mooning",
    ai_sentiment_summary:
      "BTC is flexing again - ETF inflows are stacking and whales are quietly accumulating. Vibes are bullish, but watch the $72k wall.",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    price_usd: 3812.12,
    price_change_24h_pct: 1.18,
    market_cap_usd: 458000000000,
    volume_24h_usd: 17200000000,
    sentiment: "Steady",
    ai_sentiment_summary:
      "ETH is moving sideways with conviction - staking flows look healthy, gas is calm. Not loud, but quietly setting up.",
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    price_usd: 184.66,
    price_change_24h_pct: 5.92,
    market_cap_usd: 86000000000,
    volume_24h_usd: 4900000000,
    sentiment: "Heating Up",
    ai_sentiment_summary:
      "SOL is on fire today - meme volume and DEX flow are popping. Looks like rotation money is finally landing here.",
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    price_usd: 0.5215,
    price_change_24h_pct: -1.42,
    market_cap_usd: 28900000000,
    volume_24h_usd: 1240000000,
    sentiment: "Chilly",
    ai_sentiment_summary:
      "XRP is in cool-down mode. Ledger activity dipped and chatter went quiet - not bearish, just bored.",
  },
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    price_usd: 0.1612,
    price_change_24h_pct: 8.74,
    market_cap_usd: 23100000000,
    volume_24h_usd: 2100000000,
    sentiment: "Mooning",
    ai_sentiment_summary:
      "DOGE is doing DOGE things - social mentions exploded after a single tweet. Fun while it lasts.",
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    price_usd: 0.448,
    price_change_24h_pct: -3.16,
    market_cap_usd: 15800000000,
    volume_24h_usd: 410000000,
    sentiment: "Bleeding",
    ai_sentiment_summary:
      "ADA is leaking. No clear catalyst, just slow distribution. Probably one to watch, not chase.",
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    price_usd: 17.92,
    price_change_24h_pct: 4.05,
    market_cap_usd: 10500000000,
    volume_24h_usd: 620000000,
    sentiment: "Heating Up",
    ai_sentiment_summary:
      "LINK is catching a real bid - RWA narrative + new partner integrations. Smart money seems early here.",
  },
];

const DEFAULT_NEWS = [
  {
    id: "n1",
    headline: "BlackRock Just Quietly Bought Another $400M of BTC - Nobody's Talking About It",
    ai_summary:
      "While Twitter is busy arguing about memecoins, BlackRock added another massive tranche of BTC to its ETF. The Lowdown: institutions are still loading the boat, and they're doing it on green candles - that's a confidence signal.",
    source: "CoinDesk",
    published_at: "2026-05-08T09:14:00Z",
    category: "Institutional",
    read_minutes: 3,
    image_url:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&h=675&fit=crop",
    related_symbols: ["BTC"],
  },
  {
    id: "n2",
    headline: "Solana Devs Ship a Fee Market Upgrade - Here's Why MEV Bots Are Sweating",
    ai_summary:
      "Solana's new local fee markets ship next week. Translation: spam transactions get priced out, real users pay less, and sandwich bots lose their edge. The Lowdown: this is bullish for UX, mildly bearish for some validator revenue.",
    source: "The Block",
    published_at: "2026-05-08T07:42:00Z",
    category: "Tech",
    read_minutes: 4,
    image_url:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop",
    related_symbols: ["SOL"],
  },
  {
    id: "n3",
    headline: "SEC Drops Case Against Major DeFi Protocol - Quiet Friday, Loud Implications",
    ai_summary:
      "The SEC walked away from a multi-year investigation into a DeFi front-end. The Lowdown: regulatory tone is shifting fast in 2026. DeFi tokens may be the most underpriced trade of the cycle if this pattern continues.",
    source: "Bloomberg Crypto",
    published_at: "2026-05-08T05:10:00Z",
    category: "Regulation",
    read_minutes: 5,
    image_url:
      "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&h=675&fit=crop",
    related_symbols: ["ETH", "LINK"],
  },
  {
    id: "n4",
    headline: "Stablecoin Supply Just Hit an All-Time High - Dry Powder Is Loaded",
    ai_summary:
      "USDT + USDC combined supply quietly punched a new ATH. The Lowdown: that's $180B+ sitting on exchanges waiting to deploy. Historically this precedes a leg up, not down.",
    source: "Glassnode",
    published_at: "2026-05-07T22:58:00Z",
    category: "On-chain",
    read_minutes: 2,
    image_url:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop",
    related_symbols: ["BTC", "ETH"],
  },
  {
    id: "n5",
    headline: "DOGE Social Volume Goes Vertical After a Single Tweet - Here We Go Again",
    ai_summary:
      "DOGE mentions are 11x their weekly average. The Lowdown: classic memecoin reflex. Fun trade, not an investment thesis. If you're playing, set an exit before you set an entry.",
    source: "Santiment",
    published_at: "2026-05-07T19:30:00Z",
    category: "Memes",
    read_minutes: 2,
    image_url:
      "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=1200&h=675&fit=crop",
    related_symbols: ["DOGE"],
  },
];

const state = {
  view: "home",
  tab: "feed",
  activeCoinId: null,
  coins: [],
  news: [],
  searchQuery: "",
  isSearching: false,
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
  return state.coins.length > 0 ? state.coins : DEFAULT_COINS;
}

function getNews() {
  return state.news.length > 0 ? state.news : DEFAULT_NEWS;
}

function getActiveCoin() {
  return getCoins().find((coin) => coin.id === state.activeCoinId) || null;
}

function renderTicker(coins) {
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
        item.link
          ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="news-headline-link">${headline}</a>`
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
          item.link
            ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="news-read-link">Read full &#8599;</a>`
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
      renderApp();
    }
  } catch (error) {
    console.error(error);
  }

  try {
    const newsData = await fetchJson(`${API_BASE_URL}/api/news`);
    if (newsData && Array.isArray(newsData.data) && newsData.data.length > 0) {
      state.news = newsData.data;
      renderApp();
    }
  } catch (error) {
    console.error(error);
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
