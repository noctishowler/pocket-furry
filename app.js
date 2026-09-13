"use strict";


/* ============================================================
   POCKET FURRY

   Character-based virtual pet engine.

   Noctis is Character Pack #1.

   Future characters can be added without rewriting
   the core pet engine.
============================================================ */


/* ============================================================
   CHARACTER PACKS
============================================================ */

const characters = {


  noctis: {

    id:
      "noctis",

    name:
      "Noctis",

    path:
      "assets/characters/noctis/",


    animations: {

      idle:
        "idle.gif",

      happy:
        "happy.gif",

      sad:
        "sad.gif",

      angry:
        "angry.gif",

      bored:
        "bored.gif",

      hungry:
        "hungry.gif",

      sick:
        "sick.gif",

      sleep:
        "sleep.gif",

      eat:
        "eat.gif",

      play:
        "play.gif",

      walk:
        "walk.gif",

      run:
        "run.gif",

      excited:
        "excited.gif",

      pet:
        "pet.gif",

      clean:
        "clean.gif",

      dead:
        "dead.gif"
    },


    /* --------------------------------------------------------
       CHARACTER PERSONALITY

       Later, each furry can have different stat behavior.
    --------------------------------------------------------- */

    personality: {

      hungerDecay:
        0.55,

      happinessDecay:
        0.25,

      energyDecay:
        0.20,

      cleanlinessDecay:
        0.10,

      sleepRecovery:
        0.85
    }
  }

};


/* ============================================================
   ACTIVE CHARACTER
============================================================ */

let activeCharacterId =
  "noctis";


function getActiveCharacter() {

  return characters[
    activeCharacterId
  ];
}


/* ============================================================
   SAVE SYSTEM
============================================================ */

const SAVE_VERSION =
  1;


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


/* ============================================================
   LOAD STATE
============================================================ */

let state =
  loadState();


/* ============================================================
   DOM ELEMENTS
============================================================ */

const characterSprite =
  document.getElementById(
    "character"
  );


const hungerBar =
  document.getElementById(
    "hungerBar"
  );


const happinessBar =
  document.getElementById(
    "happinessBar"
  );


const energyBar =
  document.getElementById(
    "energyBar"
  );


const healthBar =
  document.getElementById(
    "healthBar"
  );


const statusBar =
  document.getElementById(
    "statusBar"
  );


const actionBar =
  document.getElementById(
    "actionBar"
  );


const message =
  document.getElementById(
    "message"
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
   ANIMATION STATE
============================================================ */

let currentAnimation =
  "";


let actionAnimationTimer =
  null;


let messageTimer =
  null;


let temporaryAnimation =
  false;


/* ============================================================
   UI STATE
============================================================ */

let uiVisible =
  true;


/* ============================================================
   POINTER STATE
============================================================ */

let pointerStartX =
  0;


let pointerStartY =
  0;


let pointerStartTime =
  0;


/* ============================================================
   UTILITY
============================================================ */

function clamp(
  value
) {

  return Math.max(

    0,

    Math.min(
      MAX_STAT,
      value
    )
  );
}


/* ============================================================
   CHARACTER HELPERS
============================================================ */

function getAnimationPath(
  animationName
) {

  const character =
    getActiveCharacter();


  const filename =
    character.animations[
      animationName
    ];


  if (!filename) {

    return null;
  }


  return (
    character.path +
    filename
  );
}


/* ============================================================
   SAVE
============================================================ */

function saveState() {

  state.lastUpdate =
    Date.now();


  localStorage.setItem(

    getSaveKey(),

    JSON.stringify(
      state
    )
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

      ...JSON.parse(
        saved
      )
    };

  } catch {

    return {
      ...defaultState
    };
  }
}


/* ============================================================
   CHARACTER SWITCHING

   Not exposed in the interface yet.

   Later this can become the character-selection screen.
============================================================ */

