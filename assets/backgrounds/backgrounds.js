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


    const path =
      BACKGROUND_ROOT +
      background.file;


    /*
       Only the active companion screen
       receives the selected background.

       main.PNG remains the main-menu
       background handled by style.css.
    */

    gameScreen.style.backgroundImage =
      `url("${path}")`;

    gameScreen.style.backgroundSize =
      "cover";

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

        openBackgroundPicker();

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


    /* --------------------------------------------------------
       BACK
    -------------------------------------------------------- */

    const backIndex =
      backgroundIds.length;


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
        RETURN WITHOUT CHANGING
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

        openMainMenu();

      }
    );


    characterPickerList.appendChild(
      backButton
    );

  }


  /* ==========================================================
     PATCH CHARACTER PICKER TITLE
  ========================================================== */

  /*
     The background selector reuses the existing picker screen.

     Restore its normal title whenever New Companion opens
     the actual character picker.
  */

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
     PATCH MAIN MENU RENDER
  ========================================================== */

  /*
     app.js rebuilds the main menu whenever we return to it.

     Wrap that function so the Background row is automatically
     added again each time.
  */

  const originalRenderMainMenu =
    renderMainMenu;


  renderMainMenu =
    function () {

      originalRenderMainMenu();


      addBackgroundMenuButton();

    };


  /* ==========================================================
     META / KEYBOARD FALLBACK
  ========================================================== */

  /*
     Normally Enter / Space fires the focused button directly.

     This fallback also allows the existing menu activation
     function to understand the Background row.
  */

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
     INITIALIZE
  ========================================================== */

  applyBackground(
    activeBackgroundId,
    false
  );


  /*
     app.js may already have rendered the menu by the time this
     file executes, so add the button once immediately as well.
  */

  if (
    typeof currentScreen !==
      "undefined" &&
    currentScreen ===
      "main"
  ) {

    addBackgroundMenuButton();

  }

})();
