"use strict";


/* ============================================================
   POCKET FURRY ECONOMY / WORK / HEALTH SYSTEM
============================================================ */

(() => {

  const STARTING_COINS =
    32;


  const FOOD_COST =
    1;


  const FOOD_HUNGER_RESTORE =
    25;


  const MEDICINE_COST =
    100;


  const MEDICINE_HEAL =
    25;


  /*
     Hunger reaches zero after the core
     FOOD_DURATION_MS period.

     The companion must then remain at zero
     hunger for another 10 hours before
     becoming sick.
  */

  const HUNGRY_BEFORE_SICK_MS =
    10 *
    60 *
    60 *
    1000;


  const SICKNESS_THRESHOLD_MS =
    FOOD_DURATION_MS +
    HUNGRY_BEFORE_SICK_MS;


  /* ==========================================================
     ENERGY BALANCE

     Normal awake energy:
     100 → 0 over 18 hours.

     Sleeping:
     0 → 100 over 8 hours.

     This allows a normal daily schedule without
     passive energy loss exhausting the companion
     before bedtime.
  ========================================================== */

  const BASE_ENERGY_DRAIN_PER_MINUTE =
    100 /
    (
      18 *
      60
    );


  const SLEEP_ENERGY_RECOVERY_PER_MINUTE =
    100 /
    (
      8 *
      60
    );


  /*
     Work has an additional energy cost.

     A full 8-hour shift consumes 10 extra
     energy on top of normal awake drain.
  */

  const WORK_EXTRA_ENERGY_DRAIN_PER_HOUR =
    10 /
    8;


  /*
     Natural healing is deliberately slow.

     With all needs met and no sickness,
     0 → 100 health takes seven days.
  */

  const NATURAL_HEALTH_RECOVERY_PER_MINUTE =
    100 /
    (
      7 *
      24 *
      60
    );


  /* ==========================================================
     WORK BALANCE
  ========================================================== */

  const WORK_PAY_INTERVAL_MS =
    15 *
    60 *
    1000;


  const WORK_PAY_PER_INTERVAL =
    1;


  const WORK_SHIFT_MAX_MS =
    8 *
    60 *
    60 *
    1000;


  const WORK_HAPPINESS_DRAIN_PER_HOUR =
    8;


  /*
     At 25 energy or below, switch from
     office-worker-idle.gif to the tired
     office-worker.gif.
  */

  const WORK_TIRED_ENERGY =
    25;


  const WORK_ENTER_MS =
    2300;


  const WORK_EXIT_MS =
    2300;


  let workVisualTimer =
    null;


  /* ==========================================================
     STATE DEFAULTS / MIGRATION
  ========================================================== */

  function addEconomyDefaults(
    companionState
  ) {

    const now =
      Date.now();


    return {
      ...companionState,


      coins:
        Number.isFinite(
          Number(
            companionState.coins
          )
        )
          ? Math.max(
              0,
              Math.floor(
                Number(
                  companionState.coins
                )
              )
            )
          : STARTING_COINS,


      sick:
        companionState.sick ===
          true,


      working:
        companionState.working ===
          true,


      workStartedAt:
        Number.isFinite(
          Number(
            companionState.workStartedAt
          )
        )
          ? Number(
              companionState.workStartedAt
            )
          : null,


      workPaidThroughAt:
        Number.isFinite(
          Number(
            companionState.workPaidThroughAt
          )
        )
          ? Number(
              companionState.workPaidThroughAt
            )
          : null,


      workHappinessUpdatedAt:
        Number.isFinite(
          Number(
            companionState.workHappinessUpdatedAt
          )
        )
          ? Number(
              companionState.workHappinessUpdatedAt
            )
          : null,


      workEnergyUpdatedAt:
        Number.isFinite(
          Number(
            companionState.workEnergyUpdatedAt
          )
        )
          ? Number(
              companionState.workEnergyUpdatedAt
            )
          : null,


      workStartEnergy:
        Number.isFinite(
          Number(
            companionState.workStartEnergy
          )
        )
          ? clamp(
              Number(
                companionState.workStartEnergy
              )
            )
          : null,


      lastWorkEndedAt:
        Number.isFinite(
          Number(
            companionState.lastWorkEndedAt
          )
        )
          ? Number(
              companionState.lastWorkEndedAt
            )
          : null,


      lastWorkCoinsEarned:
        Number.isFinite(
          Number(
            companionState.lastWorkCoinsEarned
          )
        )
          ? Math.max(
              0,
              Math.floor(
                Number(
                  companionState.lastWorkCoinsEarned
                )
              )
            )
          : 0,


      lastWorkUpdate:
        Number.isFinite(
          Number(
            companionState.lastWorkUpdate
          )
        )
          ? Number(
              companionState.lastWorkUpdate
            )
          : now
    };

  }


  const originalCreateDefaultState =
    createDefaultState;


  createDefaultState =
    function () {

      return addEconomyDefaults(
        originalCreateDefaultState()
      );

    };


  /* ==========================================================
     HUNGER / SICKNESS HELPERS
  ========================================================== */

  function getCompanionFoodAge(
    companionState =
      state
  ) {

    if (
      !companionState
    ) {

      return 0;

    }


    const lastMealAt =
      Number(
        companionState.lastMealAt
      ) ||
      Date.now();


    return Math.max(
      0,
      Date.now() -
      lastMealAt
    );

  }


  function isPastSicknessThreshold(
    companionState =
      state
  ) {

    return (
      getCompanionFoodAge(
        companionState
      ) >=
      SICKNESS_THRESHOLD_MS
    );

  }


  /* ==========================================================
     PERSISTENT SICKNESS
  ========================================================== */

  function syncPersistentSickness(
    companionState =
      state
  ) {

    if (
      !companionState ||
      !companionState.alive
    ) {

      return;

    }


    /*
       Hunger reaches zero after
       FOOD_DURATION_MS.

       The companion then gets a full
       10-hour hungry grace period.

       Only after that grace period expires
       does persistent sickness begin.

       Feeding restores hunger but does not
       cure sickness once sickness exists.
    */

    if (
      isPastSicknessThreshold(
        companionState
      )
    ) {

      companionState.sick =
        true;

    }

  }


  /* ==========================================================
     HEALTH
  ========================================================== */

  updateHealthFromClock =
    function (
      minutes
    ) {

      if (
        !state ||
        !state.alive
      ) {

        return;

      }


      syncPersistentSickness(
        state
      );


      /*
         Simply reaching zero hunger does
         NOT cause health damage.

         Health damage begins only after the
         companion has remained hungry for
         the full 10-hour grace period.
      */

      if (
        isPastSicknessThreshold(
          state
        )
      ) {

        state.health =
          clamp(
            state.health -
            HEALTH_DRAIN_PER_MINUTE *
            minutes
          );

      } else if (
        !state.sick &&
        areHealthNeedsMet()
      ) {

        /*
           Sick companions cannot naturally
           regenerate health.

           Medicine must cure sickness first.
        */

        state.health =
          clamp(
            state.health +
            NATURAL_HEALTH_RECOVERY_PER_MINUTE *
            minutes
          );

      }


      if (
        state.health <=
          0
      ) {

        killCharacter();

      }

    };


  /* ==========================================================
     WORK DURATION
  ========================================================== */

  function getMaximumWorkDurationMs(
    companionState
  ) {

    const startEnergy =
      Number.isFinite(
        Number(
          companionState.workStartEnergy
        )
      )
        ? clamp(
            Number(
              companionState.workStartEnergy
            )
          )
        : clamp(
            Number(
              companionState.energy
            )
          );


    /*
       While working, both normal awake drain
       and the additional work drain apply.
    */

    const totalWorkDrainPerMinute =
      BASE_ENERGY_DRAIN_PER_MINUTE +
      (
        WORK_EXTRA_ENERGY_DRAIN_PER_HOUR /
        60
      );


    const minutesUntilEmpty =
      totalWorkDrainPerMinute >
        0
        ? startEnergy /
          totalWorkDrainPerMinute
        : Number.POSITIVE_INFINITY;


    return Math.min(
      WORK_SHIFT_MAX_MS,
      Math.max(
        0,
        minutesUntilEmpty *
        60 *
        1000
      )
    );

  }


  /* ==========================================================
     WORK RECONCILIATION
  ========================================================== */

  function reconcileWorkState(
    companionState,
    now =
      Date.now()
  ) {

    companionState =
      addEconomyDefaults(
        companionState
      );


    syncPersistentSickness(
      companionState
    );


    if (
      !companionState.working ||
      !companionState.workStartedAt
    ) {

      return {
        state:
          companionState,

        coinsEarned:
          0,

        ended:
          false
      };

    }


    const startedAt =
      Number(
        companionState.workStartedAt
      );


    const maxDuration =
      getMaximumWorkDurationMs(
        companionState
      );


    const scheduledEnd =
      startedAt +
      maxDuration;


    /*
       Work-specific effects only count until
       the scheduled end of the shift.
    */

    const effectiveNow =
      Math.min(
        now,
        scheduledEnd
      );


    let coinsEarned =
      0;


    /* --------------------------------------------------------
       PAY
    -------------------------------------------------------- */

    const paidThrough =
      Math.max(
        startedAt,
        Number(
          companionState.workPaidThroughAt
        ) ||
        startedAt
      );


    if (
      effectiveNow >
        paidThrough
    ) {

      const completedIntervals =
        Math.floor(
          (
            effectiveNow -
            paidThrough
          ) /
          WORK_PAY_INTERVAL_MS
        );


      if (
        completedIntervals >
          0
      ) {

        coinsEarned =
          completedIntervals *
          WORK_PAY_PER_INTERVAL;


        companionState.coins +=
          coinsEarned;


        companionState.workPaidThroughAt =
          paidThrough +
          completedIntervals *
          WORK_PAY_INTERVAL_MS;

      }

    }


    /* --------------------------------------------------------
       EXTRA WORK ENERGY DRAIN
    -------------------------------------------------------- */

    const energyUpdatedAt =
      Math.max(
        startedAt,
        Number(
          companionState.workEnergyUpdatedAt
        ) ||
        startedAt
      );


    if (
      effectiveNow >
        energyUpdatedAt
    ) {

      const hoursWorkedForEnergy =
        (
          effectiveNow -
          energyUpdatedAt
        ) /
        (
          60 *
          60 *
          1000
        );


      companionState.energy =
        clamp(
          companionState.energy -
          WORK_EXTRA_ENERGY_DRAIN_PER_HOUR *
          hoursWorkedForEnergy
        );


      companionState.workEnergyUpdatedAt =
        effectiveNow;

    }


    /* --------------------------------------------------------
       WORK HAPPINESS DRAIN
    -------------------------------------------------------- */

    const happinessUpdatedAt =
      Math.max(
        startedAt,
        Number(
          companionState.workHappinessUpdatedAt
        ) ||
        startedAt
      );


    if (
      effectiveNow >
        happinessUpdatedAt
    ) {

      const hoursWorked =
        (
          effectiveNow -
          happinessUpdatedAt
        ) /
        (
          60 *
          60 *
          1000
        );


      companionState.happiness =
        clamp(
          companionState.happiness -
          WORK_HAPPINESS_DRAIN_PER_HOUR *
          hoursWorked
        );


      companionState.workHappinessUpdatedAt =
        effectiveNow;

    }


    companionState.lastWorkUpdate =
      now;


    const ended =
      now >=
        scheduledEnd ||
      !companionState.alive;


    if (
      ended
    ) {

      companionState.working =
        false;


      companionState.lastWorkEndedAt =
        scheduledEnd;


      companionState.lastWorkCoinsEarned =
        Math.max(
          0,
          Math.floor(
            (
              effectiveNow -
              startedAt
            ) /
            WORK_PAY_INTERVAL_MS
          ) *
          WORK_PAY_PER_INTERVAL
        );


      companionState.workStartedAt =
        null;


      companionState.workPaidThroughAt =
        null;


      companionState.workHappinessUpdatedAt =
        null;


      companionState.workEnergyUpdatedAt =
        null;


      companionState.workStartEnergy =
        null;

    }


    return {
      state:
        companionState,

      coinsEarned,

      ended
    };

  }


  /* ==========================================================
     SAVE / LOAD
  ========================================================== */

  function saveSlotEconomyState(
    slotIndex,
    characterId,
    companionState
  ) {

    localStorage.setItem(
      getSlotSaveKey(
        slotIndex,
        characterId
      ),
      JSON.stringify(
        companionState
      )
    );

  }


  const originalLoadSlotState =
    loadSlotState;


  loadSlotState =
    function (
      slotIndex,
      characterId
    ) {

      let loaded =
        addEconomyDefaults(
          originalLoadSlotState(
            slotIndex,
            characterId
          )
        );


      syncPersistentSickness(
        loaded
      );


      const result =
        reconcileWorkState(
          loaded
        );


      loaded =
        result.state;


      saveSlotEconomyState(
        slotIndex,
        characterId,
        loaded
      );


      return loaded;

    };


  /* ==========================================================
     COIN DISPLAY
  ========================================================== */

  const coinHud =
    document.createElement(
      "div"
    );


  coinHud.id =
    "coinHud";


  coinHud.className =
    "mini-stat coin-stat";


  coinHud.innerHTML = `
    <span
      class="mini-icon coin-icon"
    >
      ¢
    </span>

    <span
      id="coinValue"
      class="coin-value"
    >
      0
    </span>
  `;


  statusHud.appendChild(
    coinHud
  );


  const coinValue =
    coinHud.querySelector(
      "#coinValue"
    );


  const coinDetail =
    document.createElement(
      "div"
    );


  coinDetail.className =
    "detail-stat economy-detail";


  coinDetail.innerHTML = `
    <span>
      COINS
    </span>

    <span
      id="detailCoins"
    >
      0
    </span>
  `;


  statusCard.appendChild(
    coinDetail
  );


  const detailCoins =
    coinDetail.querySelector(
      "#detailCoins"
    );


  function updateCoinDisplay() {

    if (
      !state
    ) {

      coinValue.textContent =
        "0";


      detailCoins.textContent =
        "0";


      return;

    }


    coinValue.textContent =
      String(
        Math.max(
          0,
          Math.floor(
            Number(
              state.coins
            ) ||
            0
          )
        )
      );


    detailCoins.textContent =
      coinValue.textContent;


    if (
      workButton
    ) {

      const label =
        workButton.querySelector(
          ".action-label"
        );


      if (
        label
      ) {

        label.textContent =
          state.working
            ? "STOP"
            : "WORK";

      }

    }

  }


  /* ==========================================================
     SICKNESS MOOD / ANIMATION
  ========================================================== */

  const previousGetMoodEmoji =
    getMoodEmoji;


  getMoodEmoji =
    function () {

      if (
        state &&
        state.sick
      ) {

        return "🤢";

      }


      return previousGetMoodEmoji();

    };


  const previousUpdateMoodAnimation =
    updateMoodAnimation;


  updateMoodAnimation =
    function () {

      if (
        state &&
        state.sick &&
        !state.working &&
        state.alive &&
        !state.sleeping &&
        !temporaryAnimation &&
        !walking
      ) {

        setAnimation(
          "sick",
          activeDirection
        );


        return;

      }


      previousUpdateMoodAnimation();

    };


  /* ==========================================================
     WORK ANIMATION STATE
  ========================================================== */

  function getWorkAnimation() {

    if (
      state &&
      state.energy <=
        WORK_TIRED_ENERGY
    ) {

      return "officeWorker";

    }


    return "officeWorkerIdle";

  }


  function updateWorkAnimation() {

    if (
      !state ||
      !state.working ||
      currentScreen !==
        "game"
    ) {

      return;

    }


    setAnimation(
      getWorkAnimation(),
      "right"
    );

  }


  const originalUpdateStatusDisplay =
    updateStatusDisplay;


  updateStatusDisplay =
    function () {

      originalUpdateStatusDisplay();


      updateCoinDisplay();


      if (
        state &&
        state.working
      ) {

        moodEmoji.textContent =
          "💼";


        updateWorkAnimation();

      } else if (
        state &&
        state.sick
      ) {

        moodEmoji.textContent =
          "🤢";

      }

    };


  /* ==========================================================
     MAIN MENU STATUS
  ========================================================== */

  const originalGetStateSummary =
    getStateSummary;


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


      if (
        saved.working
      ) {

        return (
          `💼 Working • ¢${Math.floor(
            saved.coins
          )}`
        );

      }


      if (
        saved.sick &&
        saved.alive
      ) {

        const sleep =
          saved.sleeping
            ? "Asleep"
            : "Awake";


        return (
          `🤢 Sick • ${sleep} • ¢${Math.floor(
            saved.coins
          )}`
        );

      }


      return (
        `${originalGetStateSummary(
          slotIndex,
          characterId
        )} • ¢${Math.floor(
          saved.coins
        )}`
      );

    };


  /* ==========================================================
     WORK BUTTON
  ========================================================== */

  const workButton =
    document.createElement(
      "button"
    );


  workButton.type =
    "button";


  workButton.className =
    "action focusable";


  workButton.dataset.action =
    "work";


  workButton.tabIndex =
    -1;


  workButton.innerHTML = `
    <span
      class="action-icon"
    >
      ¢
    </span>

    <span
      class="action-label"
    >
      WORK
    </span>
  `;


  actionTray.appendChild(
    workButton
  );


  if (
    !actions.includes(
      "work"
    )
  ) {

    actions.push(
      "work"
    );

  }


  if (
    !actionButtons.includes(
      workButton
    )
  ) {

    actionButtons.push(
      workButton
    );

  }


  workButton.addEventListener(
    "focus",
    () => {

      if (
        interactionMode
      ) {

        selectAction(
          actionButtons.indexOf(
            workButton
          ),
          false
        );

      }

    }
  );


  workButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      if (
        !interactionMode
      ) {

        return;

      }


      const index =
        actionButtons.indexOf(
          workButton
        );


      selectAction(
        index,
        false
      );


      performAction(
        "work"
      );

    }
  );


  /* ==========================================================
     WORK VISUALS
  ========================================================== */

  function clearWorkVisualTimer() {

    clearTimeout(
      workVisualTimer
    );


    workVisualTimer =
      null;

  }


  function getOffscreenLeft() {

    return -(
      petStage.clientWidth /
        2 +
      Math.max(
        characterMover.offsetWidth,
        characterSprite.offsetWidth,
        1
      )
    );

  }


  function getOffscreenRight() {

    return (
      petStage.clientWidth /
        2 +
      Math.max(
        characterMover.offsetWidth,
        characterSprite.offsetWidth,
        1
      )
    );

  }


  function setWorkMoverPosition(
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


  function showWorkingVisual(
    playEntrance =
      false
  ) {

    if (
      !state ||
      !state.working ||
      currentScreen !==
        "game"
    ) {

      return;

    }


    clearWorkVisualTimer();


    pauseAmbient();


    stopWalking();


    temporaryAnimation =
      true;


    activeDirection =
      "right";


    if (
      playEntrance
    ) {

      const offLeft =
        getOffscreenLeft();


      setWorkMoverPosition(
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

          setWorkMoverPosition(
            0,
            WORK_ENTER_MS
          );

        }
      );


      workVisualTimer =
        setTimeout(
          () => {

            if (
              !state ||
              !state.working ||
              currentScreen !==
                "game"
            ) {

              return;

            }


            setWorkMoverPosition(
              0,
              0
            );


            updateWorkAnimation();

          },
          WORK_ENTER_MS
        );


      return;

    }


    setWorkMoverPosition(
      0,
      0
    );


    updateWorkAnimation();

  }


  function playWorkExit() {

    clearWorkVisualTimer();


    if (
      currentScreen !==
        "game"
    ) {

      temporaryAnimation =
        false;


      return;

    }


    temporaryAnimation =
      true;


    activeDirection =
      "right";


    setAnimation(
      "officeWorkerExit",
      "right",
      true
    );


    setWorkMoverPosition(
      getOffscreenRight(),
      WORK_EXIT_MS
    );


    workVisualTimer =
      setTimeout(
        () => {

          temporaryAnimation =
            false;


          setWorkMoverPosition(
            0,
            0
          );


          updateMoodAnimation();


          if (
            state &&
            state.alive &&
            !state.sleeping &&
            !state.forcedSit
          ) {

            resumeAmbient(
              1000
            );

          }

        },
        WORK_EXIT_MS
      );

  }


  /* ==========================================================
     START / STOP WORK
  ========================================================== */

  function startWork() {

    if (
      !state ||
      !state.alive
    ) {

      return;

    }


    if (
      state.sleeping
    ) {

      showMessage(
        "Asleep."
      );


      return;

    }


    if (
      state.forcedSit
    ) {

      showMessage(
        "Still sitting."
      );


      return;

    }


    if (
      state.energy <=
        EXHAUSTED_THRESHOLD
    ) {

      showMessage(
        "Too tired to work."
      );


      return;

    }


    const now =
      Date.now();


    state.working =
      true;


    state.workStartedAt =
      now;


    state.workPaidThroughAt =
      now;


    state.workHappinessUpdatedAt =
      now;


    state.workEnergyUpdatedAt =
      now;


    state.workStartEnergy =
      state.energy;


    state.lastWorkCoinsEarned =
      0;


    state.lastInteraction =
      now;


    saveState();


    closeInteractionTray(
      false
    );


    showWorkingVisual(
      true
    );


    updateStatusDisplay();


    showMessage(
      "Working"
    );

  }


  function stopWork(
    manual =
      true
  ) {

    if (
      !state ||
      !state.working
    ) {

      return;

    }


    const shiftStartedAt =
      Number(
        state.workStartedAt
      ) ||
      Date.now();


    const result =
      reconcileWorkState(
        state
      );


    state =
      result.state;


    const endedAt =
      Date.now();


    state.working =
      false;


    state.lastWorkEndedAt =
      endedAt;


    state.lastWorkCoinsEarned =
      Math.max(
        0,
        Math.floor(
          (
            Math.min(
              endedAt,
              shiftStartedAt +
              WORK_SHIFT_MAX_MS
            ) -
            shiftStartedAt
          ) /
          WORK_PAY_INTERVAL_MS
        ) *
        WORK_PAY_PER_INTERVAL
      );


    state.workStartedAt =
      null;


    state.workPaidThroughAt =
      null;


    state.workHappinessUpdatedAt =
      null;


    state.workEnergyUpdatedAt =
      null;


    state.workStartEnergy =
      null;


    saveState();


    closeInteractionTray(
      false
    );


    updateStatusDisplay();


    if (
      manual
    ) {

      playWorkExit();


      showMessage(
        "Shift ended"
      );

    } else {

      temporaryAnimation =
        false;


      updateMoodAnimation();

    }

  }


  /* ==========================================================
     PERSISTENT TIME / DAILY ENERGY SYSTEM

     This replaces the original app.js
     energy timing so the new 18h / 8h
     schedule remains timestamp-driven
     while the app is closed.
  ========================================================== */

  updatePersistentTime =
    function () {

      if (
        !state
      ) {

        return;

      }


      state =
        addEconomyDefaults(
          state
        );


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


      if (
        !state.alive
      ) {

        state.lastUpdate =
          now;


        saveState();


        return;

      }


      syncPersistentSickness(
        state
      );


      const wasWorking =
        state.working;


      /* ------------------------------------------------------
         NORMAL ENERGY / SLEEP
      ------------------------------------------------------ */

      if (
        state.sleeping
      ) {

        state.energy =
          clamp(
            state.energy +
            SLEEP_ENERGY_RECOVERY_PER_MINUTE *
            minutes
          );


        if (
          state.energy >=
            100
        ) {

          state.energy =
            100;


          state.sleeping =
            false;


          state.forcedSleep =
            false;

        }

      } else {

        state.energy =
          clamp(
            state.energy -
            BASE_ENERGY_DRAIN_PER_MINUTE *
            minutes
          );


        if (
          state.energy <=
            0
        ) {

          state.energy =
            0;


          if (
            state.forcedSit
          ) {

            releaseForcedSit(
              false
            );

          }


          state.sleeping =
            true;


          state.forcedSleep =
            true;


          stopWalking();

        }

      }


      /* ------------------------------------------------------
         FOOD / HEALTH
      ------------------------------------------------------ */

      updateFoodFromClock();


      updateHealthFromClock(
        minutes
      );


      /* ------------------------------------------------------
         WORK

         Reconcile wages, happiness and the
         extra work energy cost using elapsed
         real-world time.
      ------------------------------------------------------ */

      const result =
        reconcileWorkState(
          state,
          now
        );


      state =
        result.state;


      /*
         Extra work drain can also push energy
         to zero between updates.
      */

      if (
        state.energy <=
          0 &&
        !state.sleeping
      ) {

        state.energy =
          0;


        if (
          state.forcedSit
        ) {

          releaseForcedSit(
            false
          );

        }


        state.sleeping =
          true;


        state.forcedSleep =
          true;


        stopWalking();

      }


      /*
         Sleeping automatically ends work.
      */

      if (
        state.working &&
        state.sleeping
      ) {

        state.working =
          false;


        state.lastWorkEndedAt =
          now;


        state.workStartedAt =
          null;


        state.workPaidThroughAt =
          null;


        state.workHappinessUpdatedAt =
          null;


        state.workEnergyUpdatedAt =
          null;


        state.workStartEnergy =
          null;

      }


      state.lastUpdate =
        now;


      saveState();


      updateCoinDisplay();


      if (
        result.coinsEarned >
          0 &&
        currentScreen ===
          "game"
      ) {

        showMessage(
          `+${result.coinsEarned} coin${
            result.coinsEarned ===
              1
              ? ""
              : "s"
          }`
        );

      }


      if (
        wasWorking &&
        !state.working &&
        currentScreen ===
          "game"
      ) {

        temporaryAnimation =
          false;


        setWorkMoverPosition(
          0,
          0
        );


        updateMoodAnimation();

      }


      if (
        state.working &&
        currentScreen ===
          "game"
      ) {

        updateWorkAnimation();

      }

    };


  /* ==========================================================
     ACTIONS
  ========================================================== */

  const originalPerformAction =
    performAction;


  performAction =
    function (
      action
    ) {

      if (
        !state ||
        !state.alive
      ) {

        return;

      }


      if (
        state.working &&
        action !==
          "work"
      ) {

        showMessage(
          "Working."
        );


        return;

      }


      /* ------------------------------------------------------
         WORK
      ------------------------------------------------------ */

      if (
        action ===
          "work"
      ) {

        if (
          state.working
        ) {

          stopWork(
            true
          );

        } else {

          startWork();

        }


        return;

      }


      /* ------------------------------------------------------
         FOOD

         Each feeding:
         - costs 1 coin
         - restores exactly 25 hunger
         - does not cure sickness
         - does not heal
         - does not increase happiness
      ------------------------------------------------------ */

      if (
        action ===
          "feed" &&
        !state.sleeping &&
        !state.forcedSit
      ) {

        if (
          state.coins <
            FOOD_COST
        ) {

          showMessage(
            `Food costs ${FOOD_COST} coin`
          );


          updateStatusDisplay();


          return;

        }


        updateFoodFromClock();


        const now =
          Date.now();


        const newHunger =
          clamp(
            state.hunger +
            FOOD_HUNGER_RESTORE
          );


        state.coins -=
          FOOD_COST;


        state.hunger =
          newHunger;


        /*
           Convert the new hunger percentage
           back into its equivalent timestamp
           so offline hunger decay stays
           accurate.
        */

        const hungerFraction =
          newHunger /
          100;


        state.lastMealAt =
          now -
          (
            1 -
            hungerFraction
          ) *
          FOOD_DURATION_MS;


        state.lastInteraction =
          now;


        updateStatusDisplay();


        playTemporaryAnimation(
          "eat",
          2200
        );


        showMessage(
          "Eating"
        );


        saveState();


        return;

      }


      /* ------------------------------------------------------
         MEDICINE
      ------------------------------------------------------ */

      if (
        action ===
          "medicine"
      ) {

        const needsMedicine =
          state.sick ||
          state.health <
            95;


        if (
          !needsMedicine
        ) {

          showMessage(
            "Healthy"
          );


          return;

        }


        if (
          state.coins <
            MEDICINE_COST
        ) {

          showMessage(
            `Medicine costs ${MEDICINE_COST}`
          );


          updateStatusDisplay();


          return;

        }


        state.coins -=
          MEDICINE_COST;


        state.sick =
          false;


        state.health =
          clamp(
            state.health +
            MEDICINE_HEAL
          );


        updateStatusDisplay();


        playTemporaryAnimation(
          "angry",
          1500
        );


        showMessage(
          "Medicine"
        );


        saveState();


        return;

      }


      originalPerformAction(
        action
      );


      updateCoinDisplay();

    };


  /* ==========================================================
     OPEN / LEAVE COMPANION
  ========================================================== */

  const originalOpenCompanion =
    openCompanion;


  openCompanion =
    function (
      slotIndex
    ) {

      clearWorkVisualTimer();


      const result =
        originalOpenCompanion(
          slotIndex
        );


      if (
        state
      ) {

        state =
          addEconomyDefaults(
            state
          );


        syncPersistentSickness(
          state
        );


        saveState();

      }


      if (
        state &&
        state.working &&
        currentScreen ===
          "game"
      ) {

        showWorkingVisual(
          false
        );

      } else if (
        state &&
        state.sick &&
        state.alive &&
        !state.sleeping
      ) {

        temporaryAnimation =
          false;


        setAnimation(
          "sick",
          activeDirection
        );

      }


      updateStatusDisplay();


      return result;

    };


  const originalOpenMainMenu =
    openMainMenu;


  openMainMenu =
    function () {

      clearWorkVisualTimer();


      return originalOpenMainMenu();

    };


  /* ==========================================================
     INITIAL UI
  ========================================================== */

  updateCoinDisplay();

})();