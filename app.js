"use strict";

/* CHARACTER PACK */

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

let animationPlayId = 0;
let activeCharacterId = "noctis";
let activeDirection = "right";

const FETCH_DURATION_MS = 3030;
const CLEAN_DURATION_MS = 5390;

function getActiveCharacter() {
  return characters[activeCharacterId];
}

/* GAME CONSTANTS */

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

/* MOVEMENT */

const WALK_SPEED = 38;
const BOUND_SPEED = 120;

const WALK_MARGIN = 0;

const MIN_PAUSE_MS = 2200;
const MAX_PAUSE_MS = 6200;

const MIN_TRAVEL_DISTANCE = 35;

const MIDSCREEN_STOP_CHANCE = 0.30;
const CONTINUE_DIRECTION_CHANCE = 0.60;

/* AMBIENT BEHAVIOR */

const MOOD_REACTION_CHANCE = 0.07;
const BOUND_CHANCE = 0.12;
const BORED_CHANCE = 0.22;

/* INPUT */

const SWIPE_DISTANCE = 28;
const LONG_PRESS_TIME = 700;

/* SAVE */

const SAVE_VERSION = 5;

function getSaveKey() {
  return (
    "pocketFurry_" +
    activeCharacterId +
    "_v" +
    SAVE_VERSION
  );
}

/* DEFAULT STATE */

const defaultState = {
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

  lastUpdate: Date.now(),
  lastMealAt: Date.now(),
  lastInteraction: Date.now()
};

let state = loadState();

/* DOM */

const characterSprite =
  document.getElementById("character");

const characterMover =
  document.getElementById("characterMover");

const petStage =
  document.getElementById("petStage");

const actionTray =
  document.getElementById("actionTray");

const controlHint =
  document.getElementById("controlHint");

const message =
  document.getElementById("message");

const statusCard =
  document.getElementById("statusCard");

const moodEmoji =
  document.getElementById("moodEmoji");

const healthBar =
  document.getElementById("healthBar");

const hungerBar =
  document.getElementById("hungerBar");

const cleanlinessBar =
  document.getElementById("cleanlinessBar");

const energyBar =
  document.getElementById("energyBar");

const happinessValue =
  document.getElementById("happinessValue");

const hungerValue =
  document.getElementById("hungerValue");

const energyValue =
  document.getElementById("energyValue");

const healthValue =
  document.getElementById("healthValue");

const cleanValue =
  document.getElementById("cleanValue");

const detailHappiness =
  document.getElementById("detailHappiness");

const detailHunger =
  document.getElementById("detailHunger");

const detailEnergy =
  document.getElementById("detailEnergy");

const detailHealth =
  document.getElementById("detailHealth");

const detailClean =
  document.getElementById("detailClean");

const actionButtons = [
  ...document.querySelectorAll(".action")
];

/* ACTION MENU */

const actions = [
  "feed",
  "play",
  "pet",
  "clean",
  "sit",
  "sleep",
  "medicine"
];

let selectedAction = 0;
let interactionMode = false;
let statusCardVisible = false;

/* ANIMATION STATE */

let currentAnimation = "";
let currentAnimationDirection = "";
let temporaryAnimation = false;

let animationTimer = null;
let sleepTimer = null;

/* MOVEMENT STATE */

let walking = false;
let walkTimer = null;
let ambientTimer = null;

let currentX = 0;
let nextWalkDirection = "right";

/* POINTER STATE */

let pointerStartX = 0;
let pointerStartY = 0;

let longPressTimer = null;
let longPressTriggered = false;

let messageTimer = null;

/* UTILITIES */

function clamp(value) {
  return Math.max(
    0,
    Math.min(MAX_STAT, value)
  );
}

function rounded(value) {
  return Math.round(
    clamp(value)
  );
}

function randomBetween(min, max) {
  return (
    min +
    Math.random() *
    (max - min)
  );
}

