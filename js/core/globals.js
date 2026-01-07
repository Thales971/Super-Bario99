// Namespace global da v2 (sem ES Modules para funcionar também via file://)
window.SuperBario99 = window.SuperBario99 || {};

SuperBario99.util = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  rand(min, max) {
    return Math.random() * (max - min) + min;
  },
  irand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
