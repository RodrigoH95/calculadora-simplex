class CalculadoraSimplex {
  constructor() {
    this.limitsCount = 0;
    this.nroVariables = 2;
    this.incognitas = {
      x1: 0,
      x2: 0,
    };
    this.iteraciones = 0;
    this.baseOriginal = ["Z"];
    this.base = [];
    this.matrix = [];
    this.objetivoEsMax = true;
    this.usaMetodoM = false;
    this.DOM = new ManipuladorDOM();
  }

  start() {
    this.DOM.start();
    this.DOM.btnAgregarLimit.addEventListener("click", (e) => {
      e.preventDefault();
      this.limitsCount++;
      // Esta parte se debería realizar luego de comenzar el calculo
      // REMOVER CUANDO SE HAGA EN OTRO LADO
      const nuevaIncognita = "x" + (this.limitsCount + 2); // Las variables de holgura comienzan desde 3 en adelante
      this.incognitas[nuevaIncognita] = 0;
      this.baseOriginal.push(nuevaIncognita);
      this.DOM.crearInputBox(this.limitsCount);
    });

    this.DOM.btnEliminarLimit.addEventListener("click", (e) => {
      e.preventDefault();
      if (this.DOM.limitacionesContainer.childElementCount <= 0) return;
      this.DOM.limitacionesContainer.removeChild(
        this.DOM.limitacionesContainer.lastChild
      );
      const incognitaAEliminar = this.baseOriginal.pop();
      delete this.incognitas[incognitaAEliminar];
      this.limitsCount--;
    });

    this.DOM.btnCalcular.addEventListener("click", (e) => {
      e.preventDefault();
      if (!this.validarDatos()) return;
      this.LimpiarDatos();
      this.prepararDatos();
      this.completarMatriz();
      this.calcular();
    });
  }

  prepararDatos() {
    let fila0 = [this.DOM.valueX1.value, this.DOM.valueX2.value];
    this.comprobacionesPrevias();
    if (!this.objetivoEsMax) {
      // invertir Z
      Utils.invertirValoresDeArreglo(fila0);
    }

    if(this.usaMetodoM) {
      // completar funcion Z y adecuarla (polinomios)
    }
    // // Esta parte se debería realizar luego de comenzar el calculo
    // const nuevaIncognita = "x" + (this.limitsCount + 2); // Las variables de holgura comienzan desde 3 en adelante
    // this.incognitas[nuevaIncognita] = 0;
    // this.baseOriginal.push(nuevaIncognita);
  }

  comprobacionesPrevias() {
    this.objetivoEsMax = Boolean(this.DOM.obtenerObjetivo());
    this.usaMetodoM = !this.limitacionesMenorIgual();
  }

  limitacionesMenorIgual() {
    const limitaciones = this.DOM.obtenerLimitaciones();
    for(let i = 0; i < limitaciones.length; i++) {
      const valor = this.DOM.obtenerValoresDeCampo(limitaciones[i], "SELECT");
      if (valor >= 0) return false; // 0 - igual | 1 - mayor o igual
    }
    return true;
  }

  completarMatriz() {
    // Fila inicial
    const fila0 = new Array(Object.keys(this.incognitas).length + 1).fill(0); // +1 por termino independiente
    // Si se iguala funcion Z a 0 x1 y x2 se invierten
    // REMOVER CUANDO SE HAGA EN OTRO LADO
    fila0[0] = this.DOM.valueX1.value * (this.objetivoEsMax ? -1 : 1);
    fila0[1] = this.DOM.valueX2.value * (this.objetivoEsMax ? -1 : 1);
    this.matrix.push(fila0);

    // Se obtiene array con los contenedores de limitaciones
    const limitaciones = this.DOM.obtenerLimitaciones();
    for (let i = 0; i < limitaciones.length; i++) {
      // Se extraen los valores en los inputs de cada fila de limitaciones
      const values = this.DOM.obtenerValoresDeCampo(limitaciones[i], "INPUT");
      const terminoInd = values.pop();
      const filan = new Array(fila0.length - 1).fill(0);
      for (let j = 0; j < fila0.length; j++) {
        // Se llena la fila con los valores de los inputs
        if (values[j]) filan[j] = values[j];
        // Chequear si corresponde colocar una incognita en la posicion (Crea la matriz identidad)
        if (this.nroVariables + i == j) filan[j] = 1;
      }
      filan.push(terminoInd);
      this.matrix.push(filan);
    }
  }

  LimpiarDatos() {
    this.iteraciones = 0;
    this.matrix.length = 0;
    this.base = [...this.baseOriginal];
    delete this.incognitas["Z"];
    Object.keys(this.incognitas).forEach((k) => (this.incognitas[k] = 0));
  }

  obtenerVariableEntrante() {
    const valorMinimo = Math.min(...this.matrix[0]);
    return valorMinimo < 0 ? this.matrix[0].indexOf(valorMinimo) : null;
  }

  obtenerVariableSaliente(posVarEntrante) {
    let menor = Infinity;
    let indice = 0;
    const posUltimoElemento = this.matrix[0].length - 1;
    for (let fila = 1; fila < this.matrix.length; fila++) {
      const terminoInd = this.matrix[fila][posUltimoElemento];
      const divisor = this.matrix[fila][posVarEntrante];
      if (divisor <= 0) continue;
      const cociente = terminoInd / divisor;
      if (cociente < menor) {
        menor = cociente;
        indice = fila;
      }
    }
    return indice;
  }

  calcular() {
    this.iteraciones++;
    const colVarEntrante = this.obtenerVariableEntrante();
    const filaVarSaliente = this.obtenerVariableSaliente(colVarEntrante);
    this.base[filaVarSaliente] = Object.keys(this.incognitas)[colVarEntrante];

    const nuevaMatrix = [...this.matrix];
    const valorBase = nuevaMatrix[filaVarSaliente][colVarEntrante];
    const filaBase = nuevaMatrix[filaVarSaliente];
    const longitudFila = nuevaMatrix[0].length;
    for (let i = 0; i < longitudFila; i++) {
      filaBase[i] /= valorBase;
    }

    const colPivote = this.obtenerColPivote(filaVarSaliente);
    for (let i = 0; i < this.matrix.length; i++) {
      if (i == filaVarSaliente) continue;
      const valorBase = this.matrix[i][colPivote];
      for (let j = 0; j < longitudFila; j++) {
        nuevaMatrix[i][j] = filaBase[j] * -valorBase + nuevaMatrix[i][j];
      }
    }

    this.matrix = [...nuevaMatrix];
    if (this.obtenerVariableEntrante() != null) {
      nuevaMatrix.length = 0;
      this.calcular();
    } else {
      for (let i = 0; i < this.matrix.length; i++) {
        this.incognitas[this.base[i]] = this.matrix[i][longitudFila - 1];
      }
      this.mostrarResultado();
    }
  }

  obtenerColPivote(fila) {
    return Object.keys(this.incognitas).indexOf(this.base[fila]);
  }

  mostrarResultado() {
    this.DOM.resultado.innerHTML = "";
    this.DOM.crearTabla(
      this.matrix,
      ["Base", ...Object.keys(this.incognitas), "T.I"],
      this.base
    );
    this.DOM.crearDetalles(this.incognitas, this.iteraciones);
  }

  validarDatos() {
    let valid = true;
    const x1 = this.DOM.valueX1.value;
    const x2 = this.DOM.valueX2.value;
    let error = "";

    if (!(x1 && x2 && Number(Number(x1) + Number(x2)))) {
      error += "- Valores en función Z deben ser numéricos.\n";
      valid = false;
    }
    const limitaciones = Array.from(this.DOM.limitacionesContainer.childNodes);

    if (limitaciones.length <= 0) {
      error += "- No hay limitaciones\n";
      valid = false;
    } else {
      if (!this.checkLimitaciones(limitaciones)) {
        valid = false;
        error +=
          "- Todos los campos de las limitaciones deben ser numericos.\n";
      }
    }
    if (error.length > 0) {
      alert(error);
    }
    return valid;
  }

  checkLimitaciones(arrLimits) {
    for (const elem of arrLimits) {
      const valores = Array.from(elem.childNodes)
        .filter((el) => el.tagName == "INPUT")
        .map((input) => input.value);
      for (const num of valores) {
        if (!num || isNaN(Number(num))) return false;
      }
    }
    return true;
  }

  logInfo() {
    console.log("Incognitas:", this.incognitas);
    console.log("Base:", this.base);
    console.table("Matriz:", this.matrix);
  }
}

window.onload = () => {
  const calculadora = new CalculadoraSimplex();
  calculadora.start();
};
