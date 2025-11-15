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
    const ptValueEl = cardEl.matches(".card") ? cardEl.querySelector(".card-pt").lastElementChild : null;
    let overallPoint = 0;

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

        ptValueEl.textContent = overallPoint;
        updateTotalPoint(charEl);
        return;
    }

    if (cardInfo.source == "convert")
        overallPoint += 10;

    switch (cardInfo.type) {
        case "standard":
        case "unique":
            if (cardInfo.insp == "divine")
                overallPoint += 20;
            break;
        case "neutral":
            overallPoint += 20;
            if (cardInfo.insp == "insp")
                overallPoint += 10;
            else if (cardInfo.insp == "divine")
                overallPoint += 30;
            break;
        case "monster":
            overallPoint += 80;
            if (cardInfo.insp == "insp")
                overallPoint += 10;
            else if (cardInfo.insp == "divine")
                overallPoint += 30;
            break;
    }

    ptValueEl.textContent = overallPoint;
    updateTotalPoint(charEl);
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
    monster: "怪物"
};

function addControl(cardEl, action) {
    const controlEl = cardEl.querySelector(".card-control");
    const buttonEl = document.createElement("button");

    //buttonEl.className = "control-button";
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
        insp: null
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

    const controlEl = document.createElement("div");
    controlEl.className = "card-control";

    ptEl.appendChild(ptLabEl);
    ptEl.appendChild(ptValueEl);
    cardEl.appendChild(titleEl);
    cardEl.appendChild(ptEl);
    cardEl.appendChild(controlEl);

    cardsEl.insertBefore(cardEl, cardsEl.lastElementChild);

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

    calculatePoint(newEl);
}

function getCardInf(cardEl) {
    const charEl = cardEl.closest(".character");
    const charIndex = [...charsEl.children].indexOf(charEl);
    const cardIndex = [...cardEl.parentElement.children].indexOf(cardEl);

    return characters[charIndex][cardIndex];
}

document.addEventListener("click", (e) => {
    if (!e.target.closest('.card-control'))
        return;

    const action = e.target.dataset.action;
    const charEl = e.target.closest(".character");

    if (["unique", "neutral", "monster"].includes(action)) {
        addCard(charEl, action);
        return;
    }

    const cardEl = e.target.closest(".card") ?? e.target.closest(".new-card");

    if (action == "copy") {
        copyCard(cardEl);
        return;
    }

    const controlEl = e.target.closest(".card-control");
    const cardInfo = getCardInf(cardEl);
    const charIndex = [...charsEl.children].indexOf(charEl);

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
            cardInfo.type = "neutral";
            cardInfo.source = "convert";
            cardInfo.insp = null;
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "insp");
            addControl(cardEl, "divine");
            addControl(cardEl, "convert_monster");
            break;
        case "convert_monster":
            cardInfo.type = "monster";
            cardInfo.source = "convert";
            cardInfo.insp = null;
            addControl(cardEl, "remove");
            addControl(cardEl, "copy");
            addControl(cardEl, "insp");
            addControl(cardEl, "divine");
            addControl(cardEl, "convert_neutral");
            break;
    }

    calculatePoint(cardEl);
});

function init() {
    const newCardEls = document.querySelectorAll(".new-card");
    newCardEls.forEach(element => {
        addControl(element, "unique");
        addControl(element, "neutral");
        addControl(element, "monster");
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