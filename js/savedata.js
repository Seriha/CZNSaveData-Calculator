const tierInput = document.getElementById("tier");
const tierValue = document.getElementById("tierValue");
const tierLimitLabel = document.getElementById("tierLimit");
const limitStatus = document.getElementById("limitStatus");

const charsEl = document.querySelector(".characters");

let ptLimit = 0

function updateTierDisplay() {
    const tier = parseInt(tierInput.value, 10);
    ptLimit = 20 + 10 * tier;

    tierValue.textContent = tier;
    tierLimitLabel.textContent = ptLimit;

    [...charsEl.children].forEach(element => {
        updateTotalPoint(element);
    });
}

tierInput.addEventListener("input", updateTierDisplay);
updateTierDisplay();

const characters = [[], [], []];
const charRemoveCards = [[], [], []];
const charCopyCards = [[], [], []];

function calculatePoint(cardEl) {
    const cardInfo = getCardInf(cardEl);
    const charEl = cardEl.closest(".character");
    const charIndex = [...charsEl.children].indexOf(charEl);
    let overallPoint = 0;

    const details = [];

    if (cardInfo.convert > 0) {
        overallPoint += cardInfo.convert * 10;
        details.push(`轉換(${cardInfo.convert})`);
    }

    const copyIndex = charCopyCards[charIndex].indexOf(cardEl) + 1;
    if (copyIndex > 0) {
        if (copyIndex >= 5)
            overallPoint += 70;
        else if (copyIndex == 4)
            overallPoint += 50;
        else if (copyIndex == 3)
            overallPoint += 30;
        else if (copyIndex == 2)
            overallPoint += 10;

        details.push(`${actions["copy"]}(${copyIndex})`);
    }

    const removeIndex = charRemoveCards[charIndex].indexOf(cardEl) + 1;
    if (removeIndex > 0) {
        if (removeIndex >= 5)
            overallPoint += 70;
        else if (removeIndex == 4)
            overallPoint += 50;
        else if (removeIndex == 3)
            overallPoint += 30;
        else if (removeIndex == 2)
            overallPoint += 10;

        const cardIndex = [...cardEl.parentElement.children].indexOf(cardEl);

        if (cardIndex < 4)
            if (cardInfo.type == "standard" || cardInfo.type == "unique") {
                details.push("移除起始");
                overallPoint += 20;
            }
        else if (cardInfo.type == "unique") {
            details.push("移除獨特");
            overallPoint += 20;
        }

        details.push(`${actions["remove"]}(${removeIndex})`);
    }
    else {
        if (cardInfo.source == "convert")
            overallPoint += 10;

        switch (cardInfo.type) {
            case "standard":
            case "unique":
                if (cardInfo.insp == "divine") {
                    overallPoint += 20;
                    details.push(actions["divine"]);
                }
                break;
            case "neutral":
                overallPoint += 20;
                details.push(cardTypes["neutral"]);
                if (cardInfo.insp == "insp") {
                    overallPoint += 10;
                    details.push(actions["insp"]);
                }
                else if (cardInfo.insp == "divine") {
                    overallPoint += 30;
                    details.push(actions["divine"]);
                }
                break;
            case "monster":
                overallPoint += 80;
                details.push(cardTypes["monster"]);
                if (cardInfo.insp == "insp") {
                    overallPoint += 10;
                    details.push(actions["insp"]);
                }
                else if (cardInfo.insp == "divine") {
                    overallPoint += 30;
                    details.push(actions["divine"]);
                }
                break;
            case "taboo":
                overallPoint += 20;
                details.push(cardTypes["taboo"]);
                if (cardInfo.insp == "insp") {
                    overallPoint += 10;
                    details.push(actions["insp"]);
                }
                else if (cardInfo.insp == "divine") {
                    overallPoint += 30;
                    details.push(actions["divine"]);
                }
                break;
        }
    }

    const ptValueEl = cardEl.matches(".card") ? cardEl.querySelector(".card-pt").lastElementChild : null;
    ptValueEl.textContent = overallPoint;

    updateTotalPoint(charEl);

    const cardIndex = [...cardEl.parentElement.children].indexOf(cardEl);
    const ptDetailsEl = [...charEl.querySelector(".char-pt-details").children][cardIndex];
    const ptDetailList = [...ptDetailsEl.childNodes];
    ptDetailList.shift();

    ptDetailList.forEach(child => ptDetailsEl.removeChild(child));

    details.forEach(detail => {
        const detailEl = document.createElement("span");
        detailEl.textContent = detail;

        ptDetailsEl.appendChild(detailEl);
    });

    const ptEl = document.createElement("span");
    ptEl.textContent = `${overallPoint}pt`;

    ptDetailsEl.appendChild(ptEl);
}

