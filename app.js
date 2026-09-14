"use strict";


/* ============================================================
   CHARACTER PACKS
============================================================ */

const characters = {
  noctis: {
    id: "noctis",
    name: "Noctis",
    path: "assets/characters/noctis/",

    animations: {
      idle: {
        right: "idle.gif",
        left: "idle-left.gif"
      },

      idleFront: {
        right: "idle-front.gif",
        left: "idle-front.gif"
      },

      chaseBall: {
        right: "chase-ball.gif",
        left: "chase-ball.gif"
      },

      clean: {
        right: "clean.gif",
        left: "clean.gif"
      },

      happy: {
        right: "happy.gif",
        left: "happy-left.gif"
      },

      sad: {
        right: "sad.gif",
        left: "sad-left.gif"
      },

      angry: {
        right: "angry.gif",
        left: "angry-left.gif"
      },

      bored: {
        right: "bored.gif",
        left: "bored-left.gif"
      },

      hungry: {
        right: "hungry.gif",
        left: "hungry-left.gif"
      },

      sick: {
        right: "sick.gif",
        left: "sick-left.gif"
      },

      sleepy: {
        right: "sleepy.gif",
        left: "sleepy-left.gif"
      },

      lieDown: {
        right: "lie-down.gif",
        left: "lie-down.gif"
      },

      sleep: {
        right: "sleep.gif",
        left: "sleep-left.gif"
      },

      wakeUp: {
        right: "wake-up.gif",
        left: "wake-up-left.gif"
      },

      eat: {
        right: "eat.gif",
        left: "eat-left.gif"
      },

      walk: {
        right: "walk-right.gif",
        left: "walk-left.gif"
      },

      jump: {
        right: "jump-right.gif",
        left: "jump-left.gif"
      },

      bound: {
        right: "bound-right.gif",
        left: "bound-left.gif"
      },

      death: {
        right: "death.gif",
        left: "death-left.gif"
      }
    }
  }
};


/* ============================================================
   APP CONSTANTS
============================================================ */

const SLOT_COUNT = 4;

const APP_SAVE_KEY =
  "pocketFurry_app_v1";

const SAVE_VERSION = 5;

const MAX_STAT = 100;

const ENERGY_DRAIN_PER_MINUTE =
  100 / (16 * 60);

const ENERGY_RECOVERY_PER_MINUTE =
  100 / 10;

const EXHAUSTED_THRESHOLD = 10;

const HEALTH_RECOVERY_PER_MINUTE =
  100 / (24 * 60);

const HEALTH_DRAIN_PER_MINUTE =
  100 / (24 * 60);

const FOOD_HEALTH_RECOVERY = 25;

const HEALTH_MIN_HUNGER = 20;
const HEALTH_MIN_HAPPINESS = 25;
const HEALTH_MIN_CLEANLINESS = 25;

const FOOD_DURATION_MS =
  24 * 60 * 60 * 1000;

const SICK_HUNGER_MS =
  48 * 60 * 60 * 1000;

const SIT_SAD_MS =
  15 * 60 * 1000;

const SIT_ANGRY_MS =
  30 * 60 * 1000;

const GAME_TICK_INTERVAL =
  30 * 1000;

const FETCH_DURATION_MS = 3030;
const CLEAN_DURATION_MS = 5390;

const WALK_SPEED = 38;
const BOUND_SPEED = 120;

const WALK_MARGIN = 0;
const MIN_PAUSE_MS = 2200;
const MAX_PAUSE_MS = 6200;
const MIN_TRAVEL_DISTANCE = 35;

const MIDSCREEN_STOP_CHANCE = 0.30;
const CONTINUE_DIRECTION_CHANCE = 0.60;

const MOOD_REACTION_CHANCE = 0.07;
const BOUND_CHANCE = 0.12;
const BORED_CHANCE = 0.22;

const SWIPE_DISTANCE = 28;
const LONG_PRESS_TIME = 700;


/* ============================================================
   ACTIVE GAME STATE
============================================================ */

let activeSlotIndex = null;
let activeCharacterId = null;
let activeDirection = "right";

let animationPlayId = 0;

let state = null;

let appState =
  loadAppState();

let currentScreen = "main";

let mainMenuIndex = 0;
let pickerIndex = 0;

let pendingSlotIndex = null;

let selectedAction = 0;

let interactionMode = false;
let statusCardVisible = false;

let currentAnimation = "";
let currentAnimationDirection = "";

let temporaryAnimation = false;

let animationTimer = null;
let sleepTimer = null;

let walking = false;
let walkTimer = null;
let ambientTimer = null;

let currentX = 0;
let nextWalkDirection = "right";

let pointerStartX = 0;
let pointerStartY = 0;

let longPressTimer = null;
let longPressTriggered = false;

let messageTimer = null;


/* ============================================================
   DEFAULT STATE
============================================================ */

function createDefaultState() {
  const now =
    Date.now();

  return {
    hunger: 100,
    happiness: 85,
    energy: 100,
    health: 100,
    cleanliness: 100,

    sleeping: false,
    forcedSleep: false,

    forcedSit: false,
    sitStartedAt: null,

    recoveryMood: "happy",

    alive: true,

    lastUpdate: now,
    lastMealAt: now,
    lastInteraction: now
  };
}


/* ============================================================
   SAVE / LOAD
============================================================ */

function blankAppState() {
  return {
    slots:
      Array(
        SLOT_COUNT
      ).fill(
        null
      )
  };
}


function getSlotSaveKey(
  slotIndex,
  characterId
) {
  return (
    "pocketFurry_slot_" +
    slotIndex +
    "_" +
    characterId +
    "_v" +
    SAVE_VERSION
  );
}


function loadAppState() {
  const raw =
    localStorage.getItem(
      APP_SAVE_KEY
    );

  if (raw) {
    try {
      const parsed =
        JSON.parse(raw);

      const slots =
        Array.isArray(
          parsed.slots
        )
          ? parsed.slots.slice(
              0,
              SLOT_COUNT
            )
          : [];

      while (
        slots.length <
        SLOT_COUNT
      ) {
        slots.push(null);
      }

      return {
        slots
      };

    } catch {
      // Continue to migration.
    }
  }


  /*
     MIGRATE EXISTING PRE-MENU
     NOCTIS SAVE INTO SLOT 1.
  */

  const migrated =
    blankAppState();

  const legacyKey =
    `pocketFurry_noctis_v${SAVE_VERSION}`;

  const legacyState =
    localStorage.getItem(
      legacyKey
    );

  if (legacyState) {
    migrated.slots[0] = {
      characterId:
        "noctis",

      createdAt:
        Date.now()
    };

    localStorage.setItem(
      getSlotSaveKey(
        0,
        "noctis"
      ),
      legacyState
    );
  }

  localStorage.setItem(
    APP_SAVE_KEY,
    JSON.stringify(
      migrated
    )
  );

  return migrated;
}


function saveAppState() {
  localStorage.setItem(
    APP_SAVE_KEY,
    JSON.stringify(
      appState
    )
  );
}


function saveState() {
  if (
    activeSlotIndex === null ||
    !activeCharacterId ||
    !state
  ) {
    return;
  }

  state.lastUpdate =
    Date.now();

  localStorage.setItem(
    getSlotSaveKey(
      activeSlotIndex,
      activeCharacterId
    ),
    JSON.stringify(
      state
    )
  );
}


function loadSlotState(
  slotIndex,
  characterId
) {
  const defaults =
    createDefaultState();

  const raw =
    localStorage.getItem(
      getSlotSaveKey(
        slotIndex,
        characterId
      )
    );

  if (!raw) {
    return defaults;
  }

  try {
    const loaded =
      JSON.parse(raw);

    return {
      ...defaults,
      ...loaded,

      lastMealAt:
        loaded.lastMealAt ||
        Date.now(),

      recoveryMood:
        loaded.recoveryMood ||
        "happy"
    };

  } catch {
    return defaults;
  }
}


