"use strict";


/* ============================================================
   POCKET FURRY
   META DISPLAY STATE / BEHAVIOR BUILD
============================================================ */


/* ============================================================
   CHARACTER PACK
============================================================ */

const characters = {

  noctis: {

    id: "noctis",

    name: "Noctis",

    path:
      "assets/characters/noctis/",

    animations: {

      idle: {
        right: "idle.gif",
        left: "idle-left.gif"
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
        left: "lie-down-left.gif"
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


let activeCharacterId =
  "noctis";


let activeDirection =
  "right";


function getActiveCharacter() {

  return characters[
    activeCharacterId
  ];
}


/* ============================================================
   GAME CONSTANTS
============================================================ */

const MAX_STAT =
  100;


/* ============================================================
   ENERGY
============================================================ */

/*
   100 -> 0 over 16 waking hours.
*/

const ENERGY_DRAIN_PER_MINUTE =
  100 / (16 * 60);


/*
   0 -> 100 over 10 minutes of sleep.
*/

const ENERGY_RECOVERY_PER_MINUTE =
  100 / 10;


const EXHAUSTED_THRESHOLD =
  10;


/* ============================================================
   HEALTH
============================================================ */

/*
   Healthy recovery:

   0 -> 100 over 24 hours,
   but only while all needs are met.
*/

const HEALTH_RECOVERY_PER_MINUTE =
  100 / (24 * 60);


/*
   Sickness:

   100 -> 0 over 24 hours.
*/

const HEALTH_DRAIN_PER_MINUTE =
  100 / (24 * 60);


/*
   Eating restores 25 health points.
*/

const FOOD_HEALTH_RECOVERY =
  25;


/*
   Thresholds for health regeneration.

   These match the existing behavioral
   warning thresholds where practical.
*/

const HEALTH_MIN_HUNGER =
  20;


const HEALTH_MIN_HAPPINESS =
  25;


const HEALTH_MIN_CLEANLINESS =
  25;


/* ============================================================
   HUNGER CLOCK
============================================================ */

const FOOD_DURATION_MS =
  24 * 60 * 60 * 1000;


const SICK_HUNGER_MS =
  48 * 60 * 60 * 1000;


/* ============================================================
   FORCED SIT CLOCK
============================================================ */

const SIT_SAD_MS =
  15 * 60 * 1000;


const SIT_ANGRY_MS =
  30 * 60 * 1000;


/* ============================================================
   GAME TIMING
============================================================ */

const GAME_TICK_INTERVAL =
  30 * 1000;


/* ============================================================
   MOVEMENT
============================================================ */

const WALK_SPEED =
  38;


const WALK_MARGIN =
  20;


const MIN_PAUSE_MS =
  2200;


const MAX_PAUSE_MS =
  6200;


const MIN_TRAVEL_DISTANCE =
  35;


const MIDSCREEN_STOP_CHANCE =
  0.55;


/* ============================================================
   AMBIENT BEHAVIOR
============================================================ */

const MOOD_REACTION_CHANCE =
  0.07;


const BOUND_CHANCE =
  0.12;


const BORED_CHANCE =
  0.22;


/* ============================================================
   META INPUT
============================================================ */

const SWIPE_DISTANCE =
  28;


const LONG_PRESS_TIME =
  700;


/* ============================================================
   SAVE DATA
============================================================ */

const SAVE_VERSION =
  5;


function getSaveKey() {

  return (
    "pocketFurry_" +
    activeCharacterId +
    "_v" +
    SAVE_VERSION
  );
}


/* ============================================================
   DEFAULT STATE
============================================================ */

const defaultState = {

  hunger:
    100,

  happiness:
    85,

  energy:
    100,

  health:
    100,

  cleanliness:
    100,

  sleeping:
    false,

  forcedSleep:
    false,

  forcedSit:
    false,

  sitStartedAt:
    null,

  recoveryMood:
    "happy",

  alive:
    true,

  lastUpdate:
    Date.now(),

  lastMealAt:
    Date.now(),

  lastInteraction:
    Date.now()
};


let state =
  loadState();


/* ============================================================
   DOM
============================================================ */

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


const moodEmoji =
  document.getElementById(
    "moodEmoji"
  );


const happinessBar =
  document.getElementById(
    "happinessBar"
  );


const hungerBar =
  document.getElementById(
    "hungerBar"
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


/* ============================================================
   ACTION MENU
============================================================ */

const actions = [

  "feed",

  "play",

  "pet",

  "clean",

  "sit",

  "sleep",

  "medicine"
];


let selectedAction =
  0;


let interactionMode =
  false;


let statusCardVisible =
  false;


/* ============================================================
   ANIMATION STATE
============================================================ */

let currentAnimation =
  "";


let currentAnimationDirection =
  "";


let temporaryAnimation =
  false;


let animationTimer =
  null;


let sleepTimer =
  null;


/* ============================================================
   WALKING STATE
============================================================ */

let walking =
  false;


let walkTimer =
  null;


let ambientTimer =
  null;


let currentX =
  0;


let nextWalkDirection =
  "right";


/* ============================================================
   POINTER STATE
============================================================ */

let pointerStartX =
  0;


let pointerStartY =
  0;


let longPressTimer =
  null;


let longPressTriggered =
  false;


/* ============================================================
   MESSAGE TIMER
============================================================ */

let messageTimer =
  null;


/* ============================================================
   UTILITIES
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


/* ============================================================
   SAVE / LOAD
============================================================ */

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


/* ============================================================
   ANIMATION PATH
============================================================ */

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

    animation[direction]

    ||

    animation.right

    ||

    animation.left;


  if (!filename) {

    return null;
  }


  return (
    getActiveCharacter().path +
    filename
  );
}


/* ============================================================
   SET ANIMATION
============================================================ */

function setAnimation(
  name,
  direction = activeDirection
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
    currentAnimation === name &&
    currentAnimationDirection === direction
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
    path;
}


/* ============================================================
   FOOD STATE
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

  const elapsed =
    getFoodAge();


  const remaining =
    1 -
    (
      elapsed /
      FOOD_DURATION_MS
    );


  state.hunger =
    clamp(
      remaining *
      100
    );
}


/* ============================================================
   HEALTH STATE
============================================================ */

function areHealthNeedsMet() {

  return (

    state.hunger >=
    HEALTH_MIN_HUNGER

    &&

    state.happiness >=
    HEALTH_MIN_HAPPINESS

    &&

    state.energy >
    EXHAUSTED_THRESHOLD

    &&

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


  /*
     Sick or critical:

     Health continuously drains.
  */

  if (
    hungerStage ===
    "sick"

    ||

    hungerStage ===
    "critical"
  ) {

    state.health =
      clamp(
        state.health -
        HEALTH_DRAIN_PER_MINUTE *
        minutes
      );

  }


  /*
     Healthy and every need is met:

     Slowly regenerate health.
  */

  else if (
    areHealthNeedsMet()
  ) {

    state.health =
      clamp(
        state.health +
        HEALTH_RECOVERY_PER_MINUTE *
        minutes
      );
  }


  /*
     Zero health = death.
  */

  if (
    state.health <=
    0
  ) {

    killCharacter();
  }
}


/* ============================================================
   DEATH
============================================================ */

function killCharacter() {

  if (
    !state.alive
  ) {

    return;
  }


  state.health =
    0;


  state.alive =
    false;


  state.sleeping =
    false;


  state.forcedSleep =
    false;


  state.forcedSit =
    false;


  state.sitStartedAt =
    null;


  temporaryAnimation =
    false;


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


/* ============================================================
   MOOD HUD
============================================================ */

function getMoodEmoji() {

  if (
    !state.alive
  ) {

    return "😵";
  }


  /*
     Forced sit stays visually neutral.
  */

  if (
    state.forcedSit
  ) {

    return "😐";
  }


  /*
     Recovery state can temporarily override
     raw happiness.
  */

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


  /*
     Normal happiness scale.
  */

  if (
    state.happiness >=
    85
  ) {

    return "🥰";
  }


  if (
    state.happiness >=
    60
  ) {

    return "😊";
  }


  if (
    state.happiness >=
    35
  ) {

    return "😐";
  }


  if (
    state.happiness >=
    15
  ) {

    return "😢";
  }


  return "😠";
}


/* ============================================================
   POSITIVE INTERACTION / RECOVERY
============================================================ */

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


    case "happy":

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
    SIT_SAD_MS
  ) {

    if (
      state.recoveryMood !==
      "angry"
    ) {

      state.recoveryMood =
        "sad";
    }
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


  updateStatusDisplay();


  saveState();


  updateMoodAnimation();


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
    !state.sleeping &&
    state.alive
  ) {

    resumeAmbient(
      1200
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


/* ============================================================
   PERSISTENT TIME
============================================================ */

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


  /*
     DEAD

     Keep timestamps current, but don't
     continue processing needs.
  */

  if (
    !state.alive
  ) {

    state.lastUpdate =
      now;


    saveState();


    return;
  }


  /* --------------------------------------------------------
     ENERGY - SLEEPING
  --------------------------------------------------------- */

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

  }


  /* --------------------------------------------------------
     ENERGY - AWAKE
  --------------------------------------------------------- */

  else {

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


  /*
     Update food before health, because the
     current food state determines whether
     health heals or drains.
  */

  updateFoodFromClock();


  /*
     Process health using the same elapsed
     real-world time.
  */

  updateHealthFromClock(
    minutes
  );


  state.lastUpdate =
    now;


  saveState();
}


/* ============================================================
   STATUS DISPLAY
============================================================ */

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


  happinessBar.style.width =
    `${happiness}%`;


  hungerBar.style.width =
    `${food}%`;


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


  updateCriticalIndicators();
}


/* ============================================================
   HUD WARNING STATES
============================================================ */

function updateCriticalIndicators() {

  const moodNode =
    document.querySelector(
      '[data-stat="happiness"]'
    );


  const foodNode =
    document.querySelector(
      '[data-stat="hunger"]'
    );


  const energyNode =
    document.querySelector(
      '[data-stat="energy"]'
    );


  moodNode.classList.toggle(
    "critical",
    state.happiness <
    25
  );


  foodNode.classList.toggle(
    "critical",
    getHungerStage() ===
    "critical"
  );


  energyNode.classList.toggle(
    "critical",
    state.energy <=
    EXHAUSTED_THRESHOLD
  );
}


/* ============================================================
   RESTING / MOOD STATE
============================================================ */

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
    "critical"
  ) {

    setAnimation(
      "sick"
    );

    return;
  }


  if (
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
    "idle",
    activeDirection
  );
}


/* ============================================================
   TEMPORARY ANIMATION
============================================================ */

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
    direction
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


/* ============================================================
   WALKING LIMITS
============================================================ */

function getHorizontalLimits() {

  const stageWidth =
    petStage.clientWidth;


  const characterWidth =
    characterMover.offsetWidth;


  const halfAvailable =
    Math.max(
      0,
      (
        stageWidth -
        characterWidth
      ) / 2 -
      WALK_MARGIN
    );


  return {

    min:
      -halfAvailable,

    max:
      halfAvailable
  };
}


/* ============================================================
   PICK NEXT ROAM DESTINATION
============================================================ */

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
        0.35,
        0.75
      );

  } else {

    travelFraction =
      randomBetween(
        0.82,
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


/* ============================================================
   WALK / ROAM
============================================================ */

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
    Math.abs(distance) <
    MIN_TRAVEL_DISTANCE
  ) {

    beginRestPeriod();

    return;
  }


  activeDirection =

    distance >
    0

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


        nextWalkDirection =

          activeDirection ===
          "right"

            ? "left"

            : "right";


        beginRestPeriod();

      },
      duration + 25
    );
}


