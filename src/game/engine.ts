    }
    s.gold -= cost;
    s.incomeLevel += 1;
    sfx("upgrade");
    this.emit();
  }

  repair() {
    const s = this.state;
    if (s.baseHp >= s.baseMaxHp) return;
    const cost = 30;
    if (s.gold < cost) {
      sfx("deny");
      return;
    }
    s.gold -= cost;
    s.baseHp = Math.min(s.baseMaxHp, s.baseHp + 5);
    sfx("upgrade");
    this.emit();
  }

  private waveEndNotified = false;

  private beginNextWave() {
    this.waveEndNotified = false;
    const s = this.state;
    s.wave += 1;

    const endlessBossWave =
      Boolean(this.stage.endless) && s.wave >= 10 && s.wave % 10 === 0;
    const bossWave =
      endlessBossWave || (this.stage.boss.enabled && this.stage.boss.wave === s.wave);
    s.waveMessage = bossWave ? `BOSS WAVE ${s.wave}` : `WAVE ${s.wave}`;
    s.waveMessageLife = 2.2;
    s.waveMessageType = bossWave ? "boss" : "start";

    if (shouldOfferRunModifier(s.wave)) {
      s.runModifierOffer = createRunModifierOffer(this.random, s.activeRunModifiers);
      if (s.runModifierOffer.length > 0) {
        s.waveMessage = "CHOOSE YOUR POWER";
        s.waveMessageLife = 999;
        s.waveMessageType = "complete";
        profile.recordWaveReached(s.wave);
        sfx("wave");
        this.emit();
        return;
      }
    }

    const bossCount = endlessBossWave
      ? 1 + Math.floor(s.wave / 30)
      : bossWave
        ? Math.max(0, this.stage.boss.count)
        : 0;
    const queueMult =
      Math.max(0.8, this.stage.gameplay.waveSizeMultiplier) *
      Math.max(0.8, this.stage.gameplay.waveDifficultyMultiplier);
    const plan = getWaveSpawnPlan(s.wave, s.stageWaveTarget);
    const queue = Math.floor((4 + s.wave * 1.5) * queueMult * plan.sizeMultiplier) + bossCount;
    s.spawnQueue = Math.min(64, Math.max(1, queue));
    s.spawnTimer = 0;
    s.waveTimer = plan.clearDelay * Math.max(0.55, this.stage.gameplay.waveDelayMultiplier);
    profile.recordWaveReached(s.wave);
    sfx("wave");
    this.emit();
  }

  private spawn(forcedKind?: StageEnemyKind, startDist?: number) {
    const s = this.state;
    if (s.zombies.length >= 60) return;
    const w = s.wave;
    const bossConfig = this.stage.endless
      ? {
          enabled: w >= 10 && w % 10 === 0,
          wave: w >= 10 && w % 10 === 0 ? w : null,