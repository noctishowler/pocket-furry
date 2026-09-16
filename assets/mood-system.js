"use strict";


/* ============================================================
   POCKET FURRY UNIFIED MOOD SYSTEM
============================================================

   Keeps the HUD emoji, main-menu mood text, character
   animation, and hunger-state interpretation synchronized.

   IMPORTANT:
   Persistent sickness is controlled by state.sick.

   Reaching zero hunger by itself does NOT mean sick.
   economy.js controls when a healthy companion becomes sick
   after the hunger grace period expires.

============================================================ */

(() => {

  /* ==========================================================
     FOOD / SICKNESS STATE
  ========================================================== */

  function getCompanionFoodAge(
    companionState
  ) {

    if (
      !companionState
    ) {

      return 0;

    }


    const now =
      Date.now();


    const lastMealAt =
      Number(
        companionState.lastMealAt
      ) ||
      now;


    return Math.max(
      0,
      now -
      lastMealAt
    );

  }


  function isCompanionHungry(
    companionState
  ) {

    return (
      getCompanionFoodAge(
        companionState
      ) >=
      FOOD_DURATION_MS
    );

  }


  /*
     Shared hunger-stage interpretation.

     NORMAL:
     Companion is not persistently sick.

     SICK:
     Companion has persistent sickness,
     but currently has food remaining.

     CRITICAL:
     Companion is persistently sick AND
     hunger has reached zero.

     A healthy companion at zero hunger
     remains "normal" here because hunger
     itself is represented separately by
     the Hungry mood below.

     This prevents the old app.js logic from
     treating zero hunger as instant sickness.
  */

  function getSharedHungerStage(
    companionState =
      state
  ) {

    if (
      !companionState ||
      !companionState.alive
    ) {

      return "normal";

    }


    if (
      companionState.sick ===
        true
    ) {

      return isCompanionHungry(
        companionState
      )
        ? "critical"
        : "sick";

    }


    return "normal";

  }


  /*
     Replace the older app.js hunger-stage
     interpretation.

     Existing app.js systems that call
     getHungerStage() will now follow the
     persistent state.sick value instead of
     declaring sickness after four hours.
  */

  getHungerStage =
    function () {

      return getSharedHungerStage(
        state
      );

    };


  /* ==========================================================
     MOOD CALCULATION
  ========================================================== */

  function getCompanionMood(
    companionState
  ) {

    if (
      !companionState
    ) {

      return {
        label:
          "Unknown",

        emoji:
          "😐",

        animation:
          "idleFront"
      };

    }


    if (
      !companionState.alive
    ) {

      return {
        label:
          "Gone",

        emoji:
          "😵",

        animation:
          "death"
      };

    }


    if (
      companionState.sleeping
    ) {

      return {
        label:
          companionState.forcedSleep
            ? "Exhausted"
            : "Resting",

        emoji:
          "😴",

        animation:
          "sleep"
      };

    }


    if (
      companionState.forcedSit
    ) {

      return {
        label:
          "Bored",

        emoji:
          "😐",

        animation:
          "bored"
      };

    }


    const hungry =
      isCompanionHungry(
        companionState
      );


    /*
       Persistent sickness always takes
       priority over ordinary hunger.

       Sick + zero hunger is Critical.

       Sick + food remaining is Sick.
    */

    if (
      companionState.sick ===
        true
    ) {

      if (
        hungry
      ) {

        return {
          label:
            "Critical",

          emoji:
            "🤢",

          animation:
            "sick"
        };

      }


      return {
        label:
          "Sick",

        emoji:
          "🤢",

        animation:
          "sick"
      };

    }


    /*
       Zero hunger while otherwise healthy
       means Hungry, not Sick.

       economy.js supplies the 10-hour grace
       period before persistent sickness.
    */

    if (
      hungry ||
      companionState.hunger <
        20
    ) {

      return {
        label:
          "Hungry",

        emoji:
          "😟",

        animation:
          "hungry"
      };

    }


    if (
      companionState.energy <=
        EXHAUSTED_THRESHOLD
    ) {

      return {
        label:
          "Exhausted",

        emoji:
          "😫",

        animation:
          "angry"
      };

    }


    if (
      companionState.recoveryMood ===
        "angry"
    ) {

      return {
        label:
          "Upset",

        emoji:
          "😠",

        animation:
          "angry"
      };

    }


    if (
      companionState.recoveryMood ===
        "sad"
    ) {

      return {
        label:
          "Sad",

        emoji:
          "😢",

        animation:
          "sad"
      };

    }


    if (
      companionState.recoveryMood ===
        "neutral"
    ) {

      return {
        label:
          "Okay",

        emoji:
          "😐",

        animation:
          "idleFront"
      };

    }


    if (
      companionState.happiness >=
        85
    ) {

      return {
        label:
          "Happy",

        emoji:
          "🥰",

        animation:
          "idleFront"
      };

    }


    if (
      companionState.happiness >=
        60
    ) {

      return {
        label:
          "Content",

        emoji:
          "😊",

        animation:
          "idleFront"
      };

    }


    if (
      companionState.happiness >=
        35
    ) {

      return {
        label:
          "Okay",

        emoji:
          "😐",

        animation:
          "idleFront"
      };

    }


    if (
      companionState.happiness >=
        15
    ) {

      return {
        label:
          "Sad",

        emoji:
          "😢",

        animation:
          "sad"
      };

    }


    return {
      label:
        "Upset",

      emoji:
        "😠",

      animation:
        "sad"
    };

  }


  /*
     Expose shared interpretations so other
     Pocket Furry modules can use the same
     state rules later.
  */

  window.getCompanionMood =
    getCompanionMood;


  window.getPocketFurryHungerStage =
    getSharedHungerStage;


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
     If this module loads while a companion
     is already open, immediately refresh the
     HUD and animation.

     If the main menu is open, rebuild it so
     the correct mood appears immediately.
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