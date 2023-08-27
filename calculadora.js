class CalculadoraSimplex {
  constructor() {
    this.limitsCount = 0;
    this.nroVariables = 2;
    this.iteraciones = 0;
    this.base = [];
    this.DOM = new ManipuladorDOM();

    this.matriz = [];
    this.resultado = {};
    this.objetivoEsMax = true;
    this.usaMetodoM = false;
    this.incognitasZ = [];
    this.baseOriginal = [];
    this.coeficientesZ = [];
    this.cantCoeficientes = 0;
    this.comparadores = [];
    this.coeficientesL = [];
    this.TI = [];
  }

  start() {
    this.DOM.start();

    this.DOM.btnCalcular.addEventListener("click", (e) => {
      e.preventDefault();
      if (!this.validarDatos()) return;
      this.LimpiarDatos();
      this.prepararDatos();
      this.comprobacionesPrevias();
      this.formarMatriz();
      this.calcular();
    });
  }

  LimpiarDatos() {
    this.DOM.resultado.innerHTML = "";
    this.iteraciones = 0;
    this.matriz = [];
    this.resultado = {};
    this.usaMetodoM = false;
    this.incognitasZ = [];
    this.baseOriginal = [];
    this.coeficientesZ = [];
    this.cantCoeficientes = 0;
    this.comparadores = [];
    this.coeficientesL = [];
    this.TI = [];
  }

  prepararDatos() {
    // Obtencion de valores de coeficientes en funcion Z
    this.coeficientesZ.push(this.DOM.getValor("X1"));
    this.coeficientesZ.push(this.DOM.getValor("X2"));

    // Seteo de base y termino independiente para funcion Z
    this.baseOriginal.push("Z");
    this.TI.push(0);

    // Obtencion de valores de inputs y comparadores de cada limitacion
    for (const limit of this.DOM.obtenerLimitaciones()) {
      this.coeficientesL.push(this.DOM.obtenerValoresDeCampo(limit, "INPUT"));
      this.comparadores.push(...this.DOM.obtenerValoresDeCampo(limit, "SELECT"));
    }
  }

  comprobacionesPrevias() {
    this.objetivoEsMax = Boolean(this.DOM.obtenerObjetivo());
    if (Math.max(...this.comparadores) >= 0) this.usaMetodoM = true;
    if (!this.objetivoEsMax) this.coeficientesZ = Utils.invertirValoresDeArreglo(this.coeficientesZ);
  }

  formarMatriz() {
    for (let i = 0; i < this.coeficientesZ.length; i++) {
      this.cantCoeficientes++;
      this.incognitasZ.push("x" + this.cantCoeficientes);
    }
    // Extraccion de terminos independientes
    this.TI.push(...this.coeficientesL.map((r) => r.pop()));
    this.agregarVariablesEspeciales();
    this.base = [...this.baseOriginal];

    // Se iguala funcion Z a 0
    this.coeficientesZ = Utils.invertirValoresDeArreglo(this.coeficientesZ);
    this.coeficientesZ.push(this.TI[0]);

    // Si usa metodo de la M se convierten los coeficientes de funcion Z en polinomios para trabajarlos mas adelante
    if (this.usaMetodoM) this.coeficientesZ = Polinomio.CovertirEnArrayDePolinomios(this.coeficientesZ);
    this.completarFilas();
    this.matriz.push(this.coeficientesZ, ...this.coeficientesL);

    this.mostrarTablaActual();
  }

  agregarVariablesEspeciales() {
    // Se agregan los coeficientes a cada fila
    for (let i = 0; i < this.comparadores.length; i++) {
      this.cantCoeficientes++;
      switch (this.comparadores[i]) {
        case -1:
          // <= (Se agrega variable de holgura)
          this.agregarNuevaVariable(i, "x", 0);
          break;
        case 0:
          // = (Se agrega variable artificial);
          this.agregarNuevaVariable(i, "r", new Polinomio(0, -1));
          break;
        case 1:
          // >= (Se agrega variable de superavit y variable artificial)
          this.agregarNuevaVariable(i, "s", 0);
          this.cantCoeficientes++;
          this.agregarNuevaVariable(i, "r", new Polinomio(0, -1));
          break;
      }
    }
  }

  agregarNuevaVariable(fila, nombre, coeficienteEnZ) {
    this.incognitasZ.push(nombre + this.cantCoeficientes);
    this.coeficientesL[fila][this.cantCoeficientes - 1] = nombre === "s" ? -1 : 1;
    this.coeficientesZ.push(coeficienteEnZ);
    if (nombre !== "s") this.baseOriginal.push(nombre + this.cantCoeficientes);
  }

  completarFilas() {
    // Se completan las filas con 0's y se adecua la funcion objetivo de ser necesario
    for (let i = 0; i < this.coeficientesL.length; i++) {
      this.llenarFila(this.coeficientesL[i]);
      this.coeficientesL[i].push(this.TI[i + 1]);
      if (this.comparadores[i] < 0) continue;
      this.adecuarFuncionObjetivo(this.coeficientesL[i]);
    }
  }

  llenarFila(fila) {
    fila.length = this.cantCoeficientes;
    for (let i = 0; i < fila.length; i++) {
      if (!(i in fila)) fila[i] = 0;
    }
  }

  adecuarFuncionObjetivo(arr) {
    for (let i = 0; i <= this.incognitasZ.length; i++) {
      const M = new Polinomio(0, -1);
      const mult = M.Multiplicar(arr[i]);
      if (this.coeficientesZ[i] instanceof Polinomio) {
        this.coeficientesZ[i] = this.coeficientesZ[i].Sumar(mult);
      } else if (mult instanceof Polinomio) {
        this.coeficientesZ[i] = mult.Sumar(this.coeficientesZ[i]);
      } else {
        this.coeficientesZ[i] = this.coeficientesZ[i] + mult;
      }
    }
  }

  obtenerVariableEntrante() {
    // Coeficientes de la fila 0 de la matriz sin T.I
    const fila0 = this.matriz[0].slice(0, -1).map((v) => {
      if (v instanceof Polinomio) {
        return v.m != 0 ? v.m : v.c;
      } else return v;
    });
    const valorMinimo = Math.min(...fila0);
    return valorMinimo < 0 ? fila0.indexOf(valorMinimo) : null;
  }

  obtenerVariableSaliente(posVarEntrante) {
    let menor = Infinity;
    let indice = 0;
    const posUltimoElemento = this.matriz[0].length - 1;
    for (let fila = 1; fila < this.matriz.length; fila++) {
      const terminoInd = this.matriz[fila][posUltimoElemento];
      const divisor = this.matriz[fila][posVarEntrante];
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
    this.base[filaVarSaliente] = this.incognitasZ[colVarEntrante];
    let nuevaMatriz = [...this.matriz];
    const valorBase = nuevaMatriz[filaVarSaliente][colVarEntrante];
    const filaBase = nuevaMatriz[filaVarSaliente];
    const longitudFila = nuevaMatriz[0].length;

    for (let i = 0; i < longitudFila; i++) {
      filaBase[i] /= valorBase;
    }
    const colPivote = this.obtenerColPivote(filaVarSaliente);

    for (let i = 0; i < this.matriz.length; i++) {
      if (i == filaVarSaliente) continue;
      const valorBase = this.matriz[i][colPivote];
      for (let j = 0; j < longitudFila; j++) {
        if (i == 0 && valorBase instanceof Polinomio) {
          const poli = new Polinomio(valorBase.c, valorBase.m);
          poli.Multiplicar(-1);
          poli.Multiplicar(filaBase[j]);
          nuevaMatriz[i][j] = poli.Sumar(nuevaMatriz[i][j]);
        } else {
          if (nuevaMatriz[i][j] instanceof Polinomio) {
            nuevaMatriz[i][j] = nuevaMatriz[i][j].Sumar(
              filaBase[j] * -valorBase
            );
          } else {
            nuevaMatriz[i][j] = filaBase[j] * -valorBase + nuevaMatriz[i][j];
          }
        }
      }
    }
    this.matriz = [...nuevaMatriz];
    if (this.obtenerVariableEntrante() != null) {
      nuevaMatriz = [];
      // Mostrar resultado parcial
      this.mostrarTablaActual();
      this.calcular();
    } else {
      for (let i = 0; i < this.matriz.length; i++) {
        let valor = this.matriz[i][longitudFila - 1];
        // Z se invierte si el objetivo es minimizar
        if (i == 0 && !this.objetivoEsMax) valor *= -1;
        this.resultado[this.base[i]] = valor;
      }
      this.mostrarResultado();
    }
  }

  obtenerColPivote(fila) {
    return this.incognitasZ.indexOf(this.base[fila]);
  }

  mostrarResultado() {
    // this.DOM.resultado.innerHTML = "";
    this.mostrarTablaActual();
    this.DOM.crearDetalles(this.resultado, this.iteraciones);
  }

  mostrarTablaActual() {
    this.DOM.crearTabla(this.matriz, ["Base", ...this.incognitasZ, "T.I"], this.base);
  }

  validarDatos() {
    let valid = true;
    const x1 = this.DOM.getValor("X1");
    const x2 = this.DOM.getValor("X2");
    let error = "";

    if (!(x1 && x2 && Number(Number(x1) + Number(x2)))) {
      error += "- Valores en función Z deben ser numéricos.\n";
      valid = false;
    }
    const limitaciones = this.DOM.obtenerLimitaciones();

    if (limitaciones.length <= 0) {
      error += "- No hay limitaciones\n";
      valid = false;
    } else {
      if (!this.checkLimitaciones(limitaciones)) {
        valid = false;
        error += "- Todos los campos de las limitaciones deben ser numericos.\n";
      }
    }
    if (error.length > 0) alert(error);
    return valid;
  }

  checkLimitaciones(arrLimits) {
    for (const elem of arrLimits) {
      const valores = Array.from(elem.childNodes)
        .filter((el) => el.tagName == "INPUT")
        .map((input) => input.value);
      for (const num of valores) {
        if (!num || isNaN(Utils.procesarNumero(num))) return false;
      }
    }
    return true;
  }
}
