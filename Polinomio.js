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
    console.log("Resultado de multiplicacion:", this);
    return this;
  }

  SumarPolinomio(polinomio) {
    this.c += polinomio.c;
    this.m += polinomio.m;
    return this;
  }

  SumarConstante(valor) {
    this.c += valor;
    return this;
  }

  puedeConvertirseAConstante() {
    return this.m == 0;
  }

  Valor() {
    return this.puedeConvertirseAConstante() ? this.c : this;
  }

  static CovertirEnArrayDePolinomios(arr) {
    arr = arr.forEach(e => this.ConvertirPolinomio(e));
    console.log("Se convierte en polinomio", arr);
  }
}