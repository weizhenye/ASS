export function clear() {
  while (this._.$stage.lastChild) {
    this._.$stage.removeChild(this._.$stage.lastChild);
  }
  while (this._.$defs.lastChild) {
    this._.$defs.removeChild(this._.$defs.lastChild);
  }
  this._.stagings = [];
  this._.space = [];
}
