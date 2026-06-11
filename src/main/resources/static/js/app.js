(function () {
    const sidoSelect = document.getElementById("sido");
    const sigunguSelect = document.getElementById("sigungu");
    const dealYmdInput = document.getElementById("dealYmd");
    const submitBtn = document.getElementById("submitBtn");
    const form = document.getElementById("searchForm");
    const resultArea = document.getElementById("resultArea");
    const resultMeta = document.getElementById("resultMeta");
    const clockDate = document.getElementById("clockDate");
    const clockTime = document.getElementById("clockTime");

    let regionsCache = [];

    const PAGE_SIZE = 20;
    const state = {
        lawdCd: null,
        dealYmd: null,
        ymdRaw: null,
        sidoName: null,
        sigunguName: null,
        pageNo: 1,
        totalCount: 0,
    };

    // -------- Clock --------
    const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

    function tickClock() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const w = weekdayNames[now.getDay()];
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        clockDate.textContent = `${y}년 ${m}월 ${d}일 (${w})`;
        clockTime.textContent = `${hh}:${mm}:${ss}`;
    }
    tickClock();
    setInterval(tickClock, 1000);

    // -------- Default dealYmd: two months ago --------
    function setDefaultDealYmd() {
        const now = new Date();
        now.setMonth(now.getMonth() - 2);
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        dealYmdInput.value = `${y}-${m}`;
        dealYmdInput.max = (function () {
            const t = new Date();
            return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
        })();
    }
    setDefaultDealYmd();

    // -------- Load regions --------
    async function loadRegions() {
        try {
            const res = await fetch("/data/regions.json");
            if (!res.ok) throw new Error("지역 데이터를 불러오지 못했습니다.");
            regionsCache = await res.json();
            regionsCache.forEach((r, idx) => {
                const opt = document.createElement("option");
                opt.value = String(idx);
                opt.textContent = r.sido;
                sidoSelect.appendChild(opt);
            });
        } catch (err) {
            renderError(err.message);
        }
    }
    loadRegions();

    sidoSelect.addEventListener("change", function () {
        const idx = sidoSelect.value;
        sigunguSelect.innerHTML = "";
        if (idx === "") {
            sigunguSelect.disabled = true;
            sigunguSelect.appendChild(makeOption("", "먼저 시 · 도를 선택하세요"));
            return;
        }
        const region = regionsCache[Number(idx)];
        sigunguSelect.appendChild(makeOption("", "시 · 군 · 구 선택"));
        region.districts.forEach((d) => {
            sigunguSelect.appendChild(makeOption(d.code, d.name));
        });
        sigunguSelect.disabled = false;
    });

    function makeOption(value, text) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = text;
        return opt;
    }

    // -------- Submit --------
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const lawdCd = sigunguSelect.value;
        const ymdRaw = dealYmdInput.value;
        if (!lawdCd) {
            alert("시 · 군 · 구를 선택해주세요.");
            return;
        }
        if (!ymdRaw) {
            alert("계약 년월을 선택해주세요.");
            return;
        }
        state.lawdCd = lawdCd;
        state.dealYmd = ymdRaw.replace("-", "");
        state.ymdRaw = ymdRaw;
        state.sidoName = sidoSelect.options[sidoSelect.selectedIndex].text;
        state.sigunguName = sigunguSelect.options[sigunguSelect.selectedIndex].text;
        state.pageNo = 1;

        await fetchPage();
    });

    async function fetchPage() {
        renderLoading();
        submitBtn.disabled = true;
        try {
            const url = `/api/apt-trades`
                + `?lawdCd=${encodeURIComponent(state.lawdCd)}`
                + `&dealYmd=${encodeURIComponent(state.dealYmd)}`
                + `&pageNo=${state.pageNo}`
                + `&numOfRows=${PAGE_SIZE}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "조회 중 오류가 발생했습니다.");
            }
            state.totalCount = data.totalCount || 0;
            renderResult(data);
        } catch (err) {
            renderError(err.message);
        } finally {
            submitBtn.disabled = false;
        }
    }

    // -------- Render --------
    function renderLoading() {
        resultMeta.innerHTML = "조회 중입니다…";
        resultArea.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <div>공공데이터를 가져오는 중입니다.</div>
            </div>
        `;
    }

    function renderError(message) {
        resultMeta.innerHTML = "오류";
        resultArea.innerHTML = `<div class="error-box">${escapeHtml(message)}</div>`;
    }

    function renderResult(data) {
        const items = (data.items || []).slice();
        const total = data.totalCount || items.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const [yy, mm] = state.ymdRaw.split("-");

        const startIdx = total === 0 ? 0 : (state.pageNo - 1) * PAGE_SIZE + 1;
        const endIdx = Math.min(state.pageNo * PAGE_SIZE, total);

        resultMeta.innerHTML = `
            <span class="meta-strong">${escapeHtml(state.sidoName)} ${escapeHtml(state.sigunguName)}</span>
            · ${escapeHtml(yy)}년 ${escapeHtml(mm)}월
            · 총 <span class="meta-strong">${total.toLocaleString()}</span>건
            ${total > 0 ? `(${startIdx.toLocaleString()}–${endIdx.toLocaleString()}건 표시 · ${state.pageNo} / ${totalPages} 페이지)` : ""}
        `;

        if (items.length === 0) {
            resultArea.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">○</div>
                    <p>해당 기간에 신고된 거래 자료가 없습니다.</p>
                </div>
            `;
            return;
        }

        // Sort current page by deal date desc
        items.sort(function (a, b) {
            const da = `${pad(a.dealYear, 4)}${pad(a.dealMonth, 2)}${pad(a.dealDay, 2)}`;
            const db = `${pad(b.dealYear, 4)}${pad(b.dealMonth, 2)}${pad(b.dealDay, 2)}`;
            return db.localeCompare(da);
        });

        const cards = items.map(toCard).join("");
        const pagination = renderPagination(totalPages);
        resultArea.innerHTML = `<div class="trade-grid">${cards}</div>${pagination}`;

        bindPaginationEvents();
        // Scroll into view smoothly when changing pages (not on first render)
        if (state.pageNo > 1) {
            resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function renderPagination(totalPages) {
        if (totalPages <= 1) return "";

        const current = state.pageNo;
        const pages = pageWindow(current, totalPages, 2);

        const prevDisabled = current <= 1 ? "disabled" : "";
        const nextDisabled = current >= totalPages ? "disabled" : "";

        let html = `<nav class="pagination" aria-label="페이지 이동">`;
        html += `<button class="page-btn nav" data-action="first" ${prevDisabled} title="첫 페이지">«</button>`;
        html += `<button class="page-btn nav" data-action="prev" ${prevDisabled} title="이전 페이지">‹</button>`;

        let last = 0;
        pages.forEach((p) => {
            if (last && p - last > 1) {
                html += `<span class="page-ellipsis">…</span>`;
            }
            const active = p === current ? "active" : "";
            html += `<button class="page-btn ${active}" data-page="${p}">${p}</button>`;
            last = p;
        });

        html += `<button class="page-btn nav" data-action="next" ${nextDisabled} title="다음 페이지">›</button>`;
        html += `<button class="page-btn nav" data-action="last" ${nextDisabled} title="마지막 페이지">»</button>`;
        html += `</nav>`;
        return html;
    }

    function pageWindow(current, total, radius) {
        const set = new Set();
        set.add(1);
        set.add(total);
        for (let i = current - radius; i <= current + radius; i++) {
            if (i >= 1 && i <= total) set.add(i);
        }
        return Array.from(set).sort((a, b) => a - b);
    }

    function bindPaginationEvents() {
        const totalPages = Math.max(1, Math.ceil(state.totalCount / PAGE_SIZE));
        const buttons = resultArea.querySelectorAll(".page-btn");
        buttons.forEach((btn) => {
            btn.addEventListener("click", function () {
                if (btn.hasAttribute("disabled")) return;
                const action = btn.getAttribute("data-action");
                const pageAttr = btn.getAttribute("data-page");
                let next = state.pageNo;
                if (pageAttr) {
                    next = Number(pageAttr);
                } else if (action === "first") {
                    next = 1;
                } else if (action === "prev") {
                    next = Math.max(1, state.pageNo - 1);
                } else if (action === "next") {
                    next = Math.min(totalPages, state.pageNo + 1);
                } else if (action === "last") {
                    next = totalPages;
                }
                if (next !== state.pageNo) {
                    state.pageNo = next;
                    fetchPage();
                }
            });
        });
    }

    function toCard(it) {
        const priceManwon = parseAmount(it.dealAmount);
        const priceLabel = priceManwon != null ? formatKoreanWon(priceManwon) : "-";
        const area = it.excluUseAr ? `${Number(it.excluUseAr).toFixed(2)}㎡` : "-";
        const floor = it.floor ? `${it.floor}층` : "-";
        const build = it.buildYear ? `${it.buildYear}년` : "-";
        const dealDate = (it.dealYear && it.dealMonth && it.dealDay)
            ? `${it.dealYear}.${pad(it.dealMonth, 2)}.${pad(it.dealDay, 2)}`
            : "-";

        let badge = "";
        if (it.cdealType && it.cdealType.trim() === "O") {
            badge = `<span class="badge canceled">해제</span>`;
        } else if (it.dealingGbn && it.dealingGbn.indexOf("직거래") !== -1) {
            badge = `<span class="badge direct">직거래</span>`;
        } else if (it.dealingGbn) {
            badge = `<span class="badge">${escapeHtml(it.dealingGbn)}</span>`;
        }

        const jibun = it.jibun ? ` ${escapeHtml(it.jibun)}` : "";

        return `
            <article class="trade-card">
                <div class="apt-name">${escapeHtml(it.aptNm || "-")}</div>
                <div class="location">${escapeHtml(it.umdNm || "")}${jibun}</div>
                <div class="price">${priceLabel}</div>
                <div class="stats">
                    <div>전용 <strong>${area}</strong></div>
                    <div>층수 <strong>${floor}</strong></div>
                    <div>건축 <strong>${build}</strong></div>
                    <div>계약 <strong>${dealDate}</strong></div>
                </div>
                <div class="footer-row">
                    <span>${escapeHtml(it.estateAgentSggNm || "")}</span>
                    ${badge}
                </div>
            </article>
        `;
    }

    function parseAmount(str) {
        if (!str) return null;
        const n = Number(String(str).replace(/[,\s]/g, ""));
        return Number.isFinite(n) ? n : null;
    }

    function formatKoreanWon(manwon) {
        // manwon is in 만원 units
        const eok = Math.floor(manwon / 10000);
        const rest = manwon % 10000;
        if (eok > 0 && rest > 0) {
            return `${eok}억 ${rest.toLocaleString()}만원`;
        }
        if (eok > 0) {
            return `${eok}억원`;
        }
        return `${manwon.toLocaleString()}만원`;
    }

    function pad(v, n) {
        return String(v == null ? "" : v).padStart(n, "0");
    }

    function escapeHtml(s) {
        if (s == null) return "";
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