/* ============================================================
   STOP CURRENT WALK
============================================================ */

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
    (
      moverRect.left +
      moverRect.width /
      2
    )
    -
    (
      stageRect.left +
      stageRect.width /
      2
    );


  characterMover.style.transition =
    "none";


  characterMover.style.left =
    `calc(50% + ${currentX}px)`;


  walking =
    false;
}


/* ============================================================
   AMBIENT SPECIAL REACTION
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


/* ============================================================
   REST / RANDOM AMBIENT BEHAVIOR
============================================================ */

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
    "normal"

    ||

    state.energy <=
    EXHAUSTED_THRESHOLD

    ||

    state.hunger <
    20

    ||

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
    "angry"

    &&

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
    "sad"

    &&

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
    "neutral"

    &&

    roll <
    positiveBehaviorEnd
  ) {

    setAnimation(
      "idle",
      activeDirection
    );


    resumeAmbient(
      pauseDuration
    );

    return;
  }


  if (
    state.recoveryMood ===
    "happy"

    &&

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
    "happy"

    &&

    roll <
    positiveBehaviorEnd
  ) {

    playAmbientReaction(
      "bound",
      1600
    );

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
    "idle",
    activeDirection
  );


  resumeAmbient(
    pauseDuration
  );
}


/* ============================================================
   AMBIENT LOOP
============================================================ */

