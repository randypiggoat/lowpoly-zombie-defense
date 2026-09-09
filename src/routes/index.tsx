import { createFileRoute } from "@tanstack/react-router";
import { GameCanvas } from "@/components/game/GameCanvas";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Rotwood Defense — Idle Zombie Tower Defense" },
      {
        name: "description",
        content:
          "Defend the last village from endless zombie waves. Build and upgrade eight low-poly towers, grow your idle gold income, and survive as long as you can.",
      },
      { property: "og:title", content: "Rotwood Defense — Idle Zombie Tower Defense" },
      {
        property: "og:description",
        content:
          "A low-poly idle tower defense game for phones. Upgrade towers, farm gold, hold the line against the horde.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Rotwood" },
      { name: "theme-color", content: "#1d2430" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
    ],
  }),
  component: GameCanvas,
});
