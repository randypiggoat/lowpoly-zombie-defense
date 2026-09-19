# Fit the tower UI to phone screens

## Changes
- Reduce the tower panel’s maximum height and remove redundant copy so gameplay remains visible.
- Turn the build list into compact rows with the tower identity, core stats, price, and build/unlock action aligned efficiently.
- Compact the selected-tower panel: keep level, sell, stats, targeting, upgrade paths, and workshop controls, but reduce spacing and place paired controls side by side where phone width allows.
- Preserve the existing look, all tower actions, gameplay, and progression behavior.

## Verification
- Open the game at the current iPhone-sized viewport and check both the build and selected-tower panels.
- Confirm building, selecting, upgrading, targeting, and selling remain reachable and usable.
- Check the latest project build result and browser errors.

## Technical details
- Limit changes to `src/components/game/HUD.tsx` unless verification reveals a directly related styling issue.
- Use the existing semantic colors and responsive utility classes.
