class Utils {
  static redondearNum(num) {
    return num === undefined ? "-" : +num.toFixed(2); // el '+' remueve 0's innecesarios
  }

  static procesarNumero(valor) {
    if(typeof valor === "string" && valor.includes("/")) {
      const partes = valor.split("/");
      if(partes[1] == 0) {
        return NaN;
      }
      return Number(partes[0] / partes[1]);
    }
  
    return Number(valor);
  }

  static invertirValoresDeArreglo(arr) {
    return arr.map(e => e instanceof Polinomio ? e.Multiplicar(-1) : -e);
  }

  static invertirValoresDeObjeto(obj) {
    Object.keys(obj).forEach(k => {if(obj[k] != 0) obj[k] *= -1});
  }
}

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
    return arr.map(e => {
      if(e instanceof Polinomio) return e;
      return this.ConvertirPolinomio(e);
    });
  }
}


// INICIO DE CALCULOS
// Requisitos:
// Coeficientes de funcion Z
// Coeficientes de limitaciones
// Comparadores
// objEsMax

let valoresZ = [4, 1]
const valores = [
  [3, 1, 3],
  [4, 3, 6],
  [1, 2, 4]
];
const comparadores = [0, 1, -1];
let objetivoEsMax = false;

let coeficientes = {};
let TI = [0];
let cantCoeficientes = 0;
let matriz = [];

function formarMatriz() {
  if (!objetivoEsMax) valoresZ = Utils.invertirValoresDeArreglo(valoresZ);

  for(let i = 0; i < valoresZ.length; i++) {
    cantCoeficientes++;
    coeficientes["x" + cantCoeficientes] = valoresZ[i];
  }

  // Extraccion de terminos independientes
  TI.push(...valores.map(r => r.pop()));

  // Se agregan los coeficientes a cada fila
  for (let i = 0; i < comparadores.length; i++) {
    cantCoeficientes++;
    switch (comparadores[i]) {
      case -1:
        coeficientes["x" + cantCoeficientes] = 0;
        valores[i][cantCoeficientes - 1] = 1;
        valoresZ.push(0);
        break;
      case 0:
        coeficientes["r" + cantCoeficientes] = 0;
        valores[i][cantCoeficientes - 1] = 1;
        valoresZ.push(new Polinomio(0, -1));
        break;
      case 1:
        coeficientes["s" + cantCoeficientes] = 0;
        valores[i][cantCoeficientes - 1] = -1;
        valoresZ.push(0);
        cantCoeficientes++;
        coeficientes["r" + cantCoeficientes] = 0;
        valores[i][cantCoeficientes - 1] = 1;
        valoresZ.push(new Polinomio(0, -1));
    }
  }

  // Se iguala funcion Z a 0
  valoresZ = Utils.invertirValoresDeArreglo(valoresZ);
  valoresZ.push(TI[0]);
  // Se convierten los terminos en polinomios para trabajrlos mas adelante
  valoresZ = Polinomio.CovertirEnArrayDePolinomios(valoresZ);

  // Se llenan los espacios vacios de cada limitacion con 0's
  for(let i = 0; i < valores.length; i++) {
    llenarFila(valores[i]);
    // Se agrega T.I -- TI[0] es para Z
    valores[i].push(TI[i + 1]);
    if (comparadores[i] < 0) continue;
    // Si el comparador es = o >= se adecua la funcion Z
    adecuarFuncionObjetivo(valores[i]);
  }

  matriz.push(valoresZ, ...valores);
}

function llenarFila(fila) {
  fila.length = cantCoeficientes;
  for (let i = 0; i < fila.length; i++) {
    if(!(i in fila)) fila[i] = 0;
  }
}

function adecuarFuncionObjetivo(arr) {
  const nombresCoeficientes = Object.keys(coeficientes);
  for(let i = 0; i <= nombresCoeficientes.length; i++) {
    const M = new Polinomio(0, -1);
    const mult = M.Multiplicar(arr[i]);
    valoresZ[i] = valoresZ[i].SumarPolinomio(mult);
  }
}

formarMatriz();
console.table(matriz);