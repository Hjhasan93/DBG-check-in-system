export async function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen(); // Safari
}

export async function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen(); // Safari
}

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
