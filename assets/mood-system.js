"use strict";


/* ============================================================
   POCKET FURRY UNIFIED MOOD SYSTEM
============================================================

   Keeps the HUD emoji, main-menu mood text, and character
   animation synchronized from one shared mood calculation.

============================================================ */

(() => {

  function getCompanionMood(
    companionState
  ) {

    if (
      !companionState
    ) {
      return {
        label: "Unknown",
        emoji: "😐",
        animation: "idleFront"
      };
    }


    if (
      !companionState.alive
    ) {
      return {
        label: "Gone",
        emoji: "😵",
        animation: "death"
      };
    }


    if (
      companionState.sleeping
    ) {
      return {
        label: companionState.forcedSleep
          ? "Exhausted"
          : "Resting",

        emoji: "😴",
        animation: "sleep"
      };
    }


    if (
      companionState.forcedSit
    ) {
      return {
        label: "Bored",
        emoji: "😐",
        animation: "bored"
      };
    }


    const now =
      Date.now();


    const lastMealAt =
      Number(
        companionState.lastMealAt
      ) || now;


    const foodAge =
      Math.max(
        0,
        now -
        lastMealAt
      );


    /*
       Match the existing food-state rules:
       - hunger drains to zero over FOOD_DURATION_MS
       - FOOD_DURATION_MS and above is sick
       - SICK_HUNGER_MS and above is critical
    */

    if (
      foodAge >=
        SICK_HUNGER_MS
    ) {
      return {
        label: "Critical",
        emoji: "🤢",
        animation: "sick"
      };
    }


    if (
      foodAge >=
        FOOD_DURATION_MS
    ) {
      return {
        label: "Sick",
        emoji: "🤢",
        animation: "sick"
      };
    }


    if (
      companionState.hunger <
        20
    ) {
      return {
        label: "Hungry",
        emoji: "😟",
        animation: "hungry"
      };
    }


    if (
      companionState.energy <=
        EXHAUSTED_THRESHOLD
    ) {
      return {
        label: "Exhausted",
        emoji: "😫",
        animation: "angry"
      };
    }


    if (
      companionState.recoveryMood ===
        "angry"
    ) {
      return {
        label: "Upset",
        emoji: "😠",
        animation: "angry"
      };
    }


    if (
      companionState.recoveryMood ===
        "sad"
    ) {
      return {
        label: "Sad",
        emoji: "😢",
        animation: "sad"
      };
    }


    if (
      companionState.recoveryMood ===
        "neutral"
    ) {
      return {
        label: "Okay",
        emoji: "😐",
        animation: "idleFront"
      };
    }


    if (
      companionState.happiness >=
        85
    ) {
      return {
        label: "Happy",
        emoji: "🥰",
        animation: "idleFront"
      };
    }


    if (
      companionState.happiness >=
        60
    ) {
      return {
        label: "Content",
        emoji: "😊",
        animation: "idleFront"
      };
    }


    if (
      companionState.happiness >=
        35
    ) {
      return {
        label: "Okay",
        emoji: "😐",
        animation: "idleFront"
      };
    }


    if (
      companionState.happiness >=
        15
    ) {
      return {
        label: "Sad",
        emoji: "😢",
        animation: "sad"
      };
    }


    return {
      label: "Upset",
      emoji: "😠",
      animation: "sad"
    };

  }


  /*
     Expose this so other Pocket Furry modules can use the
     exact same mood interpretation later if needed.
  */

  window.getCompanionMood =
    getCompanionMood;


  /* ==========================================================
     HUD EMOJI
  ========================================================== */

  getMoodEmoji =
    function () {

      return getCompanionMood(
        state
      ).emoji;

    };


  /* ==========================================================
     MAIN MENU
  ========================================================== */

  getStateSummary =
    function (
      slotIndex,
      characterId
    ) {

      const saved =
        loadSlotState(
          slotIndex,
          characterId
        );


      const mood =
        getCompanionMood(
          saved
        );


      if (
        !saved.alive
      ) {
        return (
          `${mood.emoji} ${mood.label}`
        );
      }


      const sleep =
        saved.sleeping
          ? "Asleep"
          : "Awake";


      return (
        `${mood.emoji} ${mood.label} • ${sleep}`
      );

    };


  /* ==========================================================
     CHARACTER MOOD ANIMATION
  ========================================================== */

  updateMoodAnimation =
    function () {

      if (
        !state ||
        currentScreen !==
          "game" ||
        temporaryAnimation ||
        walking
      ) {
        return;
      }


      const mood =
        getCompanionMood(
          state
        );


      if (
        mood.animation ===
          "death"
      ) {
        setAnimation(
          "death"
        );

        return;
      }


      if (
        mood.animation ===
          "sleep"
      ) {
        setAnimation(
          "sleep"
        );

        return;
      }


      setAnimation(
        mood.animation,
        activeDirection
      );

    };


  /*
     If this module loads while a companion is already open,
     immediately refresh the HUD and animation.

     If the main menu is open, rebuild it so the emoji appears
     beside the mood text. companion-management.js will then
     re-add the age row when it loads after this module.
  */

  if (
    currentScreen ===
      "game" &&
    state
  ) {

    updateStatusDisplay();

    updateMoodAnimation();

  } else if (
    currentScreen ===
      "main"
  ) {

    renderMainMenu();

  }

})();