function createCompanion(
  slotIndex,
  characterId
) {
  if (
    slotIndex < 0 ||
    slotIndex >= SLOT_COUNT ||
    !characters[
      characterId
    ]
  ) {
    return;
  }

  appState.slots[
    slotIndex
  ] = {
    characterId,

    createdAt:
      Date.now()
  };

  saveAppState();

  const newState =
    createDefaultState();

  localStorage.setItem(
    getSlotSaveKey(
      slotIndex,
      characterId
    ),
    JSON.stringify(
      newState
    )
  );

  openCompanion(
    slotIndex
  );
}


/* ============================================================
   DOM
============================================================ */

const app =
  document.getElementById(
    "app"
  );

const mainMenuScreen =
  document.getElementById(
    "mainMenuScreen"
  );

const pickerScreen =
  document.getElementById(
    "pickerScreen"
  );

const gameScreen =
  document.getElementById(
    "gameScreen"
  );

const companionList =
  document.getElementById(
    "companionList"
  );

const characterPickerList =
  document.getElementById(
    "characterPickerList"
  );

const characterSprite =
  document.getElementById(
    "character"
  );

const characterMover =
  document.getElementById(
    "characterMover"
  );

const petStage =
  document.getElementById(
    "petStage"
  );

const actionTray =
  document.getElementById(
    "actionTray"
  );

const controlHint =
  document.getElementById(
    "controlHint"
  );

const message =
  document.getElementById(
    "message"
  );

const statusCard =
  document.getElementById(
    "statusCard"
  );

const statusCardTitle =
  document.getElementById(
    "statusCardTitle"
  );

const moodEmoji =
  document.getElementById(
    "moodEmoji"
  );

const healthBar =
  document.getElementById(
    "healthBar"
  );

const hungerBar =
  document.getElementById(
    "hungerBar"
  );

const cleanlinessBar =
  document.getElementById(
    "cleanlinessBar"
  );

const energyBar =
  document.getElementById(
    "energyBar"
  );

const happinessValue =
  document.getElementById(
    "happinessValue"
  );

const hungerValue =
  document.getElementById(
    "hungerValue"
  );

const energyValue =
  document.getElementById(
    "energyValue"
  );

const healthValue =
  document.getElementById(
    "healthValue"
  );

const cleanValue =
  document.getElementById(
    "cleanValue"
  );

const detailHappiness =
  document.getElementById(
    "detailHappiness"
  );

const detailHunger =
  document.getElementById(
    "detailHunger"
  );

const detailEnergy =
  document.getElementById(
    "detailEnergy"
  );

const detailHealth =
  document.getElementById(
    "detailHealth"
  );

const detailClean =
  document.getElementById(
    "detailClean"
  );

const actionButtons = [
  ...document.querySelectorAll(
    ".action"
  )
];

const actions = [
  "feed",
  "play",
  "pet",
  "clean",
  "sit",
  "sleep",
  "medicine"
];


/* ============================================================
   HELPERS
============================================================ */

function clamp(value) {
  return Math.max(
    0,
    Math.min(
      MAX_STAT,
      value
    )
  );
}


function rounded(value) {
  return Math.round(
    clamp(value)
  );
}


function randomBetween(
  min,
  max
) {
  return (
    min +
    Math.random() *
    (max - min)
  );
}


function getActiveCharacter() {
  return activeCharacterId
    ? characters[
        activeCharacterId
      ]
    : null;
}


/* ============================================================
   SCREEN HANDLING
============================================================ */

function showOnlyScreen(
  screenName
) {
  currentScreen =
    screenName;

  mainMenuScreen.classList.toggle(
    "hidden",
    screenName !== "main"
  );

  pickerScreen.classList.toggle(
    "hidden",
    screenName !== "picker"
  );

  gameScreen.classList.toggle(
    "hidden",
    screenName !== "game"
  );
}


/* ============================================================
   MAIN MENU
============================================================ */

function getStateSummary(
  slotIndex,
  characterId
) {
  const saved =
    loadSlotState(
      slotIndex,
      characterId
    );

  if (!saved.alive) {
    return "Gone";
  }

  let mood =
    "Okay";

  if (
    saved.recoveryMood ===
      "angry" ||
    saved.happiness < 15
  ) {
    mood =
      "Upset";

  } else if (
    saved.recoveryMood ===
      "sad" ||
    saved.happiness < 35
  ) {
    mood =
      "Sad";

  } else if (
    saved.happiness >= 85
  ) {
    mood =
      "Happy";

  } else if (
    saved.happiness >= 60
  ) {
    mood =
      "Content";
  }

  const sleep =
    saved.sleeping
      ? "Asleep"
      : "Awake";

  return (
    `${mood} • ${sleep}`
  );
}


function getFirstEmptySlot() {
  return appState.slots.findIndex(
    slot =>
      !slot
  );
}


function getMainMenuButtons() {
  return [
    ...companionList.querySelectorAll(
      ".list-item:not(.placeholder)"
    )
  ];
}


function renderMainMenu() {
  companionList.innerHTML =
    "";


  /*
     EXISTING COMPANIONS
  */

  appState.slots.forEach(
    (
      slot,
      slotIndex
    ) => {

      if (
        !slot ||
        !characters[
          slot.characterId
        ]
      ) {
        return;
      }

      const character =
        characters[
          slot.characterId
        ];

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "list-item focusable companion-entry";

      button.dataset.kind =
        "companion";

      button.dataset.slotIndex =
        String(
          slotIndex
        );

      button.innerHTML = `
        <span class="list-item-primary">
          ${character.name.toUpperCase()}
        </span>

        <span class="list-item-secondary">
          ${getStateSummary(
            slotIndex,
            slot.characterId
          )}
        </span>
      `;

      button.addEventListener(
        "focus",
        () => {
          const buttons =
            getMainMenuButtons();

          mainMenuIndex =
            buttons.indexOf(
              button
            );

          updateMainMenuSelection(
            false
          );
        }
      );

      button.addEventListener(
        "click",
        () => {

          openCompanion(
            slotIndex
          );
        }
      );

      companionList.appendChild(
        button
      );
    }
  );


  /*
     EXPLICIT NEW COMPANION BUTTON
  */

  const emptySlot =
    getFirstEmptySlot();

  const newButton =
    document.createElement(
      "button"
    );

  newButton.type =
    "button";

  newButton.className =
    "list-item focusable new-companion";

  newButton.dataset.kind =
    "new";


  if (
    emptySlot >= 0
  ) {
    newButton.innerHTML = `
      <span class="list-item-primary">
        ＋ NEW COMPANION
      </span>

      <span class="list-item-secondary">
        ADD A COMPANION
      </span>
    `;

    newButton.addEventListener(
      "click",
      () => {

        openCharacterPicker(
          getFirstEmptySlot()
        );
      }
    );

  } else {
    newButton.classList.add(
      "unavailable"
    );

    newButton.innerHTML = `
      <span class="list-item-primary">
        ＋ NEW COMPANION
      </span>

      <span class="list-item-secondary">
        NO EMPTY SLOTS
      </span>
    `;
  }


  newButton.addEventListener(
    "focus",
    () => {

      const buttons =
        getMainMenuButtons();

      mainMenuIndex =
        buttons.indexOf(
          newButton
        );

      updateMainMenuSelection(
        false
      );
    }
  );


  companionList.appendChild(
    newButton
  );


  /*
     DIVIDER
  */

  const divider =
    document.createElement(
      "div"
    );

  divider.className =
    "list-divider";

  companionList.appendChild(
    divider
  );


  /*
     EMPTY SLOT PLACEHOLDERS
  */

  appState.slots.forEach(
    (
      slot,
      slotIndex
    ) => {

      if (slot) {
        return;
      }

      const placeholder =
        document.createElement(
          "div"
        );

      placeholder.className =
        "list-item placeholder";

      placeholder.innerHTML = `
        <span class="list-item-primary">
          EMPTY SLOT
        </span>

        <span class="list-item-secondary">
          SLOT ${slotIndex + 1}
        </span>
      `;

      companionList.appendChild(
        placeholder
      );
    }
  );


  const buttons =
    getMainMenuButtons();

  if (!buttons.length) {
    return;
  }

  mainMenuIndex =
    Math.max(
      0,
      Math.min(
        mainMenuIndex,
        buttons.length - 1
      )
    );

  updateMainMenuSelection(
    false
  );
}


