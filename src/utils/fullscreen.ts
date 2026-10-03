export async function toggleGameFullscreen() {
    const gameShell = document.getElementById('game-shell');
    if (!gameShell || !document.fullscreenEnabled) return false;

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await gameShell.requestFullscreen();
        }
        return true;
    } catch (error) {
        console.warn('Impossible de changer le mode plein écran :', error);
        return false;
    }
}
