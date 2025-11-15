// ========= 可調整的計分常數 =========
const TIER_BASE = 20;             // 公式: base + 10 * tier
const TIER_STEP = 10;

// 靈光一閃／神閃／怪物牌
const POINTS_INSP_NORMAL = 20;     // 共用中立卡靈光一閃
const POINTS_INSP_DIVINE = 20;     // 神之靈光一閃
const POINTS_INSP_MONSTER = 80;    // 共用怪物卡靈光一閃

const POINTS_FORBIDDEN = 20;         // 禁忌卡牌

const POINTS_CONVERT = 10;             // 每次轉換基本 10pt

// 移除 / 複製：第1次 0, 第2次 10, 第3次 30, 第4次 50, 第5次起每次 70
function stepCost(count) {
    if (count <= 0) return 0;
    if (count === 1) return 0;
    if (count === 2) return 10;
    if (count === 3) return 30;
    if (count === 4) return 50;
    return 70;
}

// ========= 內部資料結構 =========
const ACTION_LABELS = {
    add_neutral: "新增 - 中立牌",
    add_monster: "新增 - 怪物牌",

    insp_normal: "靈光一閃 - 一般",
    insp_divine: "靈光一閃 - 神之靈光一閃",
    insp_monster: "靈光一閃 - 怪物牌靈光",

    remove_normal: "移除 - 一般＆中立",
    remove_divine: "移除 - 起始＆神閃",

    copy_normal: "複製 - 一般",
    copy_insp: "複製 - 靈光一閃",
    copy_divine: "複製 - 神閃",
    copy_monster_insp: "複製 - 怪物牌靈光",
    copy_monster_divine: "複製 - 怪物牌神閃",

    convert_normal: "轉換 - 一般",
    convert_neutral: "轉換 - 中立",
    convert_monster: "轉換 - 怪物",

    forbidden: "賽季 - 禁忌卡牌"
};

// 每個角色的操作紀錄陣列
const histories = [[], [], []]; // 每個元素: { type, points }

// ========= Tier & 上限處理 =========
const tierInput = document.getElementById("tier");
const tierValue = document.getElementById("tierValue");
const tierLimitLabel = document.getElementById("tierLimit");
const overallTotalLabel = document.getElementById("overallTotal");
const remainingPointsLabel = document.getElementById("remainingPoints");
const limitStatus = document.getElementById("limitStatus");

const sumChar0 = document.getElementById("sumChar0");
const sumChar1 = document.getElementById("sumChar1");
const sumChar2 = document.getElementById("sumChar2");
const sumAll = document.getElementById("sumAll");
const sumLimit = document.getElementById("sumLimit");
const sumRemain = document.getElementById("sumRemain");

function tierLimit(tier) {
    return TIER_BASE + TIER_STEP * tier; // 符合你提供的 Tier1=30, Tier2=40...
}

function updateTierDisplay() {
    const tier = parseInt(tierInput.value, 10);
    const limit = tierLimit(tier);

    tierValue.textContent = tier;
    tierLimitLabel.textContent = limit;
    sumLimit.textContent = limit;

    // 重新用目前總分更新剩餘空間
    const total = calculateAllTotals().grandTotal;
    const remain = limit - total;
    remainingPointsLabel.textContent = remain;
    sumRemain.textContent = remain;
    overallTotalLabel.textContent = total;
    sumAll.textContent = total;

    updateLimitStatus(remain);
}

function updateLimitStatus(remain) {
    limitStatus.classList.remove("status-ok", "status-warn", "status-bad");
    if (remain > 10) {
        limitStatus.textContent = "（未超過上限）";
        limitStatus.classList.add("status-ok");
    } else if (remain >= 0) {
        limitStatus.textContent = "（接近上限）";
        limitStatus.classList.add("status-warn");
    } else {
        limitStatus.textContent = `（已超過上限 ${Math.abs(remain)} pt）`;
        limitStatus.classList.add("status-bad");
    }
}

tierInput.addEventListener("input", updateTierDisplay);

