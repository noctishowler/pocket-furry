"use strict";


/* ============================================================
   POCKET FURRY BACKGROUND SYSTEM
============================================================ */

(() => {

  const BACKGROUND_ROOT =
    "assets/backgrounds/";

  const BACKGROUND_SAVE_KEY =
    "pocketFurry_background_v1";

  const BACKGROUND_PROGRESS_KEY =
    "pocketFurry_background_unlock_day_v1";

  const DAY_MS =
    24 * 60 * 60 * 1000;


  const backgrounds =
    window.PocketFurryBackgrounds ||
    {};


  const defaultBackgroundId =
    window.PocketFurryDefaultBackground ||
    Object.keys(
      backgrounds
    )[0] ||
    null;


  /*
     Locations unlock by companion age:

     Day 1  Home
     Day 2  Outside
     Day 3  Night City
     Day 4  Day Woods
     Day 5  Camping
     Day 6  Night Woods

     "None" is a utility option rather than a location,
     so it remains available at all times.
  */

  const BACKGROUND_UNLOCK_DAY = {
    none: 0,
    home: 1,
    outside: 2,
    nightcity: 3,
    daywoods: 4,
    camping: 5,
    nightwoods: 6
  };


  const BACKGROUND_ORDER = [
    "none",
    "home",
    "outside",
    "nightcity",
    "daywoods",
    "camping",
    "nightwoods"
  ];


  let activeBackgroundId =
    loadBackgroundId();

  let backgroundPickerOpen =
    false;


  /* ==========================================================
     PROGRESSION
  ========================================================== */

  function getOldestCompanionCreatedAt() {

    if (
      typeof appState ===
        "undefined" ||
      !appState ||
      !Array.isArray(
        appState.slots
      )
    ) {

      return null;

    }


    const createdTimes =
      appState.slots
        .filter(
          slot =>
            slot &&
            Number.isFinite(
              Number(
                slot.createdAt
              )
            ) &&
            Number(
              slot.createdAt
            ) >
              0
        )
        .map(
          slot =>
            Number(
              slot.createdAt
            )
        );


    if (
      !createdTimes.length
    ) {

      return null;

    }


    return Math.min(
      ...createdTimes
    );

  }


  function getCalculatedProgressDay() {

    const createdAt =
      getOldestCompanionCreatedAt();


    if (
      !createdAt
    ) {

      return 1;

    }


    const elapsed =
      Math.max(
        0,
        Date.now() -
        createdAt
      );


    return Math.max(
      1,
      Math.floor(
        elapsed /
        DAY_MS
      ) +
      1
    );

  }


  function loadSavedProgressDay() {

    const saved =
      Number(
        localStorage.getItem(
          BACKGROUND_PROGRESS_KEY
        )
      );


    if (
      Number.isFinite(
        saved
      ) &&
      saved >=
        1
    ) {

      return Math.floor(
        saved
      );

    }


    return 1;

  }


  function getProgressDay() {

    const calculated =
      getCalculatedProgressDay();

    const saved =
      loadSavedProgressDay();

    const progressDay =
      Math.max(
        calculated,
        saved
      );


    /*
       Once a location has unlocked, do not relock it if
       an older companion is deleted or the device clock
       moves backward.
    */

    if (
      progressDay >
        saved
    ) {

      localStorage.setItem(
        BACKGROUND_PROGRESS_KEY,
        String(
          progressDay
        )
      );

    }


    return progressDay;

  }


  function getUnlockDay(
    backgroundId
  ) {

    const day =
      BACKGROUND_UNLOCK_DAY[
        backgroundId
      ];


    return Number.isFinite(
      day
    )
      ? day
      : 1;

  }


  function isBackgroundUnlocked(
    backgroundId
  ) {

    const unlockDay =
      getUnlockDay(
        backgroundId
      );


    return (
      unlockDay <=
      getProgressDay()
    );

  }


  function getOrderedBackgroundIds() {

    const known =
      BACKGROUND_ORDER.filter(
        backgroundId =>
          backgrounds[
            backgroundId
          ]
      );


    const extras =
      Object.keys(
        backgrounds
      ).filter(
        backgroundId =>
          !known.includes(
            backgroundId
          )
      );


    return [
      ...known,
      ...extras
    ];

  }


  /* ==========================================================
     SAVE / LOAD
  ========================================================== */

  function loadBackgroundId() {

    const saved =
      localStorage.getItem(
        BACKGROUND_SAVE_KEY
      );


    if (
      saved &&
      backgrounds[
        saved
      ]
    ) {

      return saved;

    }


    return defaultBackgroundId;
  }


  function saveBackgroundId(
    backgroundId
  ) {

    localStorage.setItem(
      BACKGROUND_SAVE_KEY,
      backgroundId
    );

  }


  /* ==========================================================
     BACKGROUND APPLICATION
  ========================================================== */

  function getActiveBackground() {

    return backgrounds[
      activeBackgroundId
    ] || null;

  }


  function applyBackground(
    backgroundId,
    save =
      true
  ) {

    const background =
      backgrounds[
        backgroundId
      ];


    if (
      !background
    ) {

      return false;

    }


    if (
      !isBackgroundUnlocked(
        backgroundId
      )
    ) {

      return false;

    }


    activeBackgroundId =
      backgroundId;


    if (
      save
    ) {

      saveBackgroundId(
        backgroundId
      );

    }


    if (
      !background.file
    ) {

      gameScreen.style.backgroundImage =
        "none";

      gameScreen.style.backgroundSize =
        "";

      gameScreen.style.backgroundPosition =
        "";

      gameScreen.style.backgroundRepeat =
        "";

      gameScreen.style.backgroundColor =
        "";

      return true;

    }


    const portrait = window.matchMedia("(orientation: portrait)").matches;
    const file = portrait
      ? background.file.replace(/\.(png)$/i, "-portrait.$1")
      : background.file;
    const path = BACKGROUND_ROOT + file;


    /*
       Use portrait artwork without stretching on upright screens.\n       Preserve the existing landscape presentation.
    */

    gameScreen.style.backgroundImage =
      `url("${path}")`;

    gameScreen.style.backgroundSize =
      portrait ? "cover" : "100% 100%";

    gameScreen.style.backgroundPosition =
      portrait ? "center bottom" : "center center";

    gameScreen.style.backgroundRepeat =
      "no-repeat";

    gameScreen.style.backgroundColor =
      "var(--bg)";


    return true;

  }


  function ensureActiveBackgroundUnlocked() {

    if (
      isBackgroundUnlocked(
        activeBackgroundId
      )
    ) {

      return;

    }


    activeBackgroundId =
      backgrounds.home
        ? "home"
        : defaultBackgroundId;


    if (
      activeBackgroundId
    ) {

      saveBackgroundId(
        activeBackgroundId
      );

    }

  }


  /* ==========================================================
     BACKGROUND MENU BUTTON
  ========================================================== */

  function addBackgroundMenuButton() {

    if (
      companionList.querySelector(
        ".background-select"
      )
    ) {

      return;

    }


    const background =
      getActiveBackground();


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.tabIndex =
      -1;


    button.className =
      "list-item focusable background-select";


    button.dataset.kind =
      "background";


    button.innerHTML = `
      <span class="list-item-primary">
        BACKGROUND
      </span>

      <span class="list-item-secondary">
        ${
          background
            ? background.name.toUpperCase()
            : "SELECT BACKGROUND"
        }
      </span>
    `;


    button.addEventListener(
      "click",
      () => {

        openBackgroundPicker();


        requestAnimationFrame(
          focusApp
        );

      }
    );


    companionList.appendChild(
      button
    );


    updateMainMenuSelection(
      false
    );

  }


  /* ==========================================================
     BACKGROUND PICKER
  ========================================================== */

  function openBackgroundPicker() {

    pendingSlotIndex =
      null;


    pickerIndex =
      0;


    backgroundPickerOpen =
      true;


    const title =
      pickerScreen.querySelector(
        ".menu-title"
      );


    if (
      title
    ) {

      title.textContent =
        "CHOOSE A BACKGROUND";

    }


    renderBackgroundPicker();


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


  function renderBackgroundPicker() {

    characterPickerList.innerHTML =
      "";


    const backgroundIds =
      getOrderedBackgroundIds();


    backgroundIds.forEach(
      backgroundId => {

        const background =
          backgrounds[
            backgroundId
          ];


        const unlocked =
          isBackgroundUnlocked(
            backgroundId
          );


        const selected =
          (
            unlocked &&
            backgroundId ===
              activeBackgroundId
          );


        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";


        button.tabIndex =
          -1;


        button.className =
          "list-item focusable";


        button.dataset.kind =
          "background-option";


        button.dataset.backgroundId =
          backgroundId;


        if (
          !unlocked
        ) {

          button.classList.add(
            "unavailable"
          );


          button.dataset.locked =
            "true";

        }


        let secondaryText;


        if (
          selected
        ) {

          secondaryText =
            "CURRENT BACKGROUND";

        } else if (
          unlocked
        ) {

          secondaryText =
            "SELECT BACKGROUND";

        } else {

          secondaryText =
            `UNLOCKS DAY ${getUnlockDay(
              backgroundId
            )}`;

        }


        button.innerHTML = `
          <span class="list-item-primary">
            ${background.name.toUpperCase()}
          </span>

          <span class="list-item-secondary">
            ${secondaryText}
          </span>
        `;


        button.addEventListener(
          "click",
          () => {

            if (
              !isBackgroundUnlocked(
                backgroundId
              )
            ) {

              return;

            }


            applyBackground(
              backgroundId
            );


            backgroundPickerOpen =
              false;


            openMainMenu();

          }
        );


        characterPickerList.appendChild(
          button
        );

      }
    );


    const backButton =
      document.createElement(
        "button"
      );


    backButton.type =
      "button";


    backButton.tabIndex =
      -1;


    backButton.className =
      "list-item focusable back";


    backButton.dataset.kind =
      "back";


    backButton.innerHTML = `
      <span class="list-item-primary">
        â¹ BACK
      </span>

      <span class="list-item-secondary">
        RETURN WITHOUT CHANGING
      </span>
    `;


    backButton.addEventListener(
      "click",
      () => {

        backgroundPickerOpen =
          false;


        openMainMenu();

      }
    );


    characterPickerList.appendChild(
      backButton
    );

  }


  /* ==========================================================
     PICKER NAVIGATION

     Locked locations remain visible but Neural Band / keyboard
     navigation skips over them.
  ========================================================== */

  const originalGetPickerButtons =
    getPickerButtons;


  getPickerButtons =
    function () {

      const buttons =
        originalGetPickerButtons();


      if (
        !backgroundPickerOpen
      ) {

        return buttons;

      }


      return buttons.filter(
        button =>
          !button.classList.contains(
            "unavailable"
          )
      );

    };


  const originalActivatePickerSelection =
    activatePickerSelection;


  activatePickerSelection =
    function () {

      if (
        !backgroundPickerOpen
      ) {

        return originalActivatePickerSelection();

      }


      const buttons =
        getPickerButtons();


      const button =
        buttons[
          pickerIndex
        ];


      if (
        !button
      ) {

        return;

      }


      if (
        button.dataset.kind ===
          "back"
      ) {

        backgroundPickerOpen =
          false;


        openMainMenu();


        return;

      }


      if (
        button.dataset.kind ===
          "background-option"
      ) {

        const backgroundId =
          button.dataset.backgroundId;


        if (
          !isBackgroundUnlocked(
            backgroundId
          )
        ) {

          return;

        }


        applyBackground(
          backgroundId
        );


        backgroundPickerOpen =
          false;


        openMainMenu();

      }

    };


  /* ==========================================================
     RESTORE CHARACTER PICKER TITLE
  ========================================================== */

  const originalOpenCharacterPicker =
    openCharacterPicker;


  openCharacterPicker =
    function (
      slotIndex
    ) {

      backgroundPickerOpen =
        false;


      const title =
        pickerScreen.querySelector(
          ".menu-title"
        );


      if (
        title
      ) {

        title.textContent =
          "CHOOSE A COMPANION";

      }


      return originalOpenCharacterPicker(
        slotIndex
      );

    };


  /* ==========================================================
     PATCH MAIN MENU
  ========================================================== */

  const originalRenderMainMenu =
    renderMainMenu;


  renderMainMenu =
    function () {

      /*
         Refresh progression whenever the
         menu is rebuilt.
      */

      getProgressDay();


      originalRenderMainMenu();


      addBackgroundMenuButton();

    };


  /* ==========================================================
     MENU ACTIVATION
  ========================================================== */

  const originalActivateMainMenuSelection =
    activateMainMenuSelection;


  activateMainMenuSelection =
    function () {

      const buttons =
        getMainMenuButtons();


      const button =
        buttons[
          mainMenuIndex
        ];


      if (
        button &&
        button.dataset.kind ===
          "background"
      ) {

        openBackgroundPicker();

        return;

      }


      originalActivateMainMenuSelection();

    };


  /* ==========================================================
     SCREEN RESIZE
  ========================================================== */

  window.addEventListener(
    "resize",
    () => {

      applyBackground(
        activeBackgroundId,
        false
      );

    }
  );


  /* ==========================================================
     INITIALIZE
  ========================================================== */

  getProgressDay();


  ensureActiveBackgroundUnlocked();


  applyBackground(
    activeBackgroundId,
    false
  );


  if (
    typeof currentScreen !==
      "undefined" &&
    currentScreen ===
      "main"
  ) {

    addBackgroundMenuButton();

  }

})();

