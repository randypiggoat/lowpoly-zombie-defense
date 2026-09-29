# Idle Zombie Defense

Build a simple idle tower defense game where you can upgrade your units and you defend against zombies. Give it a low poly look and make it a phone game for the iPhone able to be published on the app store

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lowpoly-zombie-defense.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cb5c11e-0ecd-4c33-8f02-026c8ba2a472).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

The project uses **Bun** for installs and scripts.

### Launch from GitHub

To run the current game locally:

```sh
git clone https://github.com/randypiggoat/lowpoly-zombie-defense.git
cd lowpoly-zombie-defense
bun install
bun run dev
```

Then open the local URL printed by Vite (usually `http://localhost:5173`).

### Verify changes

```sh
bun run lint
bun run test:unit
bun run build
bun run test:e2e
```

GitHub Actions runs the same quality gates on feature branches and pull requests.

## Progression design

Tower upgrades are intentionally split into two layers:

- **SCRAP (in-run):** each placed tower chooses between two four-tier paths. Path tiers are the main source of power and unlock behavior changes such as burst fire, stun, marks, shatter effects, executions, elite/boss specialization, and burn persistence. A tower's displayed level is derived from its purchased path tiers.
- **CREDITS (persistent):** **Field Knowledge** is the permanent account progression layer. It has three small prerequisite branches—Arsenal, Fieldcraft, and Salvage—and is not tied to an individual tower. Legacy per-tower Workshop save data is retained only for compatibility and has no combat effect.

The upgrade UI shows only the next tier on each branch, keeping the tactical decision readable during combat.
