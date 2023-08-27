// Para formar una variable del tipo x = 4 + 2M;
class Polinomio {
  // c -> coeficiente de constante | m -> coeficiente M
  constructor(c, m = 0) {
    this.c = c;
    this.m = m;
  }

  static ConvertirPolinomio(num) {
    return new Polinomio(num, 0);
  }

  Multiplicar(constante) {
    this.c *= constante;
    this.m *= constante;
    return this.Valor();
  }

  SumarPolinomio(polinomio) {
    this.c += polinomio.c;
    this.m += polinomio.m;
    return this.Valor();
  }

  SumarConstante(valor) {
    this.c += valor;
    return this.Valor();
  }

  Sumar(valor) {
    if (valor instanceof Polinomio) {
      this.c += valor.c;
      this.m += valor.m;
    } else {
      this.c += valor;
    }
    return this.Valor();
  }

  puedeConvertirseAConstante() {
    return +this.m.toFixed(2) == 0;
  }

  Valor() {
    return this.puedeConvertirseAConstante() ? this.c : this;
  }

  toString() {
    let signo = this.m > 0 ? "+" : "-";
    return `${+this.c.toFixed(2)} ${signo} ${Math.abs(+this.m.toFixed(2))}M`;
  }

  static CovertirEnArrayDePolinomios(arr) {
    return arr.map(e => {
      if(e instanceof Polinomio) return e;
      return this.ConvertirPolinomio(e);
    });
  }
}