/* SAVE / LOAD */

function saveState() {
  state.lastUpdate =
    Date.now();

  localStorage.setItem(
    getSaveKey(),
    JSON.stringify(state)
  );
}

function loadState() {
  const saved =
    localStorage.getItem(
      getSaveKey()
    );

  if (!saved) {
    return {
      ...defaultState
    };
  }

  try {
    const loaded =
      JSON.parse(saved);

    return {
      ...defaultState,
      ...loaded,

      lastMealAt:
        loaded.lastMealAt ||
        Date.now(),

      recoveryMood:
        loaded.recoveryMood ||
        "happy"
    };

  } catch {
    return {
      ...defaultState
    };
  }
}

/* ANIMATION PATH */

function getAnimationPath(
  name,
  direction = activeDirection
) {
  const animation =
    getActiveCharacter()
      .animations[name];

  if (!animation) {
    return null;
  }

  const filename =
    animation[direction] ||
    animation.right ||
    animation.left;

  if (!filename) {
    return null;
  }

  return (
    getActiveCharacter().path +
    filename
  );
}

/* SET ANIMATION */

function setAnimation(
  name,
  direction = activeDirection,
  restart = false
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
    currentAnimationDirection === direction
  ) {
    return;
  }

  currentAnimation = name;
  currentAnimationDirection = direction;
  activeDirection = direction;

  characterSprite.src =
    restart
      ? `${path}?play=${++animationPlayId}`
      : path;
}

/* FOOD */

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
  const elapsed =
    getFoodAge();

  const remaining =
    1 -
    elapsed /
    FOOD_DURATION_MS;

  state.hunger =
    clamp(
      remaining * 100
    );
}

