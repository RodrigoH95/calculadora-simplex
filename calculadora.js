class CalculadoraSimplex {
  constructor() {
    this.limitsCount = 0;
    this.nroVariables = 2;
    this.iteraciones = 0;
    this.base = [];
    this.DOM = new ManipuladorDOM();
    this.info = new InfoLog();

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
    this.DOM.slidesManager.reset();
    this.info.clearLog();
    this.iteraciones = 0;
    this.matriz = [];
    this.resultado = {};
    this.usaMetodoM = false;
    this.incognitasZ = [];
    this.baseOriginal = [];
    this.base = [];
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
    this.info.log("El objetivo es " + (this.objetivoEsMax ? "maximizar" : "minimizar") + " Z");
    this.info.log(this.usaMetodoM ? "Se debe usar el método de la M" : "Se puede resolver con Simplex estándar");
    this.DOM.crearSlideInformativa("Consideraciones previas:", this.info.getLog());
  }

  formarMatriz() {
    for (let i = 0; i < this.coeficientesZ.length; i++) {
      this.cantCoeficientes++;
      this.incognitasZ.push("x" + this.cantCoeficientes);
    }
    // Extraccion de terminos independientes
    this.TI.push(...this.coeficientesL.map((r) => r.pop()));
    this.info.newPage();
    this.agregarVariablesEspeciales();
    this.DOM.crearSlideInformativa("Variables especiales:", this.info.getLog());
    this.base = [...this.baseOriginal];

    // Se iguala funcion Z a 0
    this.coeficientesZ = Utils.invertirValoresDeArreglo(this.coeficientesZ);
    this.coeficientesZ.push(this.TI[0]);

    // Si usa metodo de la M se convierten los coeficientes de funcion Z en polinomios para trabajarlos mas adelante
    if (this.usaMetodoM) this.coeficientesZ = Polinomio.CovertirEnArrayDePolinomios(this.coeficientesZ);
    this.completarFilas();
    this.matriz.push(this.coeficientesZ, ...this.coeficientesL);
    this.info.newPage();
    this.info.log("Función Z igualada a 0:");
    this.info.log(this.obtenerFuncionZIgualadaACero());
    this.mostrarEstadoActual("Primera tabla:", this.info.getLog());
  }

  obtenerFuncionZIgualadaACero() {
    let funcion = this.objetivoEsMax ? "Z" : "-Z";
    for (let i = 0; i < this.incognitasZ.length; i++) {
      let termino;
      if (this.coeficientesZ[i] instanceof Polinomio) {
        termino = " + (" + this.coeficientesZ[i].toString() + ")";
      } else {
        termino = (this.coeficientesZ[i] < 0 ? " - " : " + ") + Math.abs(this.coeficientesZ[i]);
      }
      funcion += termino + this.incognitasZ[i];
    }
    funcion += " = 0";
    return funcion;
  }

  agregarVariablesEspeciales() {
    // Se agregan los coeficientes a cada fila
    for (let i = 0; i < this.comparadores.length; i++) {
      this.cantCoeficientes++;
      switch (this.comparadores[i]) {
        case -1:
          // <= (Se agrega variable de holgura)
          this.agregarNuevaVariable(i, "x", "de holgura", 0);
          break;
        case 0:
          // = (Se agrega variable artificial);
          this.agregarNuevaVariable(i, "r", "artificial", new Polinomio(0, -1));
          break;
        case 1:
          // >= (Se agrega variable de superavit y variable artificial)
          this.agregarNuevaVariable(i, "s", "de exceso", 0);
          this.cantCoeficientes++;
          this.agregarNuevaVariable(i, "r", "artificial", new Polinomio(0, -1));
          break;
      }
    }
  }

  agregarNuevaVariable(fila, nombre, tipo, coeficienteEnZ) {
    this.incognitasZ.push(nombre + this.cantCoeficientes);
    this.coeficientesL[fila][this.cantCoeficientes - 1] = nombre === "s" ? -1 : 1;
    this.coeficientesZ.push(coeficienteEnZ);
    if (nombre !== "s") this.baseOriginal.push(nombre + this.cantCoeficientes);
    this.info.log(`- Se agrega variable ${tipo} "${nombre}${this.cantCoeficientes}" (${fila + 1}° limitación).`);
  }

  completarFilas() {
    // Se completan las filas con 0's y se adecua la funcion objetivo de ser necesario
    for (let i = 0; i < this.coeficientesL.length; i++) {
      this.llenarFila(this.coeficientesL[i]);
      this.coeficientesL[i].push(this.TI[i + 1]);
      if (this.comparadores[i] < 0) continue;
      this.info.newPage();
      this.info.log("Se debe adecuar función objetivo debido a " + (i + 1) + "° limitación:");
      this.adecuarFuncionObjetivo(this.coeficientesL[i]);
      this.DOM.crearSlideInformativa("Adecuación de función objetivo", this.info.getLog());
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
      const valorInicial = this.coeficientesZ[i] instanceof Polinomio ? this.coeficientesZ[i].toString() : this.coeficientesZ[i];
      let terminos = [valorInicial];
      const mult = M.Multiplicar(arr[i]);
      if (this.coeficientesZ[i] instanceof Polinomio) {
        this.coeficientesZ[i] = this.coeficientesZ[i].Sumar(mult);
      } else if (mult instanceof Polinomio) {
        this.coeficientesZ[i] = mult.Sumar(this.coeficientesZ[i]);
      } else {
        this.coeficientesZ[i] = this.coeficientesZ[i] + mult;
      }
      terminos.push(arr[i], "-M", this.coeficientesZ[i])
      terminos.map(t => {
        if (t instanceof Polinomio) {
          return t.toString();
        }
        return t;
      });
      this.info.log(`${terminos[1]} x (${terminos[2]}) + (${terminos[0]}) = ${terminos[3]}`);
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
    this.info.newPage();
    this.iteraciones++;
    const colVarEntrante = this.obtenerVariableEntrante();
    const filaVarSaliente = this.obtenerVariableSaliente(colVarEntrante);
    this.info.log(`Entra a la base ${this.incognitasZ[colVarEntrante]} y sale ${this.base[filaVarSaliente]}.`);
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
      this.mostrarEstadoActual("Iteracion " + this.iteraciones, this.info.getLog());
      this.calcular();
    } else {
      for (let i = 0; i < this.matriz.length; i++) {
        let valor = this.matriz[i][longitudFila - 1];
        // Z se invierte si el objetivo es minimizar
        if (i == 0 && !this.objetivoEsMax) {
          valor *= -1;
          this.info.log("Se debe invertir el valor de Z dado que el objetivo es minimizar.");
        };
        this.resultado[this.base[i]] = valor;
      }
      this.info.log(this.crearDescripcion());
      this.info.log("Iteraciones en total: " + this.iteraciones);
      this.mostrarEstadoActual("Resultado final:", this.info.getLog());
    }
  }

  obtenerColPivote(fila) {
    return this.incognitasZ.indexOf(this.base[fila]);
  }

  mostrarEstadoActual(titulo, info) {
    if (!info) info = [];
    this.DOM.crearSlide(titulo, info, this.matriz, ["Base", ...this.incognitasZ, "T.I"], this.base);
  }

  crearDescripcion() {
    const { x1, x2, Z } = this.resultado;
    const nombreX1 = this.DOM.nombreX1.value || "x1";
    const nombreX2 = this.DOM.nombreX2.value || "x2";
    return `Con ${Utils.redondearNum(x1)} ${nombreX1} y ${Utils.redondearNum(x2)} ${nombreX2} se obtuvo un Z de ${Utils.redondearNum(Z)}`;
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
        error += "- Todos los campos de las limitaciones deben ser numéricos.\n";
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