function updateMainMenuSelection(
  moveFocus = true
) {
  const buttons =
    getMainMenuButtons();

  if (!buttons.length) {
    return;
  }

  mainMenuIndex =
    (
      mainMenuIndex +
      buttons.length
    ) %
    buttons.length;

  buttons.forEach(
    (
      button,
      index
    ) => {

      button.classList.toggle(
        "selected",
        index ===
          mainMenuIndex
      );
    }
  );

  if (
    moveFocus &&
    buttons[
      mainMenuIndex
    ]
  ) {
    buttons[
      mainMenuIndex
    ].focus({
      preventScroll: true
    });
  }
}


function moveMainMenu(
  delta
) {
  const buttons =
    getMainMenuButtons();

  if (!buttons.length) {
    return;
  }

  mainMenuIndex =
    (
      mainMenuIndex +
      delta +
      buttons.length
    ) %
    buttons.length;

  updateMainMenuSelection(
    true
  );
}


function activateMainMenuSelection() {
  const buttons =
    getMainMenuButtons();

  const button =
    buttons[
      mainMenuIndex
    ];

  if (!button) {
    return;
  }

  if (
    button.dataset.kind ===
    "companion"
  ) {
    openCompanion(
      Number(
        button.dataset.slotIndex
      )
    );

    return;
  }


  if (
    button.dataset.kind ===
    "new"
  ) {
    const emptySlot =
      getFirstEmptySlot();

    if (
      emptySlot < 0
    ) {
      return;
    }

    openCharacterPicker(
      emptySlot
    );
  }
}


function openMainMenu() {
  if (
    currentScreen ===
    "game"
  ) {
    saveState();

    pauseAmbient();

    stopWalking();

    closeInteractionTray(
      false
    );

    hideStatusCard(
      false
    );
  }

  pendingSlotIndex =
    null;

  showOnlyScreen(
    "main"
  );

  renderMainMenu();

  requestAnimationFrame(
    () => {
      updateMainMenuSelection(
        true
      );
    }
  );
}


/* ============================================================
   CHARACTER PICKER
============================================================ */

function openCharacterPicker(
  slotIndex
) {
  if (
    slotIndex < 0 ||
    slotIndex >= SLOT_COUNT
  ) {
    return;
  }

  pendingSlotIndex =
    slotIndex;

  pickerIndex =
    0;

  renderCharacterPicker();

  showOnlyScreen(
    "picker"
  );

  requestAnimationFrame(
    () => {
      updatePickerSelection(
        true
      );
    }
  );
}


function renderCharacterPicker() {
  characterPickerList.innerHTML =
    "";

  const characterIds =
    Object.keys(
      characters
    );

  characterIds.forEach(
    (
      characterId,
      index
    ) => {

      const character =
        characters[
          characterId
        ];

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "list-item focusable";

      button.dataset.kind =
        "character";

      button.dataset.characterId =
        characterId;

      button.innerHTML = `
        <span class="list-item-primary">
          ${character.name.toUpperCase()}
        </span>

        <span class="list-item-secondary">
          SELECT COMPANION
        </span>
      `;

      button.addEventListener(
        "focus",
        () => {

          pickerIndex =
            index;

          updatePickerSelection(
            false
          );
        }
      );

      button.addEventListener(
        "click",
        () => {

          pickerIndex =
            index;

          activatePickerSelection();
        }
      );

      characterPickerList.appendChild(
        button
      );
    }
  );


  const backIndex =
    characterIds.length;

  const backButton =
    document.createElement(
      "button"
    );

  backButton.type =
    "button";

  backButton.className =
    "list-item focusable back";

  backButton.dataset.kind =
    "back";

  backButton.innerHTML = `
    <span class="list-item-primary">
      ‹ BACK
    </span>

    <span class="list-item-secondary">
      RETURN WITHOUT CREATING
    </span>
  `;

  backButton.addEventListener(
    "focus",
    () => {

      pickerIndex =
        backIndex;

      updatePickerSelection(
        false
      );
    }
  );

  backButton.addEventListener(
    "click",
    () => {

      pickerIndex =
        backIndex;

      activatePickerSelection();
    }
  );

  characterPickerList.appendChild(
    backButton
  );
}


function getPickerButtons() {
  return [
    ...characterPickerList.querySelectorAll(
      ".list-item"
    )
  ];
}


function updatePickerSelection(
  moveFocus = true
) {
  const buttons =
    getPickerButtons();

  if (!buttons.length) {
    return;
  }

  pickerIndex =
    (
      pickerIndex +
      buttons.length
    ) %
    buttons.length;

  buttons.forEach(
    (
      button,
      index
    ) => {

      button.classList.toggle(
        "selected",
        index ===
          pickerIndex
      );
    }
  );

  if (
    moveFocus &&
    buttons[
      pickerIndex
    ]
  ) {
    buttons[
      pickerIndex
    ].focus({
      preventScroll: true
    });
  }
}


function movePicker(
  delta
) {
  const buttons =
    getPickerButtons();

  if (!buttons.length) {
    return;
  }

  pickerIndex =
    (
      pickerIndex +
      delta +
      buttons.length
    ) %
    buttons.length;

  updatePickerSelection(
    true
  );
}


function activatePickerSelection() {
  const buttons =
    getPickerButtons();

  const button =
    buttons[
      pickerIndex
    ];

  if (!button) {
    return;
  }

  if (
    button.dataset.kind ===
    "back"
  ) {
    openMainMenu();

    return;
  }

  if (
    pendingSlotIndex === null
  ) {
    openMainMenu();

    return;
  }

  createCompanion(
    pendingSlotIndex,
    button.dataset.characterId
  );
}


/* ============================================================
   OPEN COMPANION
============================================================ */

function resetRuntimeState() {
  clearTimeout(
    animationTimer
  );

  clearTimeout(
    sleepTimer
  );

  clearTimeout(
    walkTimer
  );

  clearTimeout(
    ambientTimer
  );

  clearTimeout(
    messageTimer
  );

  animationTimer = null;
  sleepTimer = null;
  walkTimer = null;
  ambientTimer = null;
  messageTimer = null;

  currentAnimation = "";
  currentAnimationDirection = "";

  temporaryAnimation = false;
  walking = false;

  interactionMode = false;
  statusCardVisible = false;

  selectedAction = 0;

  currentX = 0;

  activeDirection = "right";
  nextWalkDirection = "right";

  characterMover.style.transition =
    "none";

  characterMover.style.left =
    "50%";

  actionTray.classList.add(
    "hidden-tray"
  );

  actionTray.setAttribute(
    "aria-hidden",
    "true"
  );

  statusCard.classList.add(
    "hidden"
  );

  message.classList.add(
    "hidden"
  );

  setActionButtonsFocusable(
    false
  );
}


