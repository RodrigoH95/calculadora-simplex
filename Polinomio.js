// Para formar una variable del tipo x = 4 + 2M;
class Polinomio {
  // c -> coeficiente de constante | m -> coeficiente M
  constructor(c, m) {
    this.c = c;
    this.m = m;
  }

  Multiplicar(constante) {
    this.c *= constante;
    this.m *= constante;
  }

  SumarPolinomio(polinomio) {
    this.c += polinomio.c;
    this.m += polinomio.m;
  }

  SumarConstante(valor) {
    this.c += valor;
  }

  Valor() {
    return this.m != 0 ? this : this.c;
  }
}