function updateTotalPoint(charEl) {
    let overallPoint = 0.0;
    charEl.querySelectorAll(".card-pt").forEach(element => {
        overallPoint += parseInt(element.lastElementChild.textContent);
    })

    const ratio = overallPoint / ptLimit * 100;
    const ptEl = charEl.querySelector(".char-pt");
    ptEl.style.setProperty("--point-ratio", `${ratio}%`);

    ptEl.classList.toggle("warn", false);
    ptEl.classList.toggle("over", false);

    if (ratio > 100)
        ptEl.classList.toggle("over", true);
    else if (ratio > 80)
        ptEl.classList.toggle("warn", true);

    charEl.querySelector(".char-pt-value").textContent = overallPoint;
}

const actions = {
    unique: "獨特",
    neutral: "中立",
    monster: "怪物",
    taboo: "禁忌",
    remove: "移除",
    copy: "複製",
    insp: "一閃",
    divine: "神閃",
    convert_neutral: "轉換中立卡",
    convert_monster: "轉換怪物卡"
};

const cardTypes = {
    standard: "基礎",
    unique: "獨特",
    neutral: "中立",
    monster: "怪物",
    taboo: "禁忌"
};

function addControl(cardEl, action) {
    const controlEl = cardEl.querySelector(".card-control");
    const buttonEl = document.createElement("button");

    buttonEl.dataset.action = action;
    buttonEl.textContent = actions[action];

    controlEl.appendChild(buttonEl);
}

function addCard(charEl, cardType) {
    const cardsEl = charEl.querySelector(".char-cards");
    const charIndex = [...charEl.parentElement.children].indexOf(charEl);

    const cardInfo = {
        type: cardType,
        source: null,
        insp: null,
        convert: 0
    }

    characters[charIndex].push(cardInfo);

    const cardEl = document.createElement("div");
    cardEl.className = "card";

    const titleEl = document.createElement("div");
    titleEl.className = "card-title";
    titleEl.textContent = cardTypes[cardType];

    const ptEl = document.createElement("div");
    ptEl.className = "card-pt";

    const ptLabEl = document.createElement("span");
    ptLabEl.textContent = "pt:";

    const ptValueEl = document.createElement("span");

    const moTrigger = document.createElement("div");
    moTrigger.className = "card-mobile-trigger";

    const controlEl = document.createElement("div");
    controlEl.className = "card-control";

    ptEl.appendChild(ptLabEl);
    ptEl.appendChild(ptValueEl);
    cardEl.appendChild(titleEl);
    cardEl.appendChild(ptEl);
    cardEl.appendChild(moTrigger);
    cardEl.appendChild(controlEl);

    cardsEl.insertBefore(cardEl, cardsEl.lastElementChild);

    addDetail(charEl);
    calculatePoint(cardEl);

    switch (cardType) {
        case "standard":
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "convert_neutral");
            addControl(cardEl, "convert_monster");
            break;
        case "unique":
        case "neutral":
        case "monster":
        case "taboo":
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "insp");
            addControl(cardEl, "divine");
            addControl(cardEl, "convert_neutral");
            addControl(cardEl, "convert_monster");
            break;
    }
}

