"use strict";


/* ============================================================
   POCKET FURRY
   META DISPLAY BUILD
============================================================ */


/* ============================================================
   CHARACTER PACKS
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
    },

    personality: {

      hungerDecay: 0.55,

      happinessDecay: 0.25,

      energyDecay: 0.20,

      cleanlinessDecay: 0.10,

      sleepRecovery: 0.85
    }
  }
};


/* ============================================================
   ACTIVE CHARACTER
============================================================ */

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
   SAVE
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
   CONSTANTS
============================================================ */

const MAX_STAT =
  100;


const GAME_TICK_INTERVAL =
  60 * 1000;


/*
  Meta Display gestures need a little more
  deliberate movement than a phone.
*/

const SWIPE_DISTANCE =
  28;


const LONG_PRESS_TIME =
  700;


/*
  Conservative character movement range.
*/

const WALK_MARGIN =
  28;


/*
  Pixel travel speed.
*/

const WALK_SPEED =
  34;


/*
  Chance to do something autonomously
  every behavior tick.
*/

const BEHAVIOR_INTERVAL =
  10 * 1000;


/* ============================================================
   DEFAULT STATE
============================================================ */

const defaultState = {

  hunger: 85,

  happiness: 85,

  energy: 85,

  health: 100,

  cleanliness: 100,

  sleeping: false,

  alive: true,

  lastUpdate:
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
   ACTIONS
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


/* ============================================================
   UI STATE
============================================================ */

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
   MOVEMENT STATE
============================================================ */

let walking =
  false;


let walkTimer =
  null;


let currentX =
  0;


/* ============================================================
   POINTER STATE
============================================================ */

let pointerStartX =
  0;


let pointerStartY =
  0;


let pointerStartTime =
  0;


let pointerTarget =
  null;


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


function randomDirection() {

  return (
    Math.random() < 0.5
      ? "left"
      : "right"
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

    return {
      ...defaultState,
      ...JSON.parse(saved)
    };

  } catch {

    return {
      ...defaultState
    };
  }
}


/* ============================================================
   ANIMATIONS
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


  const file =
    animation[direction]
    ||
    animation.right
    ||
    animation.left;


  if (!file) {

    return null;
  }


  return (
    getActiveCharacter().path +
    file
  );
}


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
   TEMPORARY ANIMATION

   Every reaction automatically returns to idle
   after its allotted playback time.
============================================================ */

function playTemporaryAnimation(
  name,
  duration,
  direction = activeDirection
) {

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


        /*
          Normal temporary animations always
          return to idle after completion.
        */

        if (
          state.alive &&
          !state.sleeping
        ) {

          setAnimation(
            "idle",
            activeDirection
          );

        } else {

          updateMoodAnimation();
        }

      },
      duration
    );
}


/* ============================================================
   STATUS
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


function updateCriticalIndicators() {

  document
    .querySelector(
      '[data-stat="happiness"]'
    )
    .classList.toggle(
      "critical",
      state.happiness < 25
    );


  document
    .querySelector(
      '[data-stat="hunger"]'
    )
    .classList.toggle(
      "critical",
      state.hunger < 25
    );


  document
    .querySelector(
      '[data-stat="energy"]'
    )
    .classList.toggle(
      "critical",
      state.energy < 20
    );
}


/* ============================================================
   STATUS CARD
============================================================ */

function showStatusCard() {

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
}


/* ============================================================
   INTERACTION MENU
============================================================ */