function pauseAmbient() {

  clearTimeout(
    ambientTimer
  );
}


function resumeAmbient(
  delay = 1500
) {

  clearTimeout(
    ambientTimer
  );


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

        walkAcrossScreen();

      },
      delay
    );
}


/* ============================================================
   MESSAGE
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


/* ============================================================
   STATUS CARD
============================================================ */

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


/* ============================================================
   INTERACTION TRAY
============================================================ */

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
      1500
    );
  }
}


/* ============================================================
   ACTION SELECTION
============================================================ */

function selectAction(index) {

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


/* ============================================================
   SLEEP
============================================================ */

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


/* ============================================================
   WAKE
============================================================ */

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


/* ============================================================
   ACTIONS
============================================================ */

function performAction(action) {

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


  switch (action) {


    /* --------------------------------------------------------
       FEED
    --------------------------------------------------------- */

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


      /*
         Eating restores 25 health points.
      */

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


    /* --------------------------------------------------------
       PLAY
    --------------------------------------------------------- */

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

        Math.random() <
        0.5

          ? "jump"

          : "bound",

        2000,

        activeDirection
      );

      break;


    /* --------------------------------------------------------
       PET
    --------------------------------------------------------- */

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


    /* --------------------------------------------------------
       CLEAN
    --------------------------------------------------------- */

    case "clean":

      state.cleanliness =
        100;


      updateStatusDisplay();


      playTemporaryAnimation(
        "lieDown",
        1700
      );

      break;


    /* --------------------------------------------------------
       SIT
    --------------------------------------------------------- */

    case "sit":

      toggleForcedSit();

      break;


    /* --------------------------------------------------------
       SLEEP
    --------------------------------------------------------- */

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


    /* --------------------------------------------------------
       MEDICINE
    --------------------------------------------------------- */

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


/* ============================================================
   BUTTON INPUT
============================================================ */

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


/* ============================================================
   META DISPLAY POINTER / SWIPE INPUT
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
      event.target ===
      characterSprite

      &&

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
      dx >
      12

      ||

      dy >
      12
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


    /* LEFT / RIGHT */

    if (
      ax >
      SWIPE_DISTANCE

      &&

      ax >
      ay
    ) {

      if (
        interactionMode
      ) {

        if (
          dx >
          0
        ) {

          previousAction();

        } else {

          nextAction();
        }
      }


      return;
    }


    /* DOWN / UP */

    if (
      ay >
      SWIPE_DISTANCE

      &&

      ay >
      ax
    ) {

      if (
        dy >
        0
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


    /* TAP WHILE MENU OPEN */

    if (
      interactionMode

      &&

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
   GAME TICK
============================================================ */

function gameTick() {

  const wasSleeping =
    state.sleeping;


  updatePersistentTime();


  /*
     Death overrides everything.
  */

  if (
    !state.alive
  ) {

    updateStatusDisplay();


    updateMoodAnimation();


    return;
  }


  /*
     Energy reached zero while awake.
  */

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


/* ============================================================
   TIMER
============================================================ */

setInterval(
  gameTick,
  GAME_TICK_INTERVAL
);


/* ============================================================
   APP VISIBILITY
============================================================ */

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


/* ============================================================
   PRELOAD ANIMATIONS
============================================================ */

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


/* ============================================================
   INIT
============================================================ */

function init() {

  preloadAnimations();


  characterMover.style.left =
    "50%";


  currentX =
    0;


  /*
     Process all real-world elapsed time.
  */

  updatePersistentTime();


  selectAction(
    0
  );


  updateStatusDisplay();


  updateMoodAnimation();


  characterSprite.addEventListener(
    "dragstart",
    event =>
      event.preventDefault()
  );


  /*
     Dead characters do nothing except
     display their death state.
  */

  if (
    !state.alive
  ) {

    setAnimation(
      "death",
      activeDirection
    );

    return;
  }


  /*
     Persistent forced sit survives reload.
  */

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
    !state.sleeping
  ) {

    resumeAmbient(
      1800
    );
  }
}


init();