function openCompanion(
  slotIndex
) {
  const slot =
    appState.slots[
      slotIndex
    ];

  if (
    !slot ||
    !characters[
      slot.characterId
    ]
  ) {
    return;
  }

  activeSlotIndex =
    slotIndex;

  activeCharacterId =
    slot.characterId;

  state =
    loadSlotState(
      slotIndex,
      activeCharacterId
    );

  resetRuntimeState();

  showOnlyScreen(
    "game"
  );

  statusCardTitle.textContent =
    getActiveCharacter()
      .name
      .toUpperCase();

  controlHint.textContent =
    "↑ MENU • ↓ INTERACT";

  preloadAnimations();

  updatePersistentTime();

  selectAction(
    0,
    false
  );

  updateStatusDisplay();

  updateMoodAnimation();

  requestAnimationFrame(
    focusApp
  );

  if (!state.alive) {
    setAnimation(
      "death",
      activeDirection
    );

    return;
  }

  if (state.forcedSit) {
    temporaryAnimation =
      false;

    setAnimation(
      "bored",
      activeDirection
    );

    return;
  }

  if (state.sleeping) {
    temporaryAnimation =
      false;

    setAnimation(
      "sleep",
      activeDirection
    );

    return;
  }

  resumeAmbient(
    1800
  );
}


/* ============================================================
   ANIMATIONS
============================================================ */

function getAnimationPath(
  name,
  direction =
    activeDirection
) {
  const character =
    getActiveCharacter();

  if (!character) {
    return null;
  }

  const animation =
    character.animations[
      name
    ];

  if (!animation) {
    return null;
  }

  const filename =
    animation[
      direction
    ] ||
    animation.right ||
    animation.left;

  if (!filename) {
    return null;
  }

  return (
    character.path +
    filename
  );
}


function setAnimation(
  name,
  direction =
    activeDirection,
  restart =
    false
) {
  const path =
    getAnimationPath(
      name,
      direction
    );

  if (!path) {
    console.warn(
      "Missing animation:",
      name
    );

    return;
  }

  if (
    !restart &&
    currentAnimation === name &&
    currentAnimationDirection ===
      direction
  ) {
    return;
  }

  currentAnimation =
    name;

  currentAnimationDirection =
    direction;

  activeDirection =
    direction;

  characterSprite.src =
    restart
      ? `${path}?play=${++animationPlayId}`
      : path;
}


/* ============================================================
   FOOD / HEALTH
============================================================ */

function getFoodAge() {
  return (
    Date.now() -
    state.lastMealAt
  );
}


function getHungerStage() {
  const age =
    getFoodAge();

  if (
    age >=
    SICK_HUNGER_MS
  ) {
    return "critical";
  }

  if (
    age >=
    FOOD_DURATION_MS
  ) {
    return "sick";
  }

  return "normal";
}


function updateFoodFromClock() {
  const remaining =
    1 -
    getFoodAge() /
      FOOD_DURATION_MS;

  state.hunger =
    clamp(
      remaining *
      100
    );
}


function areHealthNeedsMet() {
  return (
    state.hunger >=
      HEALTH_MIN_HUNGER &&

    state.happiness >=
      HEALTH_MIN_HAPPINESS &&

    state.energy >
      EXHAUSTED_THRESHOLD &&

    state.cleanliness >=
      HEALTH_MIN_CLEANLINESS
  );
}


function updateHealthFromClock(
  minutes
) {
  if (!state.alive) {
    return;
  }

  const hungerStage =
    getHungerStage();

  if (
    hungerStage === "sick" ||
    hungerStage === "critical"
  ) {
    state.health =
      clamp(
        state.health -
        HEALTH_DRAIN_PER_MINUTE *
        minutes
      );

  } else if (
    areHealthNeedsMet()
  ) {
    state.health =
      clamp(
        state.health +
        HEALTH_RECOVERY_PER_MINUTE *
        minutes
      );
  }

  if (
    state.health <= 0
  ) {
    killCharacter();
  }
}


/* ============================================================
   DEATH / MOOD
============================================================ */

function killCharacter() {
  if (!state.alive) {
    return;
  }

  state.health = 0;
  state.alive = false;

  state.sleeping = false;
  state.forcedSleep = false;

  state.forcedSit = false;
  state.sitStartedAt = null;

  temporaryAnimation = false;

  clearTimeout(
    animationTimer
  );

  clearTimeout(
    sleepTimer
  );

  pauseAmbient();
  stopWalking();

  setAnimation(
    "death",
    activeDirection
  );

  saveState();
}


function getMoodEmoji() {
  if (!state.alive) {
    return "😵";
  }

  if (state.forcedSit) {
    return "😐";
  }

  if (
    state.recoveryMood ===
    "angry"
  ) {
    return "😠";
  }

  if (
    state.recoveryMood ===
    "sad"
  ) {
    return "😢";
  }

  if (
    state.recoveryMood ===
    "neutral"
  ) {
    return "😐";
  }

  if (
    state.happiness >= 85
  ) {
    return "🥰";
  }

  if (
    state.happiness >= 60
  ) {
    return "😊";
  }

  if (
    state.happiness >= 35
  ) {
    return "😐";
  }

  if (
    state.happiness >= 15
  ) {
    return "😢";
  }

  return "😠";
}


function applyPositiveInteraction() {
  if (state.forcedSit) {
    return;
  }

  switch (
    state.recoveryMood
  ) {
    case "angry":
      state.recoveryMood =
        "sad";
      break;

    case "sad":
      state.recoveryMood =
        "neutral";
      break;

    case "neutral":
      state.recoveryMood =
        "happy";
      break;

    default:
      state.recoveryMood =
        "happy";
      break;
  }
}


/* ============================================================
   FORCED SIT
============================================================ */

function startForcedSit() {
  if (
    state.sleeping ||
    !state.alive
  ) {
    return;
  }

  pauseAmbient();
  stopWalking();

  clearTimeout(
    animationTimer
  );

  temporaryAnimation =
    false;

  state.forcedSit =
    true;

  state.sitStartedAt =
    Date.now();

  setAnimation(
    "bored",
    activeDirection
  );

  showMessage(
    "Sit."
  );

  updateStatusDisplay();

  saveState();
}


function applySitPenalty(
  elapsed
) {
  if (
    elapsed >=
    SIT_ANGRY_MS
  ) {
    state.recoveryMood =
      "angry";

    return;
  }

  if (
    elapsed >=
      SIT_SAD_MS &&
    state.recoveryMood !==
      "angry"
  ) {
    state.recoveryMood =
      "sad";
  }
}


function releaseForcedSit(
  resumeMovement =
    true
) {
  if (
    !state.forcedSit
  ) {
    return;
  }

  const startedAt =
    state.sitStartedAt ||
    Date.now();

  const elapsed =
    Math.max(
      0,
      Date.now() -
      startedAt
    );

  applySitPenalty(
    elapsed
  );

  state.forcedSit =
    false;

  state.sitStartedAt =
    null;

  temporaryAnimation =
    false;

  clearTimeout(
    animationTimer
  );

  saveState();

  updateMoodAnimation();
  updateStatusDisplay();

  if (
    state.recoveryMood ===
    "angry"
  ) {
    showMessage(
      "Not happy."
    );

  } else if (
    state.recoveryMood ===
    "sad"
  ) {
    showMessage(
      "Feeling down."
    );

  } else {
    showMessage(
      "Free!"
    );
  }

  if (
    resumeMovement &&
    interactionMode
  ) {
    closeInteractionTray();

    return;
  }

  if (
    resumeMovement &&
    !state.sleeping &&
    state.alive
  ) {
    resumeAmbient(
      900
    );
  }
}


function toggleForcedSit() {
  if (state.forcedSit) {
    releaseForcedSit();

  } else {
    startForcedSit();
  }
}


