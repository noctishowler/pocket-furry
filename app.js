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
   TIME / GAME CONSTANTS
============================================================ */

const MAX_STAT =
  100;


/*
   Energy:
   100 -> 0 over 16 hours awake.
*/

const ENERGY_DRAIN_PER_MINUTE =
  100 / (16 * 60);


/*
   Sleep:
   0 -> 100 in 10 minutes.
*/

const ENERGY_RECOVERY_PER_MINUTE =
  100 / 10;


/*
   At 10% energy or lower Noctis becomes irritable.
*/

const EXHAUSTED_THRESHOLD =
  10;


/*
   Food timeline:

   0 - 24 hr:
      normal hunger progression

   24 - 48 hr:
      sick

   48+ hr:
      critical starvation
*/

const FOOD_DURATION_MS =
  24 * 60 * 60 * 1000;


const SICK_HUNGER_MS =
  48 * 60 * 60 * 1000;


/*
   Update state every 30 seconds while open.
*/

const GAME_TICK_INTERVAL =
  30 * 1000;


/*
   Walking speed.
*/

const WALK_SPEED =
  38;


/*
   Edge safety margin.
*/

const WALK_MARGIN =
  20;


/*
   Pause duration between walks.
*/

const MIN_PAUSE_MS =
  2500;


const MAX_PAUSE_MS =
  6000;


/*
   Chance of bored sitting during a pause.
*/

const BORED_PAUSE_CHANCE =
  0.28;


/*
   Meta gesture threshold.
*/

const SWIPE_DISTANCE =
  28;


const LONG_PRESS_TIME =
  700;


/* ============================================================
   SAVE DATA
============================================================ */

/*
   Keep v5 so existing users don't get an
   unnecessary total reset.

   New fields are added automatically.
*/

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


/*
   Start in the center.

   First walk goes right.
*/

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

      /*
        Older save files don't contain
        lastMealAt.

        Treat the update as a fresh meal
        rather than immediately starving
        an existing pet.
      */

      lastMealAt:
        loaded.lastMealAt ||
        Date.now()
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
   FOOD / STARVATION STATE
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


/*
   Food gauge drains linearly during
   the first 24 hours.

   After that it remains at zero.
*/

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
   ENERGY / CLOCK PROCESSING
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
     SLEEPING
  */

  if (
    state.sleeping
  ) {

    state.energy =
      clamp(
        state.energy +
        ENERGY_RECOVERY_PER_MINUTE *
        minutes
      );


    /*
       Fully charged after sleep.

       Automatically wake after reaching 100.
    */

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


  /*
     AWAKE
  */

  else {

    state.energy =
      clamp(
        state.energy -
        ENERGY_DRAIN_PER_MINUTE *
        minutes
      );


    /*
       0 energy = mandatory sleep.
    */

    if (
      state.energy <=
      0
    ) {

      state.energy =
        0;


      state.sleeping =
        true;


      state.forcedSleep =
        true;


      stopWalking();
    }
  }


  /*
     Food is based on time since
     the last meal, not frame updates.
  */

  updateFoodFromClock();


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
    state.happiness < 25
  );


  /*
     Food becomes visually critical
     once the pet reaches day three.
  */

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
   CURRENT RESTING STATE
============================================================ */

function updateMoodAnimation() {

  if (
    temporaryAnimation ||
    walking
  ) {

    return;
  }


  /*
     DEAD
  */

  if (
    !state.alive
  ) {

    setAnimation(
      "death"
    );

    return;
  }


  /*
     SLEEP
  */

  if (
    state.sleeping
  ) {

    setAnimation(
      "sleep"
    );

    return;
  }


  /*
     FOOD DAY 3+
  */

  if (
    getHungerStage() ===
    "critical"
  ) {

    setAnimation(
      "sick"
    );

    return;
  }


  /*
     FOOD DAY 2
  */

  if (
    getHungerStage() ===
    "sick"
  ) {

    setAnimation(
      "sick"
    );

    return;
  }


  /*
     LOW FOOD DURING DAY 1
  */

  if (
    state.hunger <
    20
  ) {

    setAnimation(
      "hungry"
    );

    return;
  }


  /*
     EXHAUSTED

     At 10% or below, idle becomes angry.
  */

  if (
    state.energy <=
    EXHAUSTED_THRESHOLD
  ) {

    setAnimation(
      "angry"
    );

    return;
  }


  /*
     SAD
  */

  if (
    state.happiness <
    25
  ) {

    setAnimation(
      "sad"
    );

    return;
  }


  /*
     NORMAL
  */

  setAnimation(
    "idle",
    activeDirection
  );
}


