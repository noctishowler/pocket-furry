"use strict";


/* ============================================================
   POCKET FURRY AMBIENT EVENTS
============================================================

   Adds the seven new GIFs as rare ambient behavior without
   changing the core gameplay file.

   Special staging:
   - Fishing only happens on the right side.
   - Office worker enters from the left and exits to the right.
   - Motorcycle disaster enters from the left.

============================================================ */

(() => {

  const SPECIAL_EVENT_CHANCE =
    0.04;

  const SPECIAL_EVENT_COOLDOWN_MS =
    60 * 1000;


  const PHONE_DURATION_MS =
    4200;

  const SUNGLASSES_DURATION_MS =
    3600;

  const FISHING_DURATION_MS =
    6200;

  const MOTORCYCLE_DURATION_MS =
    5200;

  const OFFICE_ENTER_MS =
    2300;

  const OFFICE_IDLE_MS =
    5200;

  const OFFICE_EXIT_MS =
    2300;


  const specialEvents = [
    "phoneDistraction",
    "sunglassesEntrance",
    "fishingFail",
    "motorcycleDisaster",
    "officeWorker"
  ];


  let lastSpecialEventAt =
    0;

  let specialEventActive =
    false;

  let specialEventToken =
    0;

  let specialTimers =
    [];


  /* ==========================================================
     UTILITIES
  ========================================================== */

  function clearSpecialTimers() {

    specialTimers.forEach(
      timer => {
        clearTimeout(
          timer
        );
      }
    );


    specialTimers =
      [];

  }


  function addSpecialTimer(
    callback,
    delay
  ) {

    const token =
      specialEventToken;


    const timer =
      setTimeout(
        () => {

          if (
            token !==
              specialEventToken
          ) {
            return;
          }


          callback();

        },
        delay
      );


    specialTimers.push(
      timer
    );


    return timer;
  }


  function canPlaySpecialEvent() {

    return (
      currentScreen ===
        "game" &&

      state &&

      state.alive &&

      !state.sleeping &&

      !state.forcedSit &&

      !walking &&

      !temporaryAnimation &&

      !interactionMode &&

      !statusCardVisible &&

      (
        Date.now() -
        lastSpecialEventAt
      ) >=
        SPECIAL_EVENT_COOLDOWN_MS
    );

  }


  function getStageMeasurements() {

    const stageWidth =
      petStage.clientWidth;


    const characterWidth =
      Math.max(
        characterMover.offsetWidth,
        characterSprite.offsetWidth,
        1
      );


    const limits =
      getHorizontalLimits();


    return {
      stageWidth,
      characterWidth,
      limits,

      offLeft:
        -(
          stageWidth / 2 +
          characterWidth
        ),

      offRight:
        stageWidth / 2 +
        characterWidth
    };

  }


  function setMoverPosition(
    x,
    duration =
      0
  ) {

    characterMover.style.transition =
      duration >
        0
        ? `left ${duration}ms linear`
        : "none";


    characterMover.style.left =
      `calc(50% + ${x}px)`;


    currentX =
      x;

  }


  function finishSpecialEvent(
    visibleX =
      currentX
  ) {

    clearSpecialTimers();


    specialEventActive =
      false;


    temporaryAnimation =
      false;


    const limits =
      getHorizontalLimits();


    const safeX =
      Math.max(
        limits.min,
        Math.min(
          limits.max,
          visibleX
        )
      );


    setMoverPosition(
      safeX,
      0
    );


    updateMoodAnimation();


    if (
      currentScreen ===
        "game" &&
      state &&
      state.alive &&
      !state.sleeping &&
      !state.forcedSit &&
      !interactionMode &&
      !statusCardVisible
    ) {

      resumeAmbient(
        1400
      );

    }

  }


  function cancelSpecialEvent() {

    if (
      !specialEventActive
    ) {
      return;
    }


    specialEventToken +=
      1;


    clearSpecialTimers();


    specialEventActive =
      false;


    temporaryAnimation =
      false;


    characterMover.style.transition =
      "none";

  }


  function startSpecialEvent() {

    if (
      !canPlaySpecialEvent()
    ) {
      return false;
    }


    specialEventToken +=
      1;


    specialEventActive =
      true;


    temporaryAnimation =
      true;


    lastSpecialEventAt =
      Date.now();


    pauseAmbient();

    stopWalking();


    const eventName =
      specialEvents[
        Math.floor(
          Math.random() *
          specialEvents.length
        )
      ];


    switch (
      eventName
    ) {

      case "fishingFail":

        playFishingFail();

        break;


      case "motorcycleDisaster":

        playMotorcycleDisaster();

        break;


      case "officeWorker":

        playOfficeWorker();

        break;


      case "phoneDistraction":

        playStationarySpecial(
          "phoneDistraction",
          PHONE_DURATION_MS
        );

        break;


      case "sunglassesEntrance":

        playStationarySpecial(
          "sunglassesEntrance",
          SUNGLASSES_DURATION_MS
        );

        break;
    }


    return true;

  }


  /* ==========================================================
     STATIONARY EVENTS
  ========================================================== */

  function playStationarySpecial(
    animationName,
    duration
  ) {

    setAnimation(
      animationName,
      activeDirection,
      true
    );


    addSpecialTimer(
      () => {

        finishSpecialEvent(
          currentX
        );

      },
      duration
    );

  }


  /* ==========================================================
     FISHING

     Fishing is always staged on the right side of the screen.
  ========================================================== */

  function playFishingFail() {

    const {
      limits
    } =
      getStageMeasurements();


    const rightSide =
      limits.max *
      0.82;


    activeDirection =
      "right";


    setMoverPosition(
      rightSide,
      0
    );


    setAnimation(
      "fishingFail",
      "right",
      true
    );


    addSpecialTimer(
      () => {

        finishSpecialEvent(
          rightSide
        );

      },
      FISHING_DURATION_MS
    );

  }


  /* ==========================================================
     MOTORCYCLE

     Enters from beyond the left edge and moves into the scene.
  ========================================================== */

  function playMotorcycleDisaster() {

    const {
      offLeft,
      limits
    } =
      getStageMeasurements();


    const destination =
      limits.max *
      0.35;


    activeDirection =
      "right";


    setMoverPosition(
      offLeft,
      0
    );


    setAnimation(
      "motorcycleDisaster",
      "right",
      true
    );


    requestAnimationFrame(
      () => {

        setMoverPosition(
          destination,
          MOTORCYCLE_DURATION_MS
        );

      }
    );


    addSpecialTimer(
      () => {

        finishSpecialEvent(
          destination
        );

      },
      MOTORCYCLE_DURATION_MS
    );

  }


  /* ==========================================================
     OFFICE WORKER

     1. Enters from the left.
     2. Works at the desk.
     3. Exits off the right side.
  ========================================================== */

  function playOfficeWorker() {

    const {
      offLeft,
      offRight,
      limits
    } =
      getStageMeasurements();


    const deskPosition =
      0;


    activeDirection =
      "right";


    setMoverPosition(
      offLeft,
      0
    );


    setAnimation(
      "officeWorkerEnter",
      "right",
      true
    );


    requestAnimationFrame(
      () => {

        setMoverPosition(
          deskPosition,
          OFFICE_ENTER_MS
        );

      }
    );


    addSpecialTimer(
      () => {

        characterMover.style.transition =
          "none";


        currentX =
          deskPosition;


        setAnimation(
          "officeWorker",
          "right",
          true
        );

      },
      OFFICE_ENTER_MS
    );


    addSpecialTimer(
      () => {

        setAnimation(
          "officeWorkerExit",
          "right",
          true
        );


        setMoverPosition(
          offRight,
          OFFICE_EXIT_MS
        );

      },
      OFFICE_ENTER_MS +
      OFFICE_IDLE_MS
    );


    addSpecialTimer(
      () => {

        /*
           The office bit has completely
           exited the scene. Resume normal
           life at the visible right edge.
        */

        finishSpecialEvent(
          limits.max *
          0.82
        );

      },
      OFFICE_ENTER_MS +
      OFFICE_IDLE_MS +
      OFFICE_EXIT_MS
    );

  }


  /* ==========================================================
     AMBIENT HOOK

     Existing roaming/rest behavior remains the default. A
     special event occasionally replaces one normal rest period.
  ========================================================== */

  const originalBeginRestPeriod =
    beginRestPeriod;


  beginRestPeriod =
    function () {

      if (
        canPlaySpecialEvent() &&
        Math.random() <
          SPECIAL_EVENT_CHANCE
      ) {

        if (
          startSpecialEvent()
        ) {
          return;
        }

      }


      originalBeginRestPeriod();

    };


  /* ==========================================================
     INTERRUPT SPECIAL EVENTS CLEANLY
  ========================================================== */

  const originalOpenMainMenu =
    openMainMenu;


  openMainMenu =
    function () {

      cancelSpecialEvent();


      return originalOpenMainMenu();

    };


  const originalOpenCompanion =
    openCompanion;


  openCompanion =
    function (
      slotIndex
    ) {

      cancelSpecialEvent();


      return originalOpenCompanion(
        slotIndex
      );

    };


  const originalOpenInteractionTray =
    openInteractionTray;


  openInteractionTray =
    function () {

      cancelSpecialEvent();


      return originalOpenInteractionTray();

    };


  const originalShowStatusCard =
    showStatusCard;


  showStatusCard =
    function () {

      cancelSpecialEvent();


      return originalShowStatusCard();

    };

})();