/* ============================================================
   TIME
============================================================ */

function updatePersistentTime() {
  if (!state) {
    return;
  }

  const now =
    Date.now();

  const elapsed =
    Math.max(
      0,
      now -
      state.lastUpdate
    );

  const minutes =
    elapsed /
    60000;

  if (!state.alive) {
    state.lastUpdate =
      now;

    saveState();

    return;
  }

  if (state.sleeping) {
    state.energy =
      clamp(
        state.energy +
        ENERGY_RECOVERY_PER_MINUTE *
        minutes
      );

    if (
      state.energy >= 100
    ) {
      state.energy = 100;

      state.sleeping =
        false;

      state.forcedSleep =
        false;
    }

  } else {
    state.energy =
      clamp(
        state.energy -
        ENERGY_DRAIN_PER_MINUTE *
        minutes
      );

    if (
      state.energy <= 0
    ) {
      state.energy = 0;

      if (state.forcedSit) {
        releaseForcedSit(
          false
        );
      }

      state.sleeping =
        true;

      state.forcedSleep =
        true;

      stopWalking();
    }
  }

  updateFoodFromClock();

  updateHealthFromClock(
    minutes
  );

  state.lastUpdate =
    now;

  saveState();
}


/* ============================================================
   STATUS
============================================================ */

function updateStatusDisplay() {
  if (!state) {
    return;
  }

  const happiness =
    rounded(
      state.happiness
    );

  const food =
    rounded(
      state.hunger
    );

  const energy =
    rounded(
      state.energy
    );

  const health =
    rounded(
      state.health
    );

  const clean =
    rounded(
      state.cleanliness
    );

  moodEmoji.textContent =
    getMoodEmoji();

  healthBar.style.width =
    `${health}%`;

  hungerBar.style.width =
    `${food}%`;

  cleanlinessBar.style.width =
    `${clean}%`;

  energyBar.style.width =
    `${energy}%`;

  happinessValue.textContent =
    happiness;

  hungerValue.textContent =
    food;

  energyValue.textContent =
    energy;

  healthValue.textContent =
    health;

  cleanValue.textContent =
    clean;

  detailHappiness.style.width =
    `${happiness}%`;

  detailHunger.style.width =
    `${food}%`;

  detailEnergy.style.width =
    `${energy}%`;

  detailHealth.style.width =
    `${health}%`;

  detailClean.style.width =
    `${clean}%`;

  document
    .querySelector(
      '[data-stat="health"]'
    )
    ?.classList.toggle(
      "critical",
      state.health < 25
    );

  document
    .querySelector(
      '[data-stat="hunger"]'
    )
    ?.classList.toggle(
      "critical",
      getHungerStage() ===
        "critical"
    );

  document
    .querySelector(
      '[data-stat="cleanliness"]'
    )
    ?.classList.toggle(
      "critical",
      state.cleanliness <
        HEALTH_MIN_CLEANLINESS
    );

  document
    .querySelector(
      '[data-stat="energy"]'
    )
    ?.classList.toggle(
      "critical",
      state.energy <=
        EXHAUSTED_THRESHOLD
    );
}


/* ============================================================
   MOOD ANIMATION
============================================================ */

function updateMoodAnimation() {
  if (
    !state ||
    currentScreen !==
      "game" ||
    temporaryAnimation ||
    walking
  ) {
    return;
  }

  if (!state.alive) {
    setAnimation(
      "death"
    );

    return;
  }

  if (state.sleeping) {
    setAnimation(
      "sleep"
    );

    return;
  }

  if (state.forcedSit) {
    setAnimation(
      "bored",
      activeDirection
    );

    return;
  }

  const hungerStage =
    getHungerStage();

  if (
    hungerStage ===
      "critical" ||
    hungerStage ===
      "sick"
  ) {
    setAnimation(
      "sick"
    );

    return;
  }

  if (
    state.hunger < 20
  ) {
    setAnimation(
      "hungry"
    );

    return;
  }

  if (
    state.energy <=
      EXHAUSTED_THRESHOLD
  ) {
    setAnimation(
      "angry"
    );

    return;
  }

  if (
    state.happiness < 25
  ) {
    setAnimation(
      "sad"
    );

    return;
  }

  setAnimation(
    "idleFront",
    activeDirection
  );
}


/* ============================================================
   TEMPORARY ANIMATION
============================================================ */

function playTemporaryAnimation(
  name,
  duration,
  direction =
    activeDirection
) {
  pauseAmbient();
  stopWalking();

  clearTimeout(
    animationTimer
  );

  temporaryAnimation =
    true;

  setAnimation(
    name,
    direction,
    name ===
      "chaseBall" ||
    name ===
      "clean"
  );

  animationTimer =
    setTimeout(
      () => {

        temporaryAnimation =
          false;

        updateMoodAnimation();

        if (
          currentScreen ===
            "game" &&
          !state.forcedSit &&
          !state.sleeping &&
          state.alive
        ) {
          resumeAmbient(
            1500
          );
        }

      },
      duration
    );
}


/* ============================================================
   MOVEMENT
============================================================ */

function getHorizontalLimits() {
  const stageWidth =
    petStage.clientWidth;

  const characterWidth =
    characterMover.offsetWidth;

  const halfAvailable =
    Math.max(
      0,
      stageWidth / 2 -
      characterWidth *
        0.28 -
      WALK_MARGIN
    );

  return {
    min:
      -halfAvailable,

    max:
      halfAvailable
  };
}


function getNextRoamTarget() {
  const limits =
    getHorizontalLimits();

  const edgeTarget =
    nextWalkDirection ===
      "right"
      ? limits.max
      : limits.min;

  const remainingDistance =
    edgeTarget -
    currentX;

  if (
    Math.abs(
      remainingDistance
    ) <
    MIN_TRAVEL_DISTANCE
  ) {
    nextWalkDirection =
      nextWalkDirection ===
        "right"
        ? "left"
        : "right";

    return getNextRoamTarget();
  }

  const travelFraction =
    Math.random() <
      MIDSCREEN_STOP_CHANCE
      ? randomBetween(
          0.45,
          0.75
        )
      : randomBetween(
          0.94,
          1
        );

  const target =
    currentX +
    remainingDistance *
      travelFraction;

  return Math.max(
    limits.min,
    Math.min(
      limits.max,
      target
    )
  );
}


function chooseNextWalkDirection() {
  const limits =
    getHorizontalLimits();

  const roomAhead =
    activeDirection ===
      "right"
      ? limits.max -
        currentX
      : currentX -
        limits.min;

  if (
    roomAhead >
      MIN_TRAVEL_DISTANCE *
        1.5 &&
    Math.random() <
      CONTINUE_DIRECTION_CHANCE
  ) {
    nextWalkDirection =
      activeDirection;

  } else {
    nextWalkDirection =
      activeDirection ===
        "right"
        ? "left"
        : "right";
  }
}


function moveCharacter(
  animation,
  speed,
  minimumDuration,
  special = false
) {
  if (
    currentScreen !==
      "game" ||
    walking ||
    temporaryAnimation ||
    interactionMode ||
    statusCardVisible ||
    state.sleeping ||
    state.forcedSit ||
    !state.alive
  ) {
    return;
  }

  const targetX =
    getNextRoamTarget();

  const distance =
    targetX -
    currentX;

  if (
    Math.abs(
      distance
    ) <
    MIN_TRAVEL_DISTANCE
  ) {
    beginRestPeriod();

    return;
  }

  activeDirection =
    distance > 0
      ? "right"
      : "left";

  walking =
    true;

  temporaryAnimation =
    special;

  setAnimation(
    animation,
    activeDirection
  );

  const duration =
    Math.max(
      minimumDuration,
      (
        Math.abs(
          distance
        ) /
        speed
      ) *
      1000
    );

  characterMover.style.transition =
    "none";

  void characterMover.offsetWidth;

  characterMover.style.transition =
    `left ${duration}ms linear`;

  characterMover.style.left =
    `calc(50% + ${targetX}px)`;

  clearTimeout(
    walkTimer
  );

  walkTimer =
    setTimeout(
      () => {

        currentX =
          targetX;

        walking =
          false;

        temporaryAnimation =
          false;

        characterMover.style.transition =
          "none";

        chooseNextWalkDirection();

        updateMoodAnimation();

        beginRestPeriod();

      },
      duration + 25
    );
}