/* ============================================================
   TEMPORARY REACTION ANIMATION
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


        resumeAmbient(
          1500
        );

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
   WALK ACROSS SCREEN
============================================================ */

function walkAcrossScreen() {

  if (
    walking ||
    temporaryAnimation ||
    interactionMode ||
    statusCardVisible ||
    state.sleeping ||
    !state.alive
  ) {

    return;
  }


  const limits =
    getHorizontalLimits();


  /*
     Alternate direction every trip.
  */

  const targetX =

    nextWalkDirection ===
    "right"

      ? limits.max

      : limits.min;


  const distance =
    targetX -
    currentX;


  /*
     Which sprite faces the direction
     of travel.
  */

  activeDirection =

    distance >= 0
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
      800,
      (
        Math.abs(distance) /
        WALK_SPEED
      ) *
      1000
    );


  characterMover.style.transition =
    "none";


  /*
     Force browser layout update.
  */

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


        /*
           Reverse direction for
           next journey.
        */

        nextWalkDirection =

          nextWalkDirection ===
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
    petStage.getBoundingClientRect();


  const moverRect =
    characterMover.getBoundingClientRect();


  currentX =
    (
      moverRect.left +
      moverRect.width / 2
    )
    -
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
}


/* ============================================================
   REST AT END OF WALK
============================================================ */

function beginRestPeriod() {

  if (
    state.sleeping ||
    interactionMode ||
    statusCardVisible
  ) {

    return;
  }


  const pause =
    randomBetween(
      MIN_PAUSE_MS,
      MAX_PAUSE_MS
    );


  /*
     Exhaustion / illness takes priority
     over ambient bored behavior.
  */

  if (
    getHungerStage() !== "normal"

    ||

    state.energy <=
    EXHAUSTED_THRESHOLD

    ||

    state.hunger < 20
  ) {

    updateMoodAnimation();

  }


  else if (
    Math.random() <
    BORED_PAUSE_CHANCE
  ) {

    setAnimation(
      "bored",
      activeDirection
    );

  }


  else {

    setAnimation(
      "idle",
      activeDirection
    );
  }


  resumeAmbient(
    pause
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

let messageTimer =
  null;


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


  resumeAmbient(
    1500
  );
}


/* ============================================================
   INTERACTION TRAY
============================================================ */

function openInteractionTray() {

  pauseAmbient();


  stopWalking();


  hideStatusCard();


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


  resumeAmbient(
    1500
  );
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
        i === selectedAction
      );
    }
  );
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

  pauseAmbient();


  stopWalking();


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

        setAnimation(
          "lieDown"
        );


        sleepTimer =
          setTimeout(
            () => {

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

  /*
     Forced sleep cannot be interrupted
     until some energy has recovered.
  */

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


      /*
         A successful meal resets
         the 3-day food clock.
      */

      state.lastMealAt =
        Date.now();


      state.hunger =
        100;


      state.happiness =
        clamp(
          state.happiness +
          5
        );


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


      playTemporaryAnimation(
        "lieDown",
        1700
      );

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


    /*
       LEFT / RIGHT
    */

    if (
      ax >
      SWIPE_DISTANCE

      &&

      ax > ay
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


    /*
       DOWN / UP
    */

    if (
      ay >
      SWIPE_DISTANCE

      &&

      ay > ax
    ) {

      /*
         DOWN
      */

      if (
        dy > 0
      ) {

        if (
          !interactionMode
        ) {

          openInteractionTray();
        }
      }


      /*
         UP
      */

      else {

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


    /*
       TAP WHILE MENU OPEN
    */

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
     Energy hit zero while we were awake.
  */

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


/* ============================================================
   TIMERS
============================================================ */

setInterval(
  gameTick,
  GAME_TICK_INTERVAL
);


/* ============================================================
   VISIBILITY
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
        !state.sleeping
      ) {

        resumeAmbient(
          1500
        );
      }
    }
  }
);


/* ============================================================
   PRELOAD
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


  /*
     Start centered.
  */

  characterMover.style.left =
    "50%";


  currentX =
    0;


  /*
     Apply all time that passed while
     the app was closed.
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
     If awake, begin walking shortly
     after startup.

     Pattern becomes:

       walk right
       pause
       walk left
       pause
       repeat
  */

  if (
    !state.sleeping &&
    state.alive
  ) {

    resumeAmbient(
      1800
    );
  }
}


init();