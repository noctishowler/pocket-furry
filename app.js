"use strict";


/* ============================================================
   POCKET FURRY
   v0.2

   Noctis Character Pack

   Controls:

   NORMAL MODE
   - Tap Noctis       = Pet
   - Hold Noctis      = Detailed status
   - Swipe down       = Open interaction tray

   INTERACTION MODE
   - Swipe left/right = Select action
   - Tap              = Activate selected action
   - Swipe up         = Close tray
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
   SAVE SYSTEM
============================================================ */

const SAVE_VERSION =
  3;


function getSaveKey() {

  return (
    "pocketFurry_" +
    activeCharacterId +
    "_v" +
    SAVE_VERSION
  );
}


/* ============================================================
   GAME CONSTANTS
============================================================ */

const MAX_STAT =
  100;

const GAME_TICK_INTERVAL =
  60 * 1000;

const LONG_PRESS_TIME =
  650;

const SWIPE_DISTANCE =
  35;


/* ============================================================
   DEFAULT STATE
============================================================ */

const defaultState = {

  hunger:
    85,

  happiness:
    85,

  energy:
    85,

  health:
    100,

  cleanliness:
    100,

  sleeping:
    false,

  alive:
    true,

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


const petStage =
  document.getElementById(
    "petStage"
  );


const statusHud =
  document.getElementById(
    "statusHud"
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

let actionAnimationTimer =
  null;

let messageTimer =
  null;

let sleepTransitionTimer =
  null;


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


function randomDirection() {

  return (
    Math.random() <
    0.5

      ? "left"

      : "right"
  );
}


function setDirection(direction) {

  if (
    direction !== "left" &&
    direction !== "right"
  ) {

    return;
  }


  activeDirection =
    direction;
}


/* ============================================================
   SAVE
============================================================ */

function saveState() {

  state.lastUpdate =
    Date.now();


  localStorage.setItem(
    getSaveKey(),
    JSON.stringify(state)
  );
}


/* ============================================================
   LOAD
============================================================ */

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
   ANIMATION PATH
============================================================ */

function getAnimationPath(
  name,
  direction = activeDirection
) {

  const character =
    getActiveCharacter();


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
    ]

    ||

    animation.right

    ||

    animation.left;


  if (!filename) {

    return null;
  }


  return (
    character.path +
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
      `Missing animation: ${name}`
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
============================================================ */

function playTemporaryAnimation(
  name,
  duration = 2200,
  direction = activeDirection
) {

  temporaryAnimation =
    true;


  clearTimeout(
    actionAnimationTimer
  );


  setAnimation(
    name,
    direction
  );


  actionAnimationTimer =
    setTimeout(
      () => {

        temporaryAnimation =
          false;


        updateMoodAnimation();

      },
      duration
    );
}


/* ============================================================
   STATUS HUD
============================================================ */

function updateStatusDisplay() {

  const happiness =
    rounded(
      state.happiness
    );


  const hunger =
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
    `${hunger}%`;


  energyBar.style.width =
    `${energy}%`;


  happinessValue.textContent =
    happiness;


  hungerValue.textContent =
    hunger;


  energyValue.textContent =
    energy;


  healthValue.textContent =
    health;


  cleanValue.textContent =
    clean;


  detailHappiness.style.width =
    `${happiness}%`;


  detailHunger.style.width =
    `${hunger}%`;


  detailEnergy.style.width =
    `${energy}%`;


  detailHealth.style.width =
    `${health}%`;


  detailClean.style.width =
    `${clean}%`;


  updateCriticalIndicators();
}


/* ============================================================
   CRITICAL HUD INDICATORS
============================================================ */

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

  updateStatusDisplay();


  statusCardVisible =
    true;


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
   INTERACTION TRAY
============================================================ */

function openInteractionTray() {

  interactionMode =
    true;


  hideStatusCard();


  actionTray.classList.remove(
    "hidden-tray"
  );


  controlHint.textContent =
    "◀ ▶ SELECT  •  TAP ACTIVATE  •  SWIPE UP CLOSE";
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
    )

    %

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
  duration = 1600
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
   DECAY
============================================================ */

function applyOfflineDecay() {

  const character =
    getActiveCharacter();


  const p =
    character.personality;


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
    state.hunger <
    15
  ) {

    state.health =
      clamp(
        state.health -
        0.35 *
        minutes
      );
  }


  if (
    state.cleanliness <
    15
  ) {

    state.health =
      clamp(
        state.health -
        0.20 *
        minutes
      );
  }


  if (
    state.hunger <
    25
  ) {

    state.happiness =
      clamp(
        state.happiness -
        0.20 *
        minutes
      );
  }


  if (
    state.health <=
    0
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
   MOOD
============================================================ */

function updateMoodAnimation() {

  if (
    temporaryAnimation
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
    state.health <
    35
  ) {

    setAnimation(
      "sick"
    );

    return;
  }


  if (
    state.hunger <
    25
  ) {

    setAnimation(
      "hungry"
    );

    return;
  }


  if (
    state.energy <
    20
  ) {

    setAnimation(
      "sleepy"
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


  if (
    state.happiness <
    45
  ) {

    setAnimation(
      "bored"
    );

    return;
  }


  if (
    state.happiness >
    85

    &&

    state.energy >
    45
  ) {

    setAnimation(
      "happy"
    );

    return;
  }


  setAnimation(
    "idle"
  );
}


/* ============================================================
   SLEEP
============================================================ */

function putCharacterToSleep() {

  state.sleeping =
    true;


  temporaryAnimation =
    true;


  setAnimation(
    "sleepy"
  );


  showMessage(
    "Noctis is getting sleepy."
  );


  clearTimeout(
    sleepTransitionTimer
  );


  sleepTransitionTimer =
    setTimeout(
      () => {

        setAnimation(
          "lieDown"
        );


        sleepTransitionTimer =
          setTimeout(
            () => {

              temporaryAnimation =
                false;


              setAnimation(
                "sleep"
              );


              saveState();

            },
            1300
          );

      },
      1300
    );
}


/* ============================================================
   WAKE
============================================================ */

function wakeCharacter() {

  if (
    !state.sleeping
  ) {

    return;
  }


  clearTimeout(
    sleepTransitionTimer
  );


  state.sleeping =
    false;


  temporaryAnimation =
    true;


  setAnimation(
    "wakeUp"
  );


  showMessage(
    "Noctis wakes up."
  );


  clearTimeout(
    actionAnimationTimer
  );


  actionAnimationTimer =
    setTimeout(
      () => {

        temporaryAnimation =
          false;


        updateMoodAnimation();

      },
      1700
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

    showMessage(
      "Noctis isn't responding."
    );

    return;
  }


  state.lastInteraction =
    Date.now();


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


      state.hunger =
        clamp(
          state.hunger +
          30
        );


      state.happiness =
        clamp(
          state.happiness +
          4
        );


      playTemporaryAnimation(
        "eat",
        2500
      );


      showMessage(
        "Noctis eats."
      );

      break;


    case "play":

      if (
        state.sleeping
      ) {

        wakeCharacter();

        return;
      }


      if (
        state.energy <
        15
      ) {

        playTemporaryAnimation(
          "sleepy",
          1800
        );


        showMessage(
          "Too tired."
        );

        break;
      }


      state.happiness =
        clamp(
          state.happiness +
          22
        );


      state.energy =
        clamp(
          state.energy -
          12
        );


      state.hunger =
        clamp(
          state.hunger -
          6
        );


      activeDirection =
        randomDirection();


      playTemporaryAnimation(

        Math.random() <
        0.5

          ? "jump"

          : "bound",

        2700,

        activeDirection
      );


      showMessage(
        "Play time!"
      );

      break;


    case "pet":

      if (
        state.sleeping
      ) {

        showMessage(
          "Shh..."
        );

        return;
      }


      state.happiness =
        clamp(
          state.happiness +
          10
        );


      playTemporaryAnimation(
        "happy",
        1700
      );


      showMessage(
        "Tail wag."
      );

      break;


    case "clean":

      if (
        state.sleeping
      ) {

        showMessage(
          "Noctis is sleeping."
        );

        return;
      }


      state.cleanliness =
        100;


      state.health =
        clamp(
          state.health +
          3
        );


      playTemporaryAnimation(
        "lieDown",
        2100
      );


      showMessage(
        "Much better."
      );

      break;


    case "sleep":

      if (
        state.sleeping
      ) {

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
          "No medicine needed."
        );

        break;
      }


      state.health =
        clamp(
          state.health +
          30
        );


      state.happiness =
        clamp(
          state.happiness -
          3
        );


      playTemporaryAnimation(
        "angry",
        1800
      );


      showMessage(
        "Not impressed."
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
    state.sleeping ||
    !state.alive ||
    interactionMode ||
    statusCardVisible
  ) {

    return;
  }


  const unattended =

    Date.now() -

    state.lastInteraction;


  if (
    unattended >
    8 * 60 * 1000

    &&

    Math.random() <
    0.35
  ) {

    playTemporaryAnimation(
      "bored",
      3200
    );

    return;
  }


  const roll =
    Math.random();


  if (
    roll <
    0.12
  ) {

    activeDirection =
      randomDirection();


    playTemporaryAnimation(
      "walk",
      2800,
      activeDirection
    );

  } else if (
    roll <
    0.17
  ) {

    activeDirection =
      randomDirection();


    playTemporaryAnimation(
      "bound",
      2300,
      activeDirection
    );

  } else if (
    roll <
    0.22
  ) {

    playTemporaryAnimation(
      "happy",
      1700
    );
  }
}


/* ============================================================
   BUTTONS
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
   POINTER DOWN
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


/* ============================================================
   POINTER MOVE
============================================================ */

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
      15

      ||

      dy >
      15
    ) {

      clearTimeout(
        longPressTimer
      );
    }
  }
);


/* ============================================================
   POINTER UP
============================================================ */

document.addEventListener(
  "pointerup",
  event => {

    clearTimeout(
      longPressTimer
    );


    const dx =

      event.clientX -

      pointerStartX;


    const dy =

      event.clientY -

      pointerStartY;


    const distanceX =
      Math.abs(dx);


    const distanceY =
      Math.abs(dy);


    const elapsed =

      Date.now() -

      pointerStartTime;


    if (
      longPressTriggered
    ) {

      return;
    }


    /* --------------------------------------------------------
       HORIZONTAL SWIPE
    --------------------------------------------------------- */

    if (
      distanceX >
      SWIPE_DISTANCE

      &&

      distanceX >
      distanceY
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


    /* --------------------------------------------------------
       VERTICAL SWIPE
    --------------------------------------------------------- */

    if (
      distanceY >
      SWIPE_DISTANCE

      &&

      distanceY >
      distanceX
    ) {

      /* Swipe down */

      if (
        dy >
        0
      ) {

        if (
          !interactionMode
        ) {

          openInteractionTray();
        }

      }

      /* Swipe up */

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


    /* --------------------------------------------------------
       TAP
    --------------------------------------------------------- */

    if (
      distanceX <
      15

      &&

      distanceY <
      15

      &&

      elapsed <
      450
    ) {

      if (
        statusCardVisible
      ) {

        hideStatusCard();

        return;
      }


      if (
        interactionMode
      ) {

        if (
          event.target.closest(
            ".action"
          )
        ) {

          return;
        }


        performAction(
          actions[
            selectedAction
          ]
        );


        return;
      }


      if (
        pointerTarget ===
        characterSprite
      ) {

        performAction(
          "pet"
        );
      }
    }
  }
);


/* ============================================================
   DESKTOP KEYBOARD TESTING
============================================================ */

document.addEventListener(
  "keydown",
  event => {

    switch (
      event.key
    ) {


      case "ArrowDown":

        openInteractionTray();

        break;


      case "ArrowUp":

        closeInteractionTray();

        hideStatusCard();

        break;


      case "ArrowLeft":

        if (
          interactionMode
        ) {

          previousAction();
        }

        break;


      case "ArrowRight":

        if (
          interactionMode
        ) {

          nextAction();
        }

        break;


      case "Enter":

      case " ":

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


      case "s":

      case "S":

        showStatusCard();

        break;
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
  25 * 1000
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

      saveState();

    } else {

      applyOfflineDecay();

      updateStatusDisplay();

      updateMoodAnimation();
    }
  }
);


/* ============================================================
   EXIT
============================================================ */

window.addEventListener(
  "beforeunload",
  saveState
);


/* ============================================================
   PRELOAD GIFS
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

          const preload =
            new Image();


          preload.src =
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