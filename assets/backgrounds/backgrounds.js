"use strict";


/* ============================================================
   POCKET FURRY BACKGROUND SYSTEM
============================================================ */

(() => {

  const BACKGROUND_ROOT =
    "assets/backgrounds/";

  const BACKGROUND_SAVE_KEY =
    "pocketFurry_background_v1";


  const backgrounds =
    window.PocketFurryBackgrounds ||
    {};


  const defaultBackgroundId =
    window.PocketFurryDefaultBackground ||
    Object.keys(
      backgrounds
    )[0] ||
    null;


  let activeBackgroundId =
    loadBackgroundId();


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

      return;

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

      return;

    }


    const path =
      BACKGROUND_ROOT +
      background.file;


    /*
       Stretch the scene to completely
       fill the available game screen.
    */

    gameScreen.style.backgroundImage =
      `url("${path}")`;

    gameScreen.style.backgroundSize =
      "100% 100%";

    gameScreen.style.backgroundPosition =
      "center center";

    gameScreen.style.backgroundRepeat =
      "no-repeat";

    gameScreen.style.backgroundColor =
      "var(--bg)";

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
      Object.keys(
        backgrounds
      );


    backgroundIds.forEach(
      (
        backgroundId,
        index
      ) => {

        const background =
          backgrounds[
            backgroundId
          ];


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


        const selected =
          backgroundId ===
          activeBackgroundId;


        button.innerHTML = `
          <span class="list-item-primary">
            ${background.name.toUpperCase()}
          </span>

          <span class="list-item-secondary">
            ${
              selected
                ? "CURRENT BACKGROUND"
                : "SELECT BACKGROUND"
            }
          </span>
        `;


        button.addEventListener(
          "click",
          () => {

            pickerIndex =
              index;


            applyBackground(
              backgroundId
            );


            openMainMenu();

          }
        );


        characterPickerList.appendChild(
          button
        );

      }
    );


    const backIndex =
      backgroundIds.length;


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
        ‹ BACK
      </span>

      <span class="list-item-secondary">
        RETURN WITHOUT CHANGING
      </span>
    `;


    backButton.addEventListener(
      "click",
      () => {

        pickerIndex =
          backIndex;


        openMainMenu();

      }
    );


    characterPickerList.appendChild(
      backButton
    );

  }


  /* ==========================================================
     RESTORE CHARACTER PICKER TITLE
  ========================================================== */

  const originalOpenCharacterPicker =
    openCharacterPicker;


  openCharacterPicker =
    function (
      slotIndex
    ) {

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