function openInteractionTray() {

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
   MESSAGE
============================================================ */

function showMessage(
  text,
  duration = 1300
) {

  message.textContent =
    text;


  message.classList.remove(
    "hidden"
  );


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
   CHARACTER HORIZONTAL LIMITS
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
   WALKING
============================================================ */

function walkTo(
  targetX
) {

  if (
    walking ||
    temporaryAnimation ||
    state.sleeping ||
    !state.alive ||
    interactionMode ||
    statusCardVisible
  ) {

    return;
  }


  const limits =
    getHorizontalLimits();


  targetX =
    Math.max(
      limits.min,
      Math.min(
        limits.max,
        targetX
      )
    );


  const distance =
    targetX -
    currentX;


  if (
    Math.abs(distance) <
    25
  ) {

    return;
  }


  const direction =
    distance > 0
      ? "right"
      : "left";


  activeDirection =
    direction;


  walking =
    true;


  setAnimation(
    "walk",
    direction
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


  characterMover.offsetHeight;


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


        setAnimation(
          "idle",
          activeDirection
        );

      },
      duration + 20
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


function randomWalk() {

  const limits =
    getHorizontalLimits();


  if (
    limits.max <= 0
  ) {

    return;
  }


  const target =
    limits.min +
    Math.random() *
    (
      limits.max -
      limits.min
    );


  walkTo(
    target
  );
}


/* ============================================================
   DECAY
============================================================ */

function applyOfflineDecay() {

  const p =
    getActiveCharacter()
      .personality;


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


  state.hunger =
    clamp(
      state.hunger -
      p.hungerDecay *
      minutes
    );


  state.happiness =
    clamp(
      state.happiness -
      p.happinessDecay *
      minutes
    );


  if (
    state.sleeping
  ) {

    state.energy =
      clamp(
        state.energy +
        p.sleepRecovery *
        minutes
      );

  } else {

    state.energy =
      clamp(
        state.energy -
        p.energyDecay *
        minutes
      );
  }


  state.cleanliness =
    clamp(
      state.cleanliness -
      p.cleanlinessDecay *
      minutes
    );


  if (
    state.hunger < 15
  ) {

    state.health =
      clamp(
        state.health -
        0.35 *
        minutes
      );
  }


  if (
    state.cleanliness < 15
  ) {

    state.health =
      clamp(
        state.health -
        0.20 *
        minutes
      );
  }


  if (
    state.health <= 0
  ) {

    state.alive =
      false;


    state.sleeping =
      false;
  }


  state.lastUpdate =
    now;


  saveState();
}


/* ============================================================
   MOOD STATE
============================================================ */

function updateMoodAnimation() {

  if (
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


  if (
    state.health < 35
  ) {

    setAnimation(
      "sick"
    );

    return;
  }


  if (
    state.hunger < 25
  ) {

    setAnimation(
      "hungry"
    );

    return;
  }


  if (
    state.energy < 20
  ) {

    setAnimation(
      "sleepy"
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


  if (
    state.happiness < 45
  ) {

    setAnimation(
      "bored"
    );

    return;
  }


  setAnimation(
    "idle",
    activeDirection
  );
}


/* ============================================================
   SLEEP SEQUENCE
============================================================ */

function putCharacterToSleep() {

  stopWalking();


  state.sleeping =
    true;


  temporaryAnimation =
    true;


  setAnimation(
    "sleepy"
  );


  showMessage(
    "Sleepy..."
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


function wakeCharacter() {

  if (!state.sleeping) {

    return;
  }


  state.sleeping =
    false;


  temporaryAnimation =
    true;


  setAnimation(
    "wakeUp"
  );


  showMessage(
    "Awake."
  );


  clearTimeout(
    animationTimer
  );


  animationTimer =
    setTimeout(
      () => {

        temporaryAnimation =
          false;


        setAnimation(
          "idle",
          activeDirection
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

  if (!state.alive) {

    return;
  }


  state.lastInteraction =
    Date.now();


  switch (action) {


    case "feed":

      if (state.sleeping) {

        wakeCharacter();

        return;
      }


      state.hunger =
        clamp(
          state.hunger + 30
        );


      state.happiness =
        clamp(
          state.happiness + 4
        );


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
        state.energy < 15
      ) {

        playTemporaryAnimation(
          "sleepy",
          1500
        );


        showMessage(
          "Too tired"
        );

        break;
      }


      state.happiness =
        clamp(
          state.happiness + 22
        );


      state.energy =
        clamp(
          state.energy - 12
        );


      state.hunger =
        clamp(
          state.hunger - 6
        );


      activeDirection =
        randomDirection();


      playTemporaryAnimation(

        Math.random() < 0.5
          ? "jump"
          : "bound",

        2200,

        activeDirection
      );


      break;


    case "pet":

      state.happiness =
        clamp(
          state.happiness + 10
        );


      playTemporaryAnimation(
        "happy",
        1500
      );


      break;


    case "clean":

      state.cleanliness =
        100;


      state.health =
        clamp(
          state.health + 3
        );


      playTemporaryAnimation(
        "lieDown",
        1800
      );


      break;


    case "sleep":

      if (state.sleeping) {

        wakeCharacter();

      } else {

        putCharacterToSleep();
      }

      break;


    case "medicine":

      if (
        state.health >
        85
      ) {

        showMessage(
          "Healthy"
        );

        break;
      }


      state.health =
        clamp(
          state.health + 30
        );


      state.happiness =
        clamp(
          state.happiness - 3
        );


      playTemporaryAnimation(
        "angry",
        1600
      );

      break;
  }


  updateStatusDisplay();

  saveState();
}


/* ============================================================
   RANDOM BEHAVIOR
============================================================ */

function randomBehavior() {

  if (
    temporaryAnimation ||
    walking ||
    interactionMode ||
    statusCardVisible ||
    state.sleeping ||
    !state.alive
  ) {

    return;
  }


  const roll =
    Math.random();


  /*
    Walking is intentionally the most
    common ambient action.
  */

  if (
    roll < 0.55
  ) {

    randomWalk();

    return;
  }


  if (
    roll < 0.65
  ) {

    playTemporaryAnimation(
      "happy",
      1400
    );

    return;
  }


  if (
    roll < 0.73
  ) {

    activeDirection =
      randomDirection();


    playTemporaryAnimation(
      "bound",
      1800,
      activeDirection
    );

    return;
  }


  if (
    roll < 0.80
  ) {

    playTemporaryAnimation(
      "bored",
      1800
    );
  }
}


/* ============================================================
   ACTION BUTTON INPUT
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
   POINTER INPUT
============================================================ */

document.addEventListener(
  "pointerdown",
  event => {

    pointerStartX =
      event.clientX;


    pointerStartY =
      event.clientY;


    pointerStartTime =
      Date.now();


    pointerTarget =
      event.target;


    longPressTriggered =
      false;


    clearTimeout(
      longPressTimer
    );


    if (
      event.target === characterSprite &&
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

    if (
      Math.abs(
        event.clientX -
        pointerStartX
      ) > 12

      ||

      Math.abs(
        event.clientY -
        pointerStartY
      ) > 12
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
      Horizontal gesture only matters
      while menu is open.
    */

    if (
      ax > SWIPE_DISTANCE &&
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
      Swipe down = menu
      Swipe up   = close menu/status
    */

    if (
      ay > SWIPE_DISTANCE &&
      ay > ax
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


    /*
      Tap while action tray open
      activates selected action.

      No tap-to-idle behavior.
    */

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
   GAME TICK
============================================================ */

function gameTick() {

  applyOfflineDecay();

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


setInterval(
  randomBehavior,
  BEHAVIOR_INTERVAL
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

      stopWalking();

      saveState();

    } else {

      applyOfflineDecay();

      updateStatusDisplay();

      updateMoodAnimation();
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


  characterMover.style.left =
    "50%";


  currentX =
    0;


  applyOfflineDecay();

  selectAction(0);

  updateStatusDisplay();

  updateMoodAnimation();


  characterSprite.addEventListener(
    "dragstart",
    event =>
      event.preventDefault()
  );
}


init();