// ========= 計分邏輯 =========
function recalcCharacter(charIndex) {
    const history = histories[charIndex];
    let removeCount = 0;
    let copyCount = 0;
    let total = 0;

    for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        const type = entry.type;
        let pts = 0;
        let detail = "";

        switch (type) {
            // 新增本身不計分（可以視覺用途／紀錄 deck 變化）
            case "add_neutral":
                pts = 10;
                detail = "新增中立牌（10分）";
                break;
            case "add_monster":
                pts = 80;
                detail = "新增怪物牌（80分）";
                break;

            // 靈光一閃
            case "insp_normal":
                pts = POINTS_INSP_NORMAL;
                detail = `靈光一閃 +${POINTS_INSP_NORMAL}`;
                break;
            case "insp_divine":
                pts = POINTS_INSP_DIVINE;
                detail = `神閃 +${POINTS_INSP_DIVINE}`;
                break;
            case "insp_monster":
                pts = POINTS_INSP_MONSTER;
                detail = `怪物牌靈光一閃 +${POINTS_INSP_MONSTER}`;
                break;

            // 移除：遞增計分 + 神閃／起始額外 +20
            case "remove_normal":
                removeCount++;
                pts = stepCost(removeCount);
                detail = `第 ${removeCount} 次移除（一般/中立），+${pts}`;
                break;
            case "remove_divine":
                removeCount++;
                pts = stepCost(removeCount) + 20; // +20 for 起始/神閃
                detail = `第 ${removeCount} 次移除（起始/神閃），基本+${stepCost(removeCount)} + 起始/神閃 +20`;
                break;

            // 複製：遞增計分 + 被複製卡本身的點數
            case "copy_normal":
                copyCount++;
                pts = stepCost(copyCount);
                detail = `第 ${copyCount} 次複製（一般），+${pts}`;
                break;
            case "copy_insp":
                copyCount++;
                pts = stepCost(copyCount) + POINTS_INSP_NORMAL;
                detail = `第 ${copyCount} 次複製（靈光），基本+${stepCost(copyCount)} + 靈光 ${POINTS_INSP_NORMAL}`;
                break;
            case "copy_divine":
                copyCount++;
                pts = stepCost(copyCount) + POINTS_INSP_DIVINE;
                detail = `第 ${copyCount} 次複製（神閃），基本+${stepCost(copyCount)} + 神閃 ${POINTS_INSP_DIVINE}`;
                break;
            case "copy_monster_insp":
                copyCount++;
                pts = stepCost(copyCount) + POINTS_INSP_MONSTER;
                detail = `第 ${copyCount} 次複製（怪物牌靈光），基本+${stepCost(copyCount)} + ${POINTS_INSP_MONSTER}`;
                break;
            case "copy_monster_divine":
                copyCount++;
                // 這裡假設：怪物牌 + 靈光 + 神閃 = 80 + 20
                pts = stepCost(copyCount) + POINTS_INSP_MONSTER + POINTS_INSP_DIVINE;
                detail = `第 ${copyCount} 次複製（怪物牌神閃），基本+${stepCost(copyCount)} + 怪物靈光 ${POINTS_INSP_MONSTER} + 神閃 ${POINTS_INSP_DIVINE}`;
                break;

            // 轉換：每次 10pt，若轉成有記點要素可以再加（這裡示範加上）
            case "convert_normal":
                pts = POINTS_CONVERT;
                detail = `轉換（一般）+${POINTS_CONVERT}`;
                break;
            case "convert_neutral":
                // 轉換 + 變成中立靈光可記點（示範：10 + 20）
                pts = POINTS_CONVERT + POINTS_INSP_NORMAL;
                detail = `轉換成中立卡 + 靈光 +${POINTS_CONVERT}+${POINTS_INSP_NORMAL}`;
                break;
            case "convert_monster":
                // 轉換 + 變成怪物靈光可記點（示範：10 + 80）
                pts = POINTS_CONVERT + POINTS_INSP_MONSTER;
                detail = `轉換成怪物卡 + 靈光 +${POINTS_CONVERT}+${POINTS_INSP_MONSTER}`;
                break;

            // 禁忌卡牌
            case "forbidden":
                pts = POINTS_FORBIDDEN;
                detail = `禁忌卡牌 +${POINTS_FORBIDDEN}`;
                break;

            default:
                pts = 0;
                detail = "";
        }

        entry.points = pts;
        entry.detail = detail;
        total += pts;
    }

    return { total };
}

function calculateAllTotals() {
    const perChar = histories.map((_, idx) => recalcCharacter(idx).total);
    const grandTotal = perChar.reduce((a, b) => a + b, 0);
    return { perChar, grandTotal };
}

// ========= Render =========
function render() {
    const { perChar, grandTotal } = calculateAllTotals();

    const chars = document.querySelectorAll(".character");
    chars.forEach((charEl) => {
        const charIndex = parseInt(charEl.dataset.char, 10);
        const listEl = charEl.querySelector(".action-list");
        const totalEl = charEl.querySelector(".char-total-value");

        listEl.innerHTML = "";
        const history = histories[charIndex];

        history.forEach((entry, idx) => {
            const li = document.createElement("li");

            const main = document.createElement("div");
            main.className = "action-main";

            const title = document.createElement("div");
            title.className = "action-type";
            title.textContent = `${idx + 1}. ${ACTION_LABELS[entry.type] || entry.type}`;

            const meta = document.createElement("div");
            meta.className = "action-meta";
            meta.textContent = `${entry.detail || ""}（+${entry.points} pt）`;

            main.appendChild(title);
            main.appendChild(meta);

            const delBtn = document.createElement("button");
            delBtn.className = "delete-action";
            delBtn.textContent = "✕";
            delBtn.dataset.char = String(charIndex);
            delBtn.dataset.idx = String(idx);

            li.appendChild(main);
            li.appendChild(delBtn);

            listEl.appendChild(li);
        });

        totalEl.textContent = perChar[charIndex];
    });

    // 更新頂部 / 總結的總分 & 上限狀態
    const tier = parseInt(tierInput.value, 10);
    const limit = tierLimit(tier);
    const remain = limit - grandTotal;

    overallTotalLabel.textContent = grandTotal;
    remainingPointsLabel.textContent = remain;
    sumChar0.textContent = perChar[0];
    sumChar1.textContent = perChar[1];
    sumChar2.textContent = perChar[2];
    sumAll.textContent = grandTotal;
    sumLimit.textContent = limit;
    sumRemain.textContent = remain;

    updateLimitStatus(remain);
}

// ========= 事件綁定 =========
// 按鈕：新增一個操作
document.getElementById("characters").addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    // 操作按鈕
    if (target.dataset.action) {
        const charEl = target.closest(".character");
        if (!charEl) return;
        const charIndex = parseInt(charEl.dataset.char, 10);
        const actionType = target.dataset.action;

        histories[charIndex].push({ type: actionType, points: 0, detail: "" });
        render();
    }

    // 刪除某一步
    if (target.classList.contains("delete-action")) {
        const charIndex = parseInt(target.dataset.char, 10);
        const idx = parseInt(target.dataset.idx, 10);
        histories[charIndex].splice(idx, 1);
        render();
    }
});

// 初始化
updateTierDisplay();
render();