/* HEALTH */

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
  if (
    !state.alive
  ) {
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

/* DEATH */

function killCharacter() {
  if (
    !state.alive
  ) {
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

/* MOOD HUD */

function getMoodEmoji() {
  if (
    !state.alive
  ) {
    return "😵";
  }

  if (
    state.forcedSit
  ) {
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

/* POSITIVE INTERACTION */

function applyPositiveInteraction() {
  if (
    state.forcedSit
  ) {
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

/* FORCED SIT */

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
  resumeMovement = true
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
  if (
    state.forcedSit
  ) {
    releaseForcedSit();

  } else {
    startForcedSit();
  }
}

/* PERSISTENT TIME */

function updatePersistentTime() {
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

  if (
    !state.alive
  ) {
    state.lastUpdate =
      now;

    saveState();

    return;
  }

  if (
    state.sleeping
  ) {
    state.energy =
      clamp(
        state.energy +
        ENERGY_RECOVERY_PER_MINUTE *
        minutes
      );

    if (
      state.energy >=
      100
    ) {
      state.energy =
        100;

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
      state.energy <=
      0
    ) {
      state.energy =
        0;

      if (
        state.forcedSit
      ) {
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

/* STATUS DISPLAY */

function updateStatusDisplay() {
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

  if (
    moodEmoji
  ) {
    moodEmoji.textContent =
      getMoodEmoji();
  }

  if (
    healthBar
  ) {
    healthBar.style.width =
      `${health}%`;
  }

  if (
    hungerBar
  ) {
    hungerBar.style.width =
      `${food}%`;
  }

  if (
    cleanlinessBar
  ) {
    cleanlinessBar.style.width =
      `${clean}%`;
  }

  if (
    energyBar
  ) {
    energyBar.style.width =
      `${energy}%`;
  }

  if (
    happinessValue
  ) {
    happinessValue.textContent =
      happiness;
  }

  if (
    hungerValue
  ) {
    hungerValue.textContent =
      food;
  }

  if (
    energyValue
  ) {
    energyValue.textContent =
      energy;
  }

  if (
    healthValue
  ) {
    healthValue.textContent =
      health;
  }

  if (
    cleanValue
  ) {
    cleanValue.textContent =
      clean;
  }

  if (
    detailHappiness
  ) {
    detailHappiness.style.width =
      `${happiness}%`;
  }

  if (
    detailHunger
  ) {
    detailHunger.style.width =
      `${food}%`;
  }

  if (
    detailEnergy
  ) {
    detailEnergy.style.width =
      `${energy}%`;
  }

  if (
    detailHealth
  ) {
    detailHealth.style.width =
      `${health}%`;
  }

  if (
    detailClean
  ) {
    detailClean.style.width =
      `${clean}%`;
  }

  updateCriticalIndicators();
}

/* HUD WARNING STATES */

function updateCriticalIndicators() {
  const healthNode =
    document.querySelector(
      '[data-stat="health"]'
    );

  const foodNode =
    document.querySelector(
      '[data-stat="hunger"]'
    );

  const cleanNode =
    document.querySelector(
      '[data-stat="cleanliness"]'
    );

  const energyNode =
    document.querySelector(
      '[data-stat="energy"]'
    );

  if (
    healthNode
  ) {
    healthNode.classList.toggle(
      "critical",
      state.health < 25
    );
  }

  if (
    foodNode
  ) {
    foodNode.classList.toggle(
      "critical",
      getHungerStage() ===
      "critical"
    );
  }

  if (
    cleanNode
  ) {
    cleanNode.classList.toggle(
      "critical",
      state.cleanliness <
      HEALTH_MIN_CLEANLINESS
    );
  }

  if (
    energyNode
  ) {
    energyNode.classList.toggle(
      "critical",
      state.energy <=
      EXHAUSTED_THRESHOLD
    );
  }
}

/* RESTING / MOOD STATE */

function updateMoodAnimation() {
  if (
    temporaryAnimation ||
    walking
  ) {
    return;
  }

  if (
    !state.alive
  ) {
    setAnimation(
      "death"
    );

    return;
  }

  if (
    state.sleeping
  ) {
    setAnimation(
      "sleep"
    );

    return;
  }

  if (
    state.forcedSit
  ) {
    setAnimation(
      "bored",
      activeDirection
    );

    return;
  }

  if (
    getHungerStage() ===
    "critical" ||
    getHungerStage() ===
    "sick"
  ) {
    setAnimation(
      "sick"
    );

    return;
  }

  if (
    state.hunger <
    20
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
    state.happiness <
    25
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

/* TEMPORARY ANIMATION */

function playTemporaryAnimation(
  name,
  duration,
  direction = activeDirection
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
    name === "chaseBall" ||
    name === "clean"
  );

  animationTimer =
    setTimeout(
      () => {

        temporaryAnimation =
          false;

        updateMoodAnimation();

        if (
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

/* WALKING LIMITS */

function getHorizontalLimits() {
  const stageWidth =
    petStage.clientWidth;

  const characterWidth =
    characterMover.offsetWidth;

  const halfAvailable =
    Math.max(
      0,
      stageWidth / 2 -
      characterWidth * 0.28 -
      WALK_MARGIN
    );

  return {
    min:
      -halfAvailable,

    max:
      halfAvailable
  };
}

/* PICK NEXT ROAM DESTINATION */

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

  let travelFraction;

  if (
    Math.random() <
    MIDSCREEN_STOP_CHANCE
  ) {
    travelFraction =
      randomBetween(
        0.45,
        0.75
      );

  } else {
    travelFraction =
      randomBetween(
        0.94,
        1.0
      );
  }

  let target =
    currentX +
    remainingDistance *
    travelFraction;

  target =
    Math.max(
      limits.min,
      Math.min(
        limits.max,
        target
      )
    );

  return target;
}

/* DIRECTION DECISION */

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
      1.5

    &&

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

/* WALK / ROAM */

function walkAcrossScreen() {
  if (
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

  setAnimation(
    "walk",
    activeDirection
  );

  const duration =
    Math.max(
      700,
      (
        Math.abs(distance) /
        WALK_SPEED
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

        characterMover.style.transition =
          "none";

        chooseNextWalkDirection();

        beginRestPeriod();

      },
      duration + 25
    );
}

/* BOUND / FAST ROAM */

function boundAcrossScreen() {
  if (
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
    true;

  setAnimation(
    "bound",
    activeDirection
  );

  const duration =
    Math.max(
      300,
      (
        Math.abs(distance) /
        BOUND_SPEED
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

/* STOP MOVEMENT */

function stopWalking() {
  if (
    !walking
  ) {
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

/* AMBIENT SPECIAL REACTION */

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

/* REST / AMBIENT BEHAVIOR */

function beginRestPeriod() {
  if (
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

    state.hunger <
      20 ||

    state.happiness <
      25
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
    const moodAnimation =
      state.happiness >=
      50
        ? "happy"
        : "sad";

    playAmbientReaction(
      moodAnimation,
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

/* AMBIENT LOOP */

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

/* MESSAGE */

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

/* STATUS CARD */

function showStatusCard() {
  pauseAmbient();
  stopWalking();

  statusCardVisible =
    true;

  updateStatusDisplay();

  statusCard.classList.remove(
    "hidden"
  );
}

function hideStatusCard() {
  statusCardVisible =
    false;

  statusCard.classList.add(
    "hidden"
  );

  if (
    !interactionMode &&
    !state.sleeping &&
    !state.forcedSit &&
    state.alive
  ) {
    resumeAmbient(
      1500
    );
  }
}

/* INTERACTION TRAY */

function openInteractionTray() {
  pauseAmbient();
  stopWalking();

  statusCardVisible =
    false;

  statusCard.classList.add(
    "hidden"
  );

  interactionMode =
    true;

  actionTray.classList.remove(
    "hidden-tray"
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
    "◀ ▶ SELECT • TAP • ↑ CLOSE";
}

function closeInteractionTray() {
  interactionMode =
    false;

  actionTray.classList.add(
    "hidden-tray"
  );

  controlHint.textContent =
    "SWIPE DOWN TO INTERACT";

  if (
    !state.sleeping &&
    !state.forcedSit &&
    state.alive
  ) {
    resumeAmbient(
      900
    );
  }
}

/* ACTION SELECTION */

function selectAction(
  index
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
}

function nextAction() {
  selectAction(
    selectedAction +
    1
  );
}

function previousAction() {
  selectAction(
    selectedAction -
    1
  );
}

/* SLEEP */

function putCharacterToSleep(
  forced = false
) {
  if (
    !state.alive
  ) {
    return;
  }

  pauseAmbient();
  stopWalking();

  if (
    state.forcedSit
  ) {
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

  clearTimeout(
    sleepTimer
  );

  sleepTimer =
    setTimeout(
      () => {

        if (
          !state.alive
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
                !state.alive
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

/* WAKE */

function wakeCharacter() {
  if (
    !state.alive
  ) {
    return;
  }

  if (
    state.forcedSleep &&
    state.energy <
    20
  ) {
    showMessage(
      "Too tired"
    );

    return;
  }

  if (
    !state.sleeping
  ) {
    return;
  }

  state.sleeping =
    false;

  state.forcedSleep =
    false;

  temporaryAnimation =
    true;

  setAnimation(
    "wakeUp"
  );

  clearTimeout(
    animationTimer
  );

  animationTimer =
    setTimeout(
      () => {

        if (
          !state.alive
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

/* ACTIONS */

function performAction(
  action
) {
  if (
    !state.alive
  ) {
    return;
  }

  state.lastInteraction =
    Date.now();

  if (
    state.forcedSit &&
    action !==
    "sit"
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

  switch (
    action
  ) {

    case "feed":

      if (
        state.sleeping
      ) {
        wakeCharacter();

        return;
      }

      state.lastMealAt =
        Date.now();

      state.hunger =
        100;

      state.health =
        clamp(
          state.health +
          FOOD_HEALTH_RECOVERY
        );

      state.happiness =
        clamp(
          state.happiness +
          5
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

      if (
        state.sleeping
      ) {
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
          state.happiness +
          15
        );

      state.energy =
        clamp(
          state.energy -
          2
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

      if (
        state.sleeping
      ) {
        return;
      }

      state.happiness =
        clamp(
          state.happiness +
          8
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

      if (
        state.sleeping
      ) {
        wakeCharacter();

      } else {
        putCharacterToSleep(
          false
        );
      }

      break;


    case "medicine":

      if (
        state.health >=
        95
      ) {
        showMessage(
          "Healthy"
        );

        break;
      }

      state.health =
        clamp(
          state.health +
          25
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

/* BUTTON INPUT */

actionButtons.forEach(
  (
    button,
    index
  ) => {

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        selectAction(
          index
        );

        performAction(
          actions[index]
        );
      }
    );
  }
);

/* TOUCH / POINTER SWIPE INPUT */

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

      ax >
      ay
    ) {
      if (
        interactionMode
      ) {
        if (
          dx > 0
        ) {
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

      ay >
      ax
    ) {
      if (
        dy > 0
      ) {
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

/* META NEURAL BAND / KEYBOARD INPUT */

document.addEventListener(
  "keydown",
  event => {

    switch (
      event.key
    ) {

      case "ArrowLeft":

        event.preventDefault();

        if (
          interactionMode
        ) {
          previousAction();
        }

        break;


      case "ArrowRight":

        event.preventDefault();

        if (
          interactionMode
        ) {
          nextAction();
        }

        break;


      case "ArrowDown":

        event.preventDefault();

        if (
          !interactionMode
        ) {
          openInteractionTray();
        }

        break;


      case "ArrowUp":

        event.preventDefault();

        if (
          interactionMode
        ) {
          closeInteractionTray();

        } else if (
          statusCardVisible
        ) {
          hideStatusCard();
        }

        break;


      case "Enter":

      case " ":

        event.preventDefault();

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
);

/* GAME TICK */

function gameTick() {
  const wasSleeping =
    state.sleeping;

  updatePersistentTime();

  if (
    !state.alive
  ) {
    updateStatusDisplay();
    updateMoodAnimation();

    return;
  }

  if (
    !wasSleeping &&
    state.sleeping &&
    state.energy <=
    0
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

/* APP VISIBILITY */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "hidden"
    ) {
      pauseAmbient();
      stopWalking();
      saveState();

    } else {
      updatePersistentTime();
      updateStatusDisplay();
      updateMoodAnimation();

      if (
        !state.sleeping &&
        !state.forcedSit &&
        state.alive
      ) {
        resumeAmbient(
          1500
        );
      }
    }
  }
);

/* PRELOAD */

function preloadAnimations() {
  const character =
    getActiveCharacter();

  Object.values(
    character.animations
  ).forEach(
    animation => {

      Object.values(
        animation
      ).forEach(
        filename => {

          const img =
            new Image();

          img.src =
            character.path +
            filename;
        }
      );
    }
  );
}

/* INIT */

function init() {
  preloadAnimations();

  characterMover.style.left =
    "50%";

  currentX =
    0;

  updatePersistentTime();

  selectAction(
    0
  );

  updateStatusDisplay();
  updateMoodAnimation();

  characterSprite.addEventListener(
    "dragstart",
    event => {
      event.preventDefault();
    }
  );

  if (
    !state.alive
  ) {
    setAnimation(
      "death",
      activeDirection
    );

    return;
  }

  if (
    state.forcedSit
  ) {
    temporaryAnimation =
      false;

    setAnimation(
      "bored",
      activeDirection
    );

    return;
  }

  if (
    state.sleeping
  ) {
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

init();