function walkAcrossScreen() {
  moveCharacter(
    "walk",
    WALK_SPEED,
    700,
    false
  );
}


function boundAcrossScreen() {
  moveCharacter(
    "bound",
    BOUND_SPEED,
    300,
    true
  );
}


function stopWalking() {
  if (!walking) {
    return;
  }

  clearTimeout(
    walkTimer
  );

  const stageRect =
    petStage
      .getBoundingClientRect();

  const moverRect =
    characterMover
      .getBoundingClientRect();

  currentX =
    moverRect.left +
    moverRect.width / 2 -
    (
      stageRect.left +
      stageRect.width / 2
    );

  characterMover.style.transition =
    "none";

  characterMover.style.left =
    `calc(50% + ${currentX}px)`;

  walking =
    false;

  if (
    currentAnimation ===
    "bound"
  ) {
    temporaryAnimation =
      false;
  }
}


/* ============================================================
   AMBIENT BEHAVIOR
============================================================ */

function playAmbientReaction(
  animation,
  duration = 1600
) {
  temporaryAnimation =
    true;

  setAnimation(
    animation,
    activeDirection
  );

  clearTimeout(
    animationTimer
  );

  animationTimer =
    setTimeout(
      () => {

        temporaryAnimation =
          false;

        updateMoodAnimation();

        if (
          currentScreen ===
            "game" &&
          !state.forcedSit &&
          !state.sleeping &&
          state.alive
        ) {
          resumeAmbient(
            randomBetween(
              800,
              1500
            )
          );
        }

      },
      duration
    );
}


function beginRestPeriod() {
  if (
    currentScreen !==
      "game" ||
    state.sleeping ||
    state.forcedSit ||
    interactionMode ||
    statusCardVisible ||
    !state.alive
  ) {
    return;
  }

  const pauseDuration =
    randomBetween(
      MIN_PAUSE_MS,
      MAX_PAUSE_MS
    );

  if (
    getHungerStage() !==
      "normal" ||
    state.energy <=
      EXHAUSTED_THRESHOLD ||
    state.hunger < 20 ||
    state.happiness < 25
  ) {
    updateMoodAnimation();

    resumeAmbient(
      pauseDuration
    );

    return;
  }

  const roll =
    Math.random();

  const positiveBehaviorEnd =
    MOOD_REACTION_CHANCE +
    BOUND_CHANCE;

  if (
    state.recoveryMood ===
      "angry" &&
    roll <
      positiveBehaviorEnd
  ) {
    playAmbientReaction(
      "angry",
      1700
    );

    return;
  }

  if (
    state.recoveryMood ===
      "sad" &&
    roll <
      positiveBehaviorEnd
  ) {
    playAmbientReaction(
      "sad",
      1700
    );

    return;
  }

  if (
    state.recoveryMood ===
      "neutral" &&
    roll <
      positiveBehaviorEnd
  ) {
    setAnimation(
      "idleFront",
      activeDirection
    );

    resumeAmbient(
      pauseDuration
    );

    return;
  }

  if (
    state.recoveryMood ===
      "happy" &&
    roll <
      MOOD_REACTION_CHANCE
  ) {
    playAmbientReaction(
      state.happiness >= 50
        ? "happy"
        : "sad",
      1500
    );

    return;
  }

  if (
    state.recoveryMood ===
      "happy" &&
    roll <
      positiveBehaviorEnd
  ) {
    boundAcrossScreen();

    return;
  }

  if (
    roll <
    positiveBehaviorEnd +
      BORED_CHANCE
  ) {
    setAnimation(
      "bored",
      activeDirection
    );

    resumeAmbient(
      pauseDuration
    );

    return;
  }

  setAnimation(
    "idleFront",
    activeDirection
  );

  resumeAmbient(
    pauseDuration
  );
}


function pauseAmbient() {
  clearTimeout(
    ambientTimer
  );

  ambientTimer =
    null;
}


function resumeAmbient(
  delay = 1500
) {
  clearTimeout(
    ambientTimer
  );

  ambientTimer =
    null;

  if (
    currentScreen !==
      "game" ||
    !state ||
    state.forcedSit ||
    state.sleeping ||
    !state.alive
  ) {
    return;
  }

  ambientTimer =
    setTimeout(
      () => {

        ambientTimer =
          null;

        if (
          currentScreen !==
            "game" ||
          state.forcedSit ||
          state.sleeping ||
          !state.alive
        ) {
          return;
        }

        if (
          interactionMode ||
          statusCardVisible ||
          temporaryAnimation ||
          walking
        ) {
          resumeAmbient(
            800
          );

          return;
        }

        walkAcrossScreen();

      },
      delay
    );
}


/* ============================================================
   MESSAGE / STATUS CARD
============================================================ */

function showMessage(
  text,
  duration = 1300
) {
  clearTimeout(
    messageTimer
  );

  message.textContent =
    text;

  message.classList.remove(
    "hidden"
  );

  messageTimer =
    setTimeout(
      () => {

        message.classList.add(
          "hidden"
        );

      },
      duration
    );
}


function showStatusCard() {
  if (
    currentScreen !==
    "game"
  ) {
    return;
  }

  pauseAmbient();
  stopWalking();

  statusCardVisible =
    true;

  updateStatusDisplay();

  statusCard.classList.remove(
    "hidden"
  );
}


function hideStatusCard(
  resume = true
) {
  statusCardVisible =
    false;

  statusCard.classList.add(
    "hidden"
  );

  if (
    currentScreen ===
    "game"
  ) {
    focusApp();
  }

  if (
    resume &&
    currentScreen ===
      "game" &&
    !interactionMode &&
    state &&
    !state.sleeping &&
    !state.forcedSit &&
    state.alive
  ) {
    resumeAmbient(
      1500
    );
  }
}


/* ============================================================
   FOCUS
============================================================ */

function focusApp() {
  if (
    app &&
    typeof app.focus ===
      "function"
  ) {
    app.focus({
      preventScroll:
        true
    });
  }
}


function setActionButtonsFocusable(
  enabled
) {
  actionButtons.forEach(
    button => {

      button.tabIndex =
        enabled
          ? 0
          : -1;
    }
  );
}


function focusSelectedAction() {
  const button =
    actionButtons[
      selectedAction
    ];

  if (
    button &&
    typeof button.focus ===
      "function"
  ) {
    button.focus({
      preventScroll:
        true
    });
  }
}


/* ============================================================
   INTERACTION TRAY
============================================================ */

function openInteractionTray() {
  if (
    currentScreen !==
      "game" ||
    interactionMode
  ) {
    return;
  }

  pauseAmbient();
  stopWalking();

  hideStatusCard(
    false
  );

  interactionMode =
    true;

  actionTray.classList.remove(
    "hidden-tray"
  );

  actionTray.setAttribute(
    "aria-hidden",
    "false"
  );

  setActionButtonsFocusable(
    true
  );

  if (
    state.alive &&
    !state.sleeping &&
    !state.forcedSit &&
    !temporaryAnimation
  ) {
    setAnimation(
      "idleFront",
      activeDirection
    );
  }

  controlHint.textContent =
    "◀ ▶ SELECT • PINCH • ↑ CLOSE";

  requestAnimationFrame(
    focusSelectedAction
  );
}