function copyCard(cardEl) {
    const charEl = cardEl.closest(".character");
    const charIndex = [...charsEl.children].indexOf(charEl);
    const cardsEl = cardEl.parentElement;

    const newEl = cardEl.cloneNode(true);
    cardsEl.insertBefore(newEl, cardsEl.lastElementChild);
    charCopyCards[charIndex].push(newEl);

    const cardInfo = getCardInf(cardEl);
    const newInfo = {
        type: cardInfo.type,
        source: null,
        insp: cardInfo.insp
    }

    characters[charIndex].push(newInfo);

    addDetail(charEl);
    calculatePoint(newEl);
}

function addDetail(charEl) {
    const detailsEl = charEl.querySelector(".char-pt-details");

    const itemEl = document.createElement("div");
    itemEl.className = "char-pt-detail-item";

    const indexEl = document.createElement("span");
    indexEl.textContent = `#${detailsEl.children.length + 1}`;

    const ptEl = document.createElement("span");
    ptEl.textContent = "0pt";

    itemEl.appendChild(indexEl);
    itemEl.appendChild(ptEl);
    detailsEl.appendChild(itemEl);
}

function getCardInf(cardEl) {
    const charEl = cardEl.closest(".character");
    const charIndex = [...charsEl.children].indexOf(charEl);
    const cardIndex = [...cardEl.parentElement.children].indexOf(cardEl);

    return characters[charIndex][cardIndex];
}

document.addEventListener("click", e => {
    if (!e.target.matches(".card-control button"))
        return;


    const action = e.target.dataset.action;
    const charEl = e.target.closest(".character");
    const cardEl = e.target.closest(".card") ?? e.target.closest(".new-card");

    cardEl.classList.toggle("active", false)

    if (["unique", "neutral", "monster", "taboo"].includes(action)) {
        addCard(charEl, action);
        return;
    }

    if (action == "copy") {
        copyCard(cardEl);
        return;
    }

    const controlEl = e.target.closest(".card-control");
    const cardInfo = getCardInf(cardEl);
    const charIndex = [...charsEl.children].indexOf(charEl);
    const titleEl = cardEl.querySelector(".card-title");

    [...controlEl.childNodes].forEach(child => controlEl.removeChild(child));

    switch (action) {
        case "remove":
            cardEl.classList.toggle("remove", true);
            charRemoveCards[charIndex].push(cardEl);
            break;
        case "insp":
            cardInfo.insp = "insp";
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "convert_neutral");
            addControl(cardEl, "convert_monster");
            break;
        case "divine":
            cardInfo.insp = "divine";
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "convert_neutral");
            addControl(cardEl, "convert_monster");
            break;
        case "convert_neutral":
            titleEl.textContent = cardTypes["neutral"];
            cardInfo.type = "neutral";
            cardInfo.source = "convert";
            cardInfo.insp = null;
            cardInfo.convert += 1;
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "insp");
            addControl(cardEl, "divine");
            addControl(cardEl, "convert_monster");
            break;
        case "convert_monster":
            titleEl.textContent = cardTypes["monster"];
            cardInfo.type = "monster";
            cardInfo.source = "convert";
            cardInfo.insp = null;
            cardInfo.convert += 1;
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "insp");
            addControl(cardEl, "divine");
            addControl(cardEl, "convert_neutral");
            break;
    }

    calculatePoint(cardEl);
});

document.addEventListener("click", e => {
    if (!e.target.classList.contains("card-mobile-trigger"))
        return;

    [...document.querySelectorAll(":is(.card, .new-card).active")].forEach(el => el.classList.toggle("active", false));
    e.target.closest(":is(.card, .new-card)").classList.toggle("active", true);
});

document.addEventListener("click", e => {
    if (!e.target.classList.contains("btn-toggle-remove"))
        return;

    e.target.closest(".char-layout").querySelector(".char-cards").classList.toggle("hide-remove");
});

function init() {
    const newCardEls = document.querySelectorAll(".new-card");
    newCardEls.forEach(element => {
        addControl(element, "unique");
        addControl(element, "neutral");
        addControl(element, "monster");
        addControl(element, "taboo");
    });

    const characterEls = document.querySelectorAll(".character");
    characterEls.forEach(element => {
        addCard(element, "standard");
        addCard(element, "standard");
        addCard(element, "standard");
        addCard(element, "unique");
    });
}

init();