function switchCharacter(
  characterId
) {

  if (
    !characters[
      characterId
    ]
  ) {

    console.warn(
      "Unknown character:",
      characterId
    );

    return;
  }


  saveState();


  activeCharacterId =
    characterId;


  state =
    loadState();


  currentAnimation =
    "";


  updateMeters();

  updateMoodAnimation();


  showMessage(

    getActiveCharacter().name

  );
}


/* ============================================================
   OFFLINE / CLOSED APP DECAY
============================================================ */

function applyOfflineDecay() {

  const character =
    getActiveCharacter();


  const personality =
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


  /* --------------------------------------------------------
     FOOD
  --------------------------------------------------------- */

  state.hunger =
    clamp(

      state.hunger -

      personality.hungerDecay *

      minutes
    );


  /* --------------------------------------------------------
     MOOD
  --------------------------------------------------------- */

  state.happiness =
    clamp(

      state.happiness -

      personality.happinessDecay *

      minutes
    );


  /* --------------------------------------------------------
     ENERGY
  --------------------------------------------------------- */

  if (
    state.sleeping
  ) {

    state.energy =
      clamp(

        state.energy +

        personality.sleepRecovery *

        minutes
      );

  } else {

    state.energy =
      clamp(

        state.energy -

        personality.energyDecay *

        minutes
      );
  }


  /* --------------------------------------------------------
     CLEANLINESS
  --------------------------------------------------------- */

  state.cleanliness =
    clamp(

      state.cleanliness -

      personality.cleanlinessDecay *

      minutes
    );


  /* --------------------------------------------------------
     STARVATION DAMAGE
  --------------------------------------------------------- */

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


  /* --------------------------------------------------------
     FILTH DAMAGE
  --------------------------------------------------------- */

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


  /* --------------------------------------------------------
     LOW FOOD MOOD PENALTY
  --------------------------------------------------------- */

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


  /* --------------------------------------------------------
     DEATH
  --------------------------------------------------------- */

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
   METERS
============================================================ */

function updateMeters() {

  hungerBar.style.width =
    `${state.hunger}%`;


  happinessBar.style.width =
    `${state.happiness}%`;


  energyBar.style.width =
    `${state.energy}%`;


  healthBar.style.width =
    `${state.health}%`;
}


/* ============================================================
   ANIMATION CONTROL
============================================================ */

function setAnimation(
  name
) {

  const path =
    getAnimationPath(
      name
    );


  if (!path) {

    console.warn(

      `Animation "${name}" does not exist for ${getActiveCharacter().name}`
    );

    return;
  }


  if (
    currentAnimation ===
    name
  ) {

    return;
  }


  currentAnimation =
    name;


  characterSprite.src =
    path;
}


/* ============================================================
   TEMPORARY ANIMATION
============================================================ */

function playTemporaryAnimation(

  name,

  duration =
    2400

) {

  temporaryAnimation =
    true;


  clearTimeout(
    actionAnimationTimer
  );


  setAnimation(
    name
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
   AUTOMATIC MOOD / STATE ANIMATION
============================================================ */

function updateMoodAnimation() {

  if (
    temporaryAnimation
  ) {

    return;
  }


  /* --------------------------------------------------------
     DEAD
  --------------------------------------------------------- */

  if (
    !state.alive
  ) {

    setAnimation(
      "dead"
    );

    return;
  }


  /* --------------------------------------------------------
     SLEEPING
  --------------------------------------------------------- */

  if (
    state.sleeping
  ) {

    setAnimation(
      "sleep"
    );

    return;
  }


  /* --------------------------------------------------------
     SICK
  --------------------------------------------------------- */

  if (
    state.health <
    35
  ) {

    setAnimation(
      "sick"
    );

    return;
  }


  /* --------------------------------------------------------
     HUNGRY
  --------------------------------------------------------- */

  if (
    state.hunger <
    25
  ) {

    setAnimation(
      "hungry"
    );

    return;
  }


  /* --------------------------------------------------------
     SAD
  --------------------------------------------------------- */

  if (
    state.happiness <
    25
  ) {

    setAnimation(
      "sad"
    );

    return;
  }


  /* --------------------------------------------------------
     BORED
  --------------------------------------------------------- */

  if (
    state.happiness <
    45
  ) {

    setAnimation(
      "bored"
    );

    return;
  }


  /* --------------------------------------------------------
     HAPPY
  --------------------------------------------------------- */

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


  /* --------------------------------------------------------
     DEFAULT
  --------------------------------------------------------- */

  setAnimation(
    "idle"
  );
}


/* ============================================================
   MESSAGE
============================================================ */

function showMessage(

  text,

  duration =
    1700

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
   WAKE
============================================================ */

function wakeCharacter() {

  state.sleeping =
    false;


  showMessage(

    `${getActiveCharacter().name} wakes up.`
  );


  updateMoodAnimation();
}


/* ============================================================
   ACTIONS
============================================================ */

function performAction(
  action
) {

  const character =
    getActiveCharacter();


  if (
    !state.alive
  ) {

    showMessage(

      `${character.name} is no longer responding.`
    );

    return;
  }


  state.lastInteraction =
    Date.now();


  switch (
    action
  ) {


    /* ======================================================
       FEED
    ====================================================== */

    case "feed":

      if (
        state.sleeping
      ) {

        wakeCharacter();
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

        2600
      );


      showMessage(

        `${character.name} eats.`
      );

      break;


    /* ======================================================
       PLAY
    ====================================================== */

    case "play":

      if (
        state.sleeping
      ) {

        wakeCharacter();
      }


      if (
        state.energy <
        15
      ) {

        showMessage(

          `${character.name} is too tired.`
        );


        playTemporaryAnimation(

          "sad",

          1800
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


      if (
        Math.random() >
        0.5
      ) {

        playTemporaryAnimation(

          "play",

          3000
        );

      } else {

        playTemporaryAnimation(

          "run",

          3000
        );
      }


      showMessage(
        "Play time!"
      );

      break;


    /* ======================================================
       PET
    ====================================================== */

    case "pet":

      if (
        state.sleeping
      ) {

        showMessage(

          `${character.name} is sleeping.`
        );

        return;
      }


      state.happiness =
        clamp(

          state.happiness +
          10
        );


      playTemporaryAnimation(

        "pet",

        1800
      );


      showMessage(
        "Tail wag."
      );

      break;


    /* ======================================================
       CLEAN
    ====================================================== */

    case "clean":

      state.cleanliness =
        100;


      state.health =
        clamp(

          state.health +
          3
        );


      playTemporaryAnimation(

        "clean",

        2200
      );


      showMessage(
        "Much better."
      );

      break;


    /* ======================================================
       SLEEP
    ====================================================== */

    case "sleep":

      if (
        state.sleeping
      ) {

        wakeCharacter();

      } else {

        state.sleeping =
          true;


        setAnimation(
          "sleep"
        );


        showMessage(
          "Good night."
        );
      }

      break;


    /* ======================================================
       MEDICINE
    ====================================================== */

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

        1700
      );


      showMessage(
        "Not impressed."
      );

      break;
  }


  updateMeters();


  saveState();
}


/* ============================================================
   RANDOM BEHAVIOR
============================================================ */

function randomBehavior() {

  if (

    temporaryAnimation

    ||

    state.sleeping

    ||

    !state.alive
  ) {

    return;
  }


  const timeSinceInteraction =

    Date.now() -

    state.lastInteraction;


  /* --------------------------------------------------------
     BORED WHEN LEFT ALONE
  --------------------------------------------------------- */

  if (

    timeSinceInteraction >

    8 *
    60 *
    1000

    &&

    Math.random() <
    0.35
  ) {

    playTemporaryAnimation(

      "bored",

      3500
    );


    return;
  }


  /* --------------------------------------------------------
     AMBIENT ACTION
  --------------------------------------------------------- */

  const roll =
    Math.random();


  if (
    roll <
    0.15
  ) {

    playTemporaryAnimation(

      "walk",

      2800
    );

  } else if (
    roll <
    0.22
  ) {

    playTemporaryAnimation(

      "happy",

      1800
    );
  }
}


/* ============================================================
   ACTION SELECTOR
============================================================ */

function selectAction(
  index
) {

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


/* ============================================================
   NEXT ACTION
============================================================ */

function nextAction() {

  selectAction(

    selectedAction +
    1
  );
}


/* ============================================================
   PREVIOUS ACTION
============================================================ */

function previousAction() {

  selectAction(

    selectedAction -
    1
  );
}


/* ============================================================
   ACTIVATE CURRENT ACTION
============================================================ */

function activateSelectedAction() {

  performAction(

    actions[
      selectedAction
    ]
  );
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

          actions[
            index
          ]
        );
      }
    );
  }
);


/* ============================================================
   POINTER START
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
  }
);


/* ============================================================
   POINTER END
============================================================ */

document.addEventListener(

  "pointerup",

  event => {

    const dx =

      event.clientX -

      pointerStartX;


    const dy =

      event.clientY -

      pointerStartY;


    const distanceX =
      Math.abs(
        dx
      );


    const distanceY =
      Math.abs(
        dy
      );


    const elapsed =

      Date.now() -

      pointerStartTime;


    /* --------------------------------------------------------
       HORIZONTAL SWIPE
    --------------------------------------------------------- */

    if (

      distanceX >
      35

      &&

      distanceX >
      distanceY
    ) {

      if (
        dx >
        0
      ) {

        previousAction();

      } else {

        nextAction();
      }


      return;
    }


    /* --------------------------------------------------------
       VERTICAL SWIPE
    --------------------------------------------------------- */

    if (

      distanceY >
      35

      &&

      distanceY >
      distanceX
    ) {

      /* DOWN */

      if (
        dy >
        0
      ) {

        toggleUI();

      }


      /* UP */

      else {

        if (
          state.sleeping
        ) {

          wakeCharacter();

        } else {

          performAction(
            "pet"
          );
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

      activateSelectedAction();
    }
  }
);


/* ============================================================
   UI VISIBILITY
============================================================ */

function toggleUI() {

  uiVisible =
    !uiVisible;


  statusBar.classList.toggle(

    "hidden-ui",

    !uiVisible
  );


  actionBar.classList.toggle(

    "hidden-ui",

    !uiVisible
  );
}


/* ============================================================
   DESKTOP KEYBOARD TESTING
============================================================ */

document.addEventListener(

  "keydown",

  event => {

    switch (
      event.key
    ) {


      case "ArrowLeft":

        previousAction();

        break;


      case "ArrowRight":

        nextAction();

        break;


      case "Enter":

      case " ":

        activateSelectedAction();

        break;


      case "ArrowDown":

        toggleUI();

        break;


      case "ArrowUp":

        if (
          state.sleeping
        ) {

          wakeCharacter();

        } else {

          performAction(
            "pet"
          );
        }

        break;
    }
  }
);


/* ============================================================
   GAME TICK
============================================================ */

function gameTick() {

  applyOfflineDecay();


  updateMeters();


  updateMoodAnimation();
}


/* ============================================================
   RANDOM AMBIENT TIMER
============================================================ */

setInterval(

  randomBehavior,

  25 *
  1000
);


/* ============================================================
   STAT UPDATE TIMER
============================================================ */

setInterval(

  gameTick,

  GAME_TICK_INTERVAL
);


/* ============================================================
   SAVE BEFORE EXIT
============================================================ */

window.addEventListener(

  "beforeunload",

  saveState
);


/* ============================================================
   PAGE VISIBILITY
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


      updateMeters();


      updateMoodAnimation();
    }
  }
);


/* ============================================================
   PREVENT IMAGE DRAG
============================================================ */

characterSprite.addEventListener(

  "dragstart",

  event =>
    event.preventDefault()
);


/* ============================================================
   INITIALIZE
============================================================ */

function init() {

  applyOfflineDecay();


  selectAction(
    0
  );


  updateMeters();


  updateMoodAnimation();
}


init();