function closeInteractionTray(
  resume = true
) {
  if (
    !interactionMode
  ) {
    return;
  }

  interactionMode =
    false;

  actionTray.classList.add(
    "hidden-tray"
  );

  actionTray.setAttribute(
    "aria-hidden",
    "true"
  );

  setActionButtonsFocusable(
    false
  );

  controlHint.textContent =
    "↑ MENU • ↓ INTERACT";

  if (
    currentScreen ===
    "game"
  ) {
    requestAnimationFrame(
      focusApp
    );
  }

  if (
    resume &&
    currentScreen ===
      "game" &&
    state &&
    !state.sleeping &&
    !state.forcedSit &&
    state.alive
  ) {
    resumeAmbient(
      900
    );
  }
}


function selectAction(
  index,
  moveFocus = true
) {
  selectedAction =
    (
      index +
      actions.length
    ) %
    actions.length;

  actionButtons.forEach(
    (
      button,
      i
    ) => {

      button.classList.toggle(
        "selected",
        i ===
          selectedAction
      );
    }
  );

  if (
    interactionMode &&
    moveFocus
  ) {
    focusSelectedAction();
  }
}


function nextAction() {
  selectAction(
    selectedAction + 1
  );
}


function previousAction() {
  selectAction(
    selectedAction - 1
  );
}


/* ============================================================
   SLEEP
============================================================ */

function putCharacterToSleep(
  forced = false
) {
  if (
    !state.alive ||
    state.sleeping
  ) {
    return;
  }

  pauseAmbient();
  stopWalking();

  clearTimeout(
    sleepTimer
  );

  clearTimeout(
    animationTimer
  );

  if (state.forcedSit) {
    releaseForcedSit(
      false
    );
  }

  state.sleeping =
    true;

  state.forcedSleep =
    forced;

  temporaryAnimation =
    true;

  setAnimation(
    "sleepy"
  );

  showMessage(
    forced
      ? "Exhausted"
      : "Sleepy..."
  );

  saveState();

  sleepTimer =
    setTimeout(
      () => {

        if (
          !state.alive ||
          !state.sleeping
        ) {
          return;
        }

        setAnimation(
          "lieDown"
        );

        sleepTimer =
          setTimeout(
            () => {

              if (
                !state.alive ||
                !state.sleeping
              ) {
                return;
              }

              temporaryAnimation =
                false;

              setAnimation(
                "sleep"
              );

              saveState();

            },
            1200
          );

      },
      1200
    );
}


function wakeCharacter() {
  if (
    !state.alive ||
    !state.sleeping
  ) {
    return;
  }

  if (
    state.forcedSleep &&
    state.energy < 20
  ) {
    showMessage(
      "Too tired"
    );

    return;
  }

  clearTimeout(
    sleepTimer
  );

  clearTimeout(
    animationTimer
  );

  state.sleeping =
    false;

  state.forcedSleep =
    false;

  temporaryAnimation =
    true;

  setAnimation(
    "wakeUp"
  );

  animationTimer =
    setTimeout(
      () => {

        if (
          !state.alive ||
          state.sleeping ||
          currentScreen !==
            "game"
        ) {
          return;
        }

        temporaryAnimation =
          false;

        updateMoodAnimation();

        resumeAmbient(
          1500
        );

      },
      1500
    );

  saveState();
}


/* ============================================================
   ACTIONS
============================================================ */

function performAction(
  action
) {
  if (
    !state ||
    !state.alive ||
    currentScreen !==
      "game"
  ) {
    return;
  }

  state.lastInteraction =
    Date.now();

  if (
    state.forcedSit &&
    action !== "sit"
  ) {
    showMessage(
      "Still sitting."
    );

    setAnimation(
      "bored",
      activeDirection
    );

    return;
  }


  switch (action) {

    case "feed":

      if (state.sleeping) {
        wakeCharacter();

        return;
      }

      state.lastMealAt =
        Date.now();

      state.hunger = 100;

      state.health =
        clamp(
          state.health +
          FOOD_HEALTH_RECOVERY
        );

      state.happiness =
        clamp(
          state.happiness + 5
        );

      applyPositiveInteraction();

      updateStatusDisplay();

      playTemporaryAnimation(
        "eat",
        2200
      );

      showMessage(
        "Eating"
      );

      break;


    case "play":

      if (state.sleeping) {
        return;
      }

      if (
        state.energy <=
        EXHAUSTED_THRESHOLD
      ) {
        playTemporaryAnimation(
          "angry",
          1500
        );

        showMessage(
          "Too tired"
        );

        break;
      }

      state.happiness =
        clamp(
          state.happiness + 15
        );

      state.energy =
        clamp(
          state.energy - 2
        );

      applyPositiveInteraction();

      updateStatusDisplay();

      playTemporaryAnimation(
        "chaseBall",
        FETCH_DURATION_MS,
        activeDirection
      );

      break;


    case "pet":

      if (state.sleeping) {
        return;
      }

      state.happiness =
        clamp(
          state.happiness + 8
        );

      applyPositiveInteraction();

      updateStatusDisplay();

      playTemporaryAnimation(
        "happy",
        1500
      );

      break;


    case "clean":

      state.cleanliness =
        100;

      updateStatusDisplay();

      playTemporaryAnimation(
        "clean",
        CLEAN_DURATION_MS
      );

      break;


    case "sit":

      toggleForcedSit();

      break;


    case "sleep":

      if (state.sleeping) {
        wakeCharacter();

      } else {
        putCharacterToSleep(
          false
        );
      }

      break;


    case "medicine":

      if (
        state.health >= 95
      ) {
        showMessage(
          "Healthy"
        );

        break;
      }

      state.health =
        clamp(
          state.health + 25
        );

      updateStatusDisplay();

      playTemporaryAnimation(
        "angry",
        1500
      );

      break;
  }

  updateStatusDisplay();

  saveState();
}


/* ============================================================
   ACTION BUTTONS
============================================================ */

actionButtons.forEach(
  (
    button,
    index
  ) => {

    button.addEventListener(
      "focus",
      () => {

        if (
          interactionMode
        ) {
          selectAction(
            index,
            false
          );
        }
      }
    );

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        if (
          !interactionMode
        ) {
          return;
        }

        selectAction(
          index,
          false
        );

        performAction(
          actions[
            index
          ]
        );
      }
    );
  }
);


/* ============================================================
   TOUCH / POINTER
============================================================ */

document.addEventListener(
  "pointerdown",
  event => {

    pointerStartX =
      event.clientX;

    pointerStartY =
      event.clientY;

    longPressTriggered =
      false;

    clearTimeout(
      longPressTimer
    );

    if (
      currentScreen ===
        "game" &&
      event.target ===
        characterSprite &&
      !interactionMode
    ) {
      longPressTimer =
        setTimeout(
          () => {

            longPressTriggered =
              true;

            showStatusCard();

          },
          LONG_PRESS_TIME
        );
    }
  }
);


document.addEventListener(
  "pointermove",
  event => {

    const dx =
      Math.abs(
        event.clientX -
        pointerStartX
      );

    const dy =
      Math.abs(
        event.clientY -
        pointerStartY
      );

    if (
      dx > 12 ||
      dy > 12
    ) {
      clearTimeout(
        longPressTimer
      );
    }
  }
);


document.addEventListener(
  "pointerup",
  event => {

    clearTimeout(
      longPressTimer
    );

    if (
      longPressTriggered
    ) {
      return;
    }

    if (
      currentScreen !==
      "game"
    ) {
      return;
    }

    const dx =
      event.clientX -
      pointerStartX;

    const dy =
      event.clientY -
      pointerStartY;

    const ax =
      Math.abs(dx);

    const ay =
      Math.abs(dy);


    if (
      ax >
        SWIPE_DISTANCE &&
      ax > ay
    ) {
      if (
        interactionMode
      ) {
        if (dx > 0) {
          previousAction();

        } else {
          nextAction();
        }
      }

      return;
    }


    if (
      ay >
        SWIPE_DISTANCE &&
      ay > ax
    ) {
      if (dy > 0) {

        if (
          !interactionMode
        ) {
          openInteractionTray();
        }

      } else {

        if (
          interactionMode
        ) {
          closeInteractionTray();

        } else if (
          statusCardVisible
        ) {
          hideStatusCard();

        } else {
          openMainMenu();
        }
      }

      return;
    }


    if (
      interactionMode &&
      !event.target.closest(
        ".action"
      )
    ) {
      performAction(
        actions[
          selectedAction
        ]
      );
    }
  }
);


/* ============================================================
   META / KEYBOARD / NEURAL BAND
============================================================ */

function getNavigationKey(
  event
) {
  const key =
    event.key;

  const code =
    event.code;

  if (
    key === "ArrowLeft" ||
    key === "Left" ||
    code === "ArrowLeft"
  ) {
    return "left";
  }

  if (
    key === "ArrowRight" ||
    key === "Right" ||
    code === "ArrowRight"
  ) {
    return "right";
  }

  if (
    key === "ArrowUp" ||
    key === "Up" ||
    code === "ArrowUp"
  ) {
    return "up";
  }

  if (
    key === "ArrowDown" ||
    key === "Down" ||
    code === "ArrowDown"
  ) {
    return "down";
  }

  if (
    key === "Enter" ||
    code === "Enter" ||
    code === "NumpadEnter" ||
    key === " " ||
    code === "Space"
  ) {
    return "activate";
  }

  return null;
}


function focusedNativeButtonForCurrentScreen() {
  const active =
    document.activeElement;

  if (
    !active ||
    !active.classList
  ) {
    return false;
  }

  if (
    currentScreen ===
    "game"
  ) {
    return (
      interactionMode &&
      active.classList.contains(
        "action"
      )
    );
  }

  if (
    currentScreen ===
      "main" ||
    currentScreen ===
      "picker"
  ) {
    return active.classList.contains(
      "list-item"
    );
  }

  return false;
}


function handleNavigationInput(
  event
) {
  const input =
    getNavigationKey(
      event
    );

  if (
    !input ||
    event.repeat
  ) {
    return;
  }

  /*
     Let actual focused buttons
     process Enter/Space normally.
     This prevents double activation.
  */

  if (
    input === "activate" &&
    focusedNativeButtonForCurrentScreen()
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();


  if (
    currentScreen ===
    "main"
  ) {
    if (
      input === "up"
    ) {
      moveMainMenu(
        -1
      );

    } else if (
      input === "down"
    ) {
      moveMainMenu(
        1
      );

    } else if (
      input === "activate"
    ) {
      activateMainMenuSelection();
    }

    return;
  }


  if (
    currentScreen ===
    "picker"
  ) {
    if (
      input === "up"
    ) {
      movePicker(
        -1
      );

    } else if (
      input === "down"
    ) {
      movePicker(
        1
      );

    } else if (
      input === "left"
    ) {
      openMainMenu();

    } else if (
      input === "activate"
    ) {
      activatePickerSelection();
    }

    return;
  }


  if (
    currentScreen !==
    "game"
  ) {
    return;
  }


  switch (input) {

    case "left":

      if (
        interactionMode
      ) {
        previousAction();
      }

      break;


    case "right":

      if (
        interactionMode
      ) {
        nextAction();
      }

      break;


    case "down":

      if (
        !interactionMode
      ) {
        openInteractionTray();
      }

      break;


    case "up":

      if (
        interactionMode
      ) {
        closeInteractionTray();

      } else if (
        statusCardVisible
      ) {
        hideStatusCard();

      } else {
        openMainMenu();
      }

      break;


    case "activate":

      if (
        interactionMode
      ) {
        performAction(
          actions[
            selectedAction
          ]
        );
      }

      break;
  }
}


window.addEventListener(
  "keydown",
  handleNavigationInput,
  true
);


/* ============================================================
   GAME TICK
============================================================ */

function gameTick() {
  if (
    currentScreen !==
      "game" ||
    !state
  ) {
    return;
  }

  const wasSleeping =
    state.sleeping;

  updatePersistentTime();

  if (!state.alive) {
    updateStatusDisplay();

    updateMoodAnimation();

    return;
  }

  if (
    !wasSleeping &&
    state.sleeping &&
    state.energy <= 0
  ) {
    putCharacterToSleep(
      true
    );
  }

  updateStatusDisplay();

  updateMoodAnimation();
}


setInterval(
  gameTick,
  GAME_TICK_INTERVAL
);


/* ============================================================
   VISIBILITY / FOCUS
============================================================ */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "hidden"
    ) {
      if (
        currentScreen ===
        "game"
      ) {
        pauseAmbient();

        stopWalking();

        saveState();
      }

      return;
    }


    if (
      currentScreen ===
      "game"
    ) {
      updatePersistentTime();

      updateStatusDisplay();

      updateMoodAnimation();

      if (
        interactionMode
      ) {
        requestAnimationFrame(
          focusSelectedAction
        );

      } else {
        requestAnimationFrame(
          focusApp
        );
      }

      if (
        !state.sleeping &&
        !state.forcedSit &&
        state.alive
      ) {
        resumeAmbient(
          1500
        );
      }

    } else if (
      currentScreen ===
      "main"
    ) {
      renderMainMenu();

      requestAnimationFrame(
        () => {
          updateMainMenuSelection(
            true
          );
        }
      );

    } else if (
      currentScreen ===
      "picker"
    ) {
      requestAnimationFrame(
        () => {
          updatePickerSelection(
            true
          );
        }
      );
    }
  }
);


window.addEventListener(
  "focus",
  () => {

    if (
      currentScreen ===
      "game"
    ) {
      if (
        interactionMode
      ) {
        requestAnimationFrame(
          focusSelectedAction
        );

      } else {
        requestAnimationFrame(
          focusApp
        );
      }

    } else if (
      currentScreen ===
      "main"
    ) {
      requestAnimationFrame(
        () => {
          updateMainMenuSelection(
            true
          );
        }
      );

    } else if (
      currentScreen ===
      "picker"
    ) {
      requestAnimationFrame(
        () => {
          updatePickerSelection(
            true
          );
        }
      );
    }
  }
);


/* ============================================================
   PRELOAD
============================================================ */

function preloadAnimations() {
  const character =
    getActiveCharacter();

  if (!character) {
    return;
  }

  const filenames =
    new Set();

  Object.values(
    character.animations
  ).forEach(
    animation => {

      Object.values(
        animation
      ).forEach(
        filename => {

          filenames.add(
            filename
          );
        }
      );
    }
  );

  filenames.forEach(
    filename => {

      const img =
        new Image();

      img.src =
        character.path +
        filename;
    }
  );
}


/* ============================================================
   INIT
============================================================ */

function init() {
  setActionButtonsFocusable(
    false
  );

  actionTray.setAttribute(
    "aria-hidden",
    "true"
  );

  characterSprite.addEventListener(
    "dragstart",
    event => {

      event.preventDefault();

    }
  );

  renderMainMenu();

  showOnlyScreen(
    "main"
  );

  requestAnimationFrame(
    () => {
      updateMainMenuSelection(
        true
      );
    }
  );
}


init();