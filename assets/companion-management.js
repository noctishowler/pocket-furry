"use strict";


/* ============================================================
   POCKET FURRY COMPANION MANAGEMENT
============================================================

   Adds:
   - Live YY:DD:HH:MM age display on the main menu.
   - Safe companion deletion.
   - Neural Band / keyboard: LEFT on a selected companion.
   - Touch: press and hold a companion row.

============================================================ */

(() => {

  const DELETE_HOLD_MS =
    700;

  const AGE_REFRESH_MS =
    30 * 1000;


  let deleteTargetSlot =
    null;

  let deleteConfirmIndex =
    0;

  let deleteHoldTimer =
    null;

  let deleteHoldTriggered =
    false;

  let suppressNextCompanionClick =
    false;


  /* ==========================================================
     AGE
  ========================================================== */

  function padAgePart(
    value,
    minimumDigits =
      2
  ) {

    return String(
      Math.max(
        0,
        Math.floor(
          value
        )
      )
    ).padStart(
      minimumDigits,
      "0"
    );

  }


  function formatCompanionAge(
    createdAt
  ) {

    const born =
      Number(
        createdAt
      );


    if (
      !Number.isFinite(
        born
      ) ||
      born <=
        0
    ) {

      return "00:00:00:00";

    }


    let totalMinutes =
      Math.max(
        0,
        Math.floor(
          (
            Date.now() -
            born
          ) /
          60000
        )
      );


    const minutesPerDay =
      24 *
      60;


    const minutesPerYear =
      365 *
      minutesPerDay;


    const years =
      Math.floor(
        totalMinutes /
        minutesPerYear
      );


    totalMinutes -=
      years *
      minutesPerYear;


    const days =
      Math.floor(
        totalMinutes /
        minutesPerDay
      );


    totalMinutes -=
      days *
      minutesPerDay;


    const hours =
      Math.floor(
        totalMinutes /
        60
      );


    const minutes =
      totalMinutes -
      hours *
      60;


    return (
      `${padAgePart(years)}:` +
      `${padAgePart(days)}:` +
      `${padAgePart(hours)}:` +
      `${padAgePart(minutes)}`
    );

  }


  function ensureCreatedAt(
    slotIndex
  ) {

    const slot =
      appState.slots[
        slotIndex
      ];


    if (
      !slot
    ) {

      return null;

    }


    if (
      !Number.isFinite(
        Number(
          slot.createdAt
        )
      ) ||
      Number(
        slot.createdAt
      ) <=
        0
    ) {

      slot.createdAt =
        Date.now();


      saveAppState();

    }


    return Number(
      slot.createdAt
    );

  }


  function updateCompanionAges() {

    if (
      currentScreen !==
        "main"
    ) {

      return;

    }


    companionList
      .querySelectorAll(
        ".companion-age"
      )
      .forEach(
        element => {

          const slotIndex =
            Number(
              element.dataset.slotIndex
            );


          const slot =
            appState.slots[
              slotIndex
            ];


          if (
            !slot
          ) {

            return;

          }


          const createdAt =
            ensureCreatedAt(
              slotIndex
            );


          element.textContent =
            `AGE ${formatCompanionAge(
              createdAt
            )}`;

        }
      );

  }


  /* ==========================================================
     DELETE CONFIRMATION SCREEN
  ========================================================== */

  const deleteScreen =
    document.createElement(
      "section"
    );


  deleteScreen.id =
    "deleteCompanionScreen";


  deleteScreen.className =
    "screen menu-screen hidden";


  deleteScreen.innerHTML = `
    <div class="menu-panel">

      <div
        id="deleteCompanionTitle"
        class="menu-title"
      >
        DELETE COMPANION?
      </div>

      <div
        id="deleteCompanionSubtitle"
        class="menu-subtitle"
      >
        THIS CANNOT BE UNDONE
      </div>

      <div
        id="deleteCompanionList"
        class="list-menu"
      >

        <button
          type="button"
          class="list-item focusable selected"
          data-delete-choice="cancel"
          tabindex="-1"
        >
          <span class="list-item-primary">
            CANCEL
          </span>

          <span class="list-item-secondary">
            KEEP THIS COMPANION
          </span>
        </button>

        <button
          type="button"
          class="list-item focusable"
          data-delete-choice="delete"
          tabindex="-1"
        >
          <span class="list-item-primary">
            DELETE
          </span>

          <span class="list-item-secondary">
            REMOVE COMPANION AND SAVE DATA
          </span>
        </button>

      </div>

      <div class="screen-hint">
        ▲ ▼ SELECT • PINCH / TAP CHOOSE
      </div>

    </div>
  `;


  app.appendChild(
    deleteScreen
  );


  const deleteTitle =
    deleteScreen.querySelector(
      "#deleteCompanionTitle"
    );


  const deleteButtons = [
    ...deleteScreen.querySelectorAll(
      ".list-item"
    )
  ];


  function updateDeleteSelection() {

    deleteConfirmIndex =
      (
        deleteConfirmIndex +
        deleteButtons.length
      ) %
      deleteButtons.length;


    deleteButtons.forEach(
      (
        button,
        index
      ) => {

        button.classList.toggle(
          "selected",
          index ===
            deleteConfirmIndex
        );

      }
    );


    focusApp();

  }


  function closeDeleteScreen() {

    deleteTargetSlot =
      null;


    deleteScreen.classList.add(
      "hidden"
    );


    openMainMenu();

  }


  function deleteCompanion(
    slotIndex
  ) {

    const slot =
      appState.slots[
        slotIndex
      ];


    if (
      !slot
    ) {

      closeDeleteScreen();

      return;

    }


    localStorage.removeItem(
      getSlotSaveKey(
        slotIndex,
        slot.characterId
      )
    );


    appState.slots[
      slotIndex
    ] =
      null;


    saveAppState();


    if (
      activeSlotIndex ===
        slotIndex
    ) {

      activeSlotIndex =
        null;

      activeCharacterId =
        null;

      state =
        null;

    }


    deleteTargetSlot =
      null;


    mainMenuIndex =
      0;


    deleteScreen.classList.add(
      "hidden"
    );


    openMainMenu();

  }


  function activateDeleteSelection() {

    const button =
      deleteButtons[
        deleteConfirmIndex
      ];


    if (
      !button
    ) {

      return;

    }


    if (
      button.dataset.deleteChoice ===
        "delete"
    ) {

      deleteCompanion(
        deleteTargetSlot
      );

      return;

    }


    closeDeleteScreen();

  }


  function openDeleteScreen(
    slotIndex
  ) {

    const slot =
      appState.slots[
        slotIndex
      ];


    if (
      !slot
    ) {

      return;

    }


    const character =
      characters[
        slot.characterId
      ];


    deleteTargetSlot =
      slotIndex;


    deleteConfirmIndex =
      0;


    deleteTitle.textContent =
      character
        ? `DELETE ${character.name.toUpperCase()}?`
        : "DELETE COMPANION?";


    mainMenuScreen.classList.add(
      "hidden"
    );


    pickerScreen.classList.add(
      "hidden"
    );


    gameScreen.classList.add(
      "hidden"
    );


    deleteScreen.classList.remove(
      "hidden"
    );


    currentScreen =
      "deleteConfirm";


    updateDeleteSelection();

  }


  deleteButtons.forEach(
    (
      button,
      index
    ) => {

      button.addEventListener(
        "click",
        () => {

          deleteConfirmIndex =
            index;


          activateDeleteSelection();

        }
      );

    }
  );


  /* ==========================================================
     MAIN MENU DECORATION
  ========================================================== */

  function attachDeleteHold(
    button
  ) {

    const slotIndex =
      Number(
        button.dataset.slotIndex
      );


    button.addEventListener(
      "pointerdown",
      () => {

        deleteHoldTriggered =
          false;


        clearTimeout(
          deleteHoldTimer
        );


        deleteHoldTimer =
          setTimeout(
            () => {

              deleteHoldTriggered =
                true;


              suppressNextCompanionClick =
                true;


              openDeleteScreen(
                slotIndex
              );

            },
            DELETE_HOLD_MS
          );

      }
    );


    const cancelHold =
      () => {

        clearTimeout(
          deleteHoldTimer
        );


        deleteHoldTimer =
          null;

      };


    button.addEventListener(
      "pointerup",
      cancelHold
    );


    button.addEventListener(
      "pointercancel",
      cancelHold
    );


    button.addEventListener(
      "pointerleave",
      cancelHold
    );

  }


  function decorateCompanionRows() {

    companionList
      .querySelectorAll(
        ".companion-entry"
      )
      .forEach(
        button => {

          if (
            button.dataset.managementReady ===
              "true"
          ) {

            return;

          }


          button.dataset.managementReady =
            "true";


          const slotIndex =
            Number(
              button.dataset.slotIndex
            );


          const createdAt =
            ensureCreatedAt(
              slotIndex
            );


          const age =
            document.createElement(
              "span"
            );


          age.className =
            "list-item-secondary companion-age";


          age.dataset.slotIndex =
            String(
              slotIndex
            );


          age.textContent =
            `AGE ${formatCompanionAge(
              createdAt
            )}`;


          button.appendChild(
            age
          );


          attachDeleteHold(
            button
          );

        }
      );


    const hint =
      mainMenuScreen.querySelector(
        ".screen-hint"
      );


    if (
      hint
    ) {

      hint.textContent =
        "▲ ▼ SELECT • PINCH / TAP OPEN • ◀ DELETE";

    }

  }


  /*
     Capture the click generated after a
     successful long press before the
     original companion click handler can
     open the character.
  */

  document.addEventListener(
    "click",
    event => {

      if (
        !suppressNextCompanionClick
      ) {

        return;

      }


      const companion =
        event.target.closest(
          ".companion-entry"
        );


      if (
        !companion
      ) {

        return;

      }


      suppressNextCompanionClick =
        false;


      event.preventDefault();

      event.stopImmediatePropagation();

    },
    true
  );


  /* ==========================================================
     PATCH MAIN MENU RENDER
  ========================================================== */

  const originalRenderMainMenu =
    renderMainMenu;


  renderMainMenu =
    function () {

      originalRenderMainMenu();


      decorateCompanionRows();


      updateCompanionAges();

  };


  /*
     The menu may already be visible by
     the time this module loads.
  */

  if (
    currentScreen ===
      "main"
  ) {

    renderMainMenu();

  }


  /* ==========================================================
     NEURAL BAND / KEYBOARD
  ========================================================== */

  window.addEventListener(
    "keydown",
    event => {

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


      if (
        currentScreen ===
          "main" &&
        input ===
          "left"
      ) {

        const buttons =
          getMainMenuButtons();


        const button =
          buttons[
            mainMenuIndex
          ];


        if (
          button &&
          button.dataset.kind ===
            "companion"
        ) {

          event.preventDefault();

          event.stopPropagation();


          openDeleteScreen(
            Number(
              button.dataset.slotIndex
            )
          );

        }


        return;

      }


      if (
        currentScreen !==
          "deleteConfirm"
      ) {

        return;

      }


      event.preventDefault();

      event.stopPropagation();


      if (
        input ===
          "up"
      ) {

        deleteConfirmIndex -=
          1;


        updateDeleteSelection();


      } else if (
        input ===
          "down"
      ) {

        deleteConfirmIndex +=
          1;


        updateDeleteSelection();


      } else if (
        input ===
          "activate"
      ) {

        activateDeleteSelection();


      } else if (
        input ===
          "left" ||
        input ===
          "right"
      ) {

        closeDeleteScreen();

      }

    },
    true
  );


  /* ==========================================================
     AGE REFRESH
  ========================================================== */

  setInterval(
    updateCompanionAges,
    AGE_REFRESH_MS
  );

})();
