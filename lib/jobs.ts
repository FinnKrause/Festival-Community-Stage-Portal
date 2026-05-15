import { startAutoPlay } from "./jobs/autoplay";
import { startCleanup } from "./jobs/cleanup";

export function initializeJobs() {
  startCleanup();
  startAutoPlay();
}
