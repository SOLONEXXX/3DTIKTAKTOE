function supported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

class Haptics {
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private fire(pattern: number | number[]) {
    if (!this.enabled || !supported()) return;
    navigator.vibrate(pattern);
  }

  place() {
    this.fire(12);
  }

  win() {
    this.fire([30, 60, 30, 60, 60]);
  }

  lose() {
    this.fire([80, 50, 80]);
  }

  tap() {
    this.fire(8);
  }
}

export const haptics = new Haptics();
