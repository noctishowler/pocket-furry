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


  /*
     Work uses the normal awake energy
     drain already handled by app.js.

     Happiness is the additional work cost.
  */

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


      /*
         Sickness is persistent.

         Once true, feeding alone does not
         clear it. Medicine is required.
      */

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


    const lastMealAt =
      Number(
        companionState.lastMealAt
      ) ||
      Date.now();


    const foodAge =
      Math.max(
        0,
        Date.now() -
        lastMealAt
      );


    /*
       Hunger reaches zero at
       FOOD_DURATION_MS.

       Reaching zero causes persistent
       sickness.

       Feeding restores hunger, but once
       sick, only medicine cures sickness.
    */

    if (
      foodAge >=
        FOOD_DURATION_MS
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


      const hungerStage =
        getHungerStage();


      /*
         Continued starvation still causes
         health damage at the original rate.
      */

      if (
        hungerStage ===
          "sick" ||
        hungerStage ===
          "critical"
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
           Healthy companions recover very
           slowly when every need is met.

           Sick companions do NOT naturally
           recover until medicine cures them.
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
     WORK STATE
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


    const minutesUntilEmpty =
      ENERGY_DRAIN_PER_MINUTE >
        0
        ? startEnergy /
          ENERGY_DRAIN_PER_MINUTE
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


    const effectiveNow =
      Math.min(
        now,
        scheduledEnd
      );


    let coinsEarned =
      0;


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
              (
                Math.min(
                  scheduledEnd,
                  effectiveNow
                ) -
                startedAt
              ) /
              WORK_PAY_INTERVAL_MS
            )
          ) *
          WORK_PAY_PER_INTERVAL
        );


      companionState.workStartedAt =
        null;


      companionState.workPaidThroughAt =
        null;


      companionState.workHappinessUpdatedAt =
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


    const animation =
      getWorkAnimation();


    setAnimation(
      animation,
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
     MAIN MENU COIN / SICK / WORK STATUS
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
     IDLE / OFFLINE WORK PROGRESSION
  ========================================================== */

  const originalUpdatePersistentTime =
    updatePersistentTime;


  updatePersistentTime =
    function () {

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

      }


      originalUpdatePersistentTime();


      if (
        !state
      ) {

        return;

      }


      syncPersistentSickness(
        state
      );


      const wasWorking =
        state.working;


      const result =
        reconcileWorkState(
          state
        );


      state =
        result.state;


      /*
         If normal energy handling forces
         sleep, the work shift ends too.
      */

      if (
        state.working &&
        state.sleeping
      ) {

        state.working =
          false;


        state.lastWorkEndedAt =
          Date.now();


        state.workStartedAt =
          null;


        state.workPaidThroughAt =
          null;


        state.workHappinessUpdatedAt =
          null;


        state.workStartEnergy =
          null;

      }


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
         - does NOT cure sickness
         - does NOT heal health
         - does NOT improve happiness
         - does NOT improve recovery mood

         lastMealAt is recalculated so the
         existing clock-based hunger system
         stays synchronized with the new
         partial hunger value.
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


        /*
           First reconcile hunger with the
           current clock. This matters if the
           player has been away from the app.
        */

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
           Hunger normally derives from:

             hunger =
               100 -
               foodAge / FOOD_DURATION_MS * 100

           Convert the new hunger value back
           into an equivalent timestamp so
           future offline decay continues
           correctly.

           Example:

             25 hunger =
             last meal equivalent to
             75% of FOOD_DURATION_MS ago.
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


        /*
           Persistent sickness intentionally
           remains unchanged.

           Feeding removes starvation by
           restoring hunger, but medicine is
           still required to cure sickness.
        */

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

         Medicine is the ONLY cure for the
         persistent sickness state.
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


        /*
           Medicine cures sickness but does
           not refill hunger.

           If starvation continues, sickness
           can return.
        */

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