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

    this.DOM.btnAgregarVar.addEventListener("click", () => {
      this.DOM.limpiarLimitaciones();
      this.nroVariables++;
      this.DOM.crearVar(this.nroVariables);
    });

    this.DOM.btnAgregarLimit.addEventListener("click", () => {
      this.DOM.crearInputBox(this.nroVariables);
    });

    this.DOM.btnEliminarVar.addEventListener("click", () => {
      if (this.DOM.varContainer.childElementCount <= 2) return;
      this.DOM.limpiarLimitaciones();
      this.nroVariables--;
      this.DOM.borrarVar();
    });

    this.DOM.btnCalcular.addEventListener("click", () => {
      if (!this.validarDatos()) return;
      this.LimpiarDatos();
      this.prepararDatos();
      this.comprobacionesPrevias();
      this.formarMatriz();
      this.calcular();
      this.DOM.btnCalculos.classList.add("active");
      setTimeout(() => {
        this.DOM.btnCalculos.classList.remove("active");
      }, 800);
    });
  }

  LimpiarDatos() {
    this.DOM.limpiar();
    this.info.clearLog();
    this.info.clearCalculos();
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
    for (let i = 1; i <= this.nroVariables; i++) {
      this.coeficientesZ.push(this.DOM.getValor("X" + i));
    }
    

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
    this.info.log(this.usaMetodoM ? "Se debe usar el método de la M (No todas las limitaciones son '<=')" : "Se puede resolver con Simplex estándar (Todas las limitaciones son '<=')");
    this.mostrarInfo("Consideraciones previas:", this.info.getLog());
  }

  formarMatriz() {
    for (let i = 0; i < this.coeficientesZ.length; i++) {
      this.cantCoeficientes++;
      this.incognitasZ.push("x" + this.cantCoeficientes);
    }
    // Se muestra funcion Z dependiendo de si el obj es Max o Min (antes de alterarla)
    let cadena = this.objetivoEsMax ? "Z = " : "- Z = ";    
    for (let i = 0; i < this.coeficientesZ.length; i++) {
      const signo = this.coeficientesZ[i] < 0 ? " - " : " + ";
      const valor = Math.abs(this.coeficientesZ[i]);
      cadena += `${signo} ${valor}${this.incognitasZ[i]}`;
    }
    this.info.log("Función Z:");
    this.info.log(cadena);
    this.info.log("--------------------------------------");
    this.info.log("Variables:");
    // Extraccion de terminos independientes
    this.TI.push(...this.coeficientesL.map((r) => r.pop()));
    this.agregarVariablesEspeciales();
    this.mostrarInfo("Situación inicial:", this.info.getLog());
    this.base = [...this.baseOriginal];

    // Se iguala funcion Z a 0
    this.coeficientesZ = Utils.invertirValoresDeArreglo(this.coeficientesZ);
    this.coeficientesZ.push(this.TI[0]);

    // Si usa metodo de la M se convierten los coeficientes de funcion Z en polinomios para trabajarlos mas adelante
    if (this.usaMetodoM) this.coeficientesZ = Polinomio.CovertirEnArrayDePolinomios(this.coeficientesZ);
    this.completarFilas();
    this.matriz.push(this.coeficientesZ, ...this.coeficientesL);
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
    let TI = this.matriz[0][this.matriz[0].length - 1];
    funcion += " = ";
    funcion += TI instanceof Polinomio ? TI.toString() : TI;
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
          this.agregarNuevaVariable(i, "R", "artificial", new Polinomio(0, -1));
          break;
        case 1:
          // >= (Se agrega variable de superavit y variable artificial)
          this.agregarNuevaVariable(i, "s", "de exceso", 0);
          this.cantCoeficientes++;
          this.agregarNuevaVariable(i, "R", "artificial", new Polinomio(0, -1));
          break;
      }
    }
  }

  agregarNuevaVariable(fila, nombre, tipo, coeficienteEnZ) {
    this.incognitasZ.push(nombre + this.cantCoeficientes);
    this.coeficientesL[fila][this.cantCoeficientes - 1] = nombre === "s" ? -1 : 1;
    this.coeficientesZ.push(coeficienteEnZ);
    if (nombre !== "s") this.baseOriginal.push(nombre + this.cantCoeficientes);
    this.info.log(`# Se agrega variable ${tipo} "${nombre}${this.cantCoeficientes}" (${fila + 1}° limitación).`);
  }

  completarFilas() {
    // Se completan las filas con 0's y se adecua la funcion objetivo de ser necesario
    for (let i = 0; i < this.coeficientesL.length; i++) {
      this.llenarFila(this.coeficientesL[i]);
      this.coeficientesL[i].push(this.TI[i + 1]);
      if (this.comparadores[i] < 0) continue;
      this.info.log("Se debe adecuar función objetivo debido a " + (i + 1) + "° limitación:");
      this.adecuarFuncionObjetivo(this.coeficientesL[i]);
      this.mostrarInfo("Adecuación de función objetivo", this.info.getLog());
    }
  }

  llenarFila(fila) {
    fila.length = this.cantCoeficientes;
    for (let i = 0; i < fila.length; i++) {
      if (!(i in fila)) fila[i] = 0;
    }
  }

  adecuarFuncionObjetivo(arr) {
    for (let i = 0; i < arr.length; i++) {
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
    let menorCoeficienteM = Infinity;
    let posMenorM;
    let menorConstante = Infinity;
    let posMenorCte;
    for (let i = 0; i < this.matriz[0].length - 1; i++) {
        const elem = this.matriz[0][i];
        if (elem instanceof Polinomio) {
          if (elem.m < menorCoeficienteM) {
            menorCoeficienteM = elem.m;
            posMenorM = i;
          } 
          else if (elem.m == menorCoeficienteM && elem.c < this.matriz[0][posMenorM].c) {
            posMenorM = i;
          }
        } else {
          if (elem < menorConstante) {
            menorConstante = elem;
            posMenorCte = i;
          }
        }
    }
    if (menorCoeficienteM < 0) {
      return posMenorM;
    } 
    else if (menorConstante < 0) {
      return posMenorCte;
    }
    else return null;
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
      // Si hay empate se prefiere dar salida a variable artificial
      if (cociente < menor || (cociente == menor && this.base[fila].includes("R"))) {
        menor = cociente;
        indice = fila;
      }
    }
    return indice;
  }

  calcular() {
    this.iteraciones++;
    this.info.calculosAuxiliares("====== Iteración " + this.iteraciones + " ======");
    const colVarEntrante = this.obtenerVariableEntrante();
    const filaVarSaliente = this.obtenerVariableSaliente(colVarEntrante);
    this.info.log(`Entra a la base ${this.incognitasZ[colVarEntrante]} y sale ${this.base[filaVarSaliente]}.`);
    this.base[filaVarSaliente] = this.incognitasZ[colVarEntrante];
    let nuevaMatriz = [...this.matriz];
    const valorBase = nuevaMatriz[filaVarSaliente][colVarEntrante];
    const filaBase = nuevaMatriz[filaVarSaliente];
    const longitudFila = nuevaMatriz[0].length;
    this.info.calculosAuxiliares(`Fila pivote: ${filaVarSaliente}`);
    this.info.calculosAuxiliares(`${filaBase.map(n => Utils.convertirEnString(n) + "/" + Utils.convertirEnString(valorBase)).join(", ")}`);
    for (let i = 0; i < longitudFila; i++) {
      filaBase[i] /= valorBase;
    }
    this.info.calculosAuxiliares(`${filaBase.map(n => Utils.convertirEnString(n)).join(", ")}`);
    const colPivote = this.obtenerColPivote(filaVarSaliente);
    for (let i = 0; i < this.matriz.length; i++) {
      if (i == filaVarSaliente) continue;
      this.info.calculosAuxiliares(" -- fila " + i + ":");
      const valorBase = this.matriz[i][colPivote];
      for (let j = 0; j < longitudFila; j++) {
        const valorInicialDeCelda = Utils.convertirEnString(nuevaMatriz[i][j]);
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
        const terminos = [filaBase[j], valorBase, nuevaMatriz[i][j]].map(n => Utils.convertirEnString(n));
        this.info.calculosAuxiliares(`\t${terminos[0]} x (-1)(${terminos[1]}) + ${valorInicialDeCelda} = ${terminos[2]}`);
      }
    }
    this.matriz = [...nuevaMatriz];
    if (this.obtenerVariableEntrante() != null) {
      nuevaMatriz = [];
      // Mostrar resultado parcial
      this.mostrarEstadoActual("Iteración " + this.iteraciones, this.info.getLog());
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
      this.DOM.mostrarCalculos(this.info.getCalculos());
    }
  }

  obtenerColPivote(fila) {
    return this.incognitasZ.indexOf(this.base[fila]);
  }

  mostrarEstadoActual(titulo, info) {
    if (!info) info = [];
    this.DOM.crearSlide(titulo, info, this.matriz, ["Base", ...this.incognitasZ, "T.I"], this.base);
    this.info.clearLog();
  }

  mostrarInfo(titulo, info) {
    this.DOM.crearSlideInformativa(titulo, info);
    this.info.clearLog();
  }

  crearDescripcion() {
    let cadena = "Con ";
    for (let i = 0; i < this.nroVariables; i++) {
      const valor = this.resultado["x" + (i + 1)];
      if (valor && valor != 0) {
        cadena += Utils.redondearNum(valor) + " x" + (i + 1) + ", ";
      }
    }
    cadena += "se obtuvo un Z de " + Utils.redondearNum(this.resultado["Z"]);
    return cadena;
  }

  validarDatos() {
    let valid = true;
    let error = "";

    for (let i = 0 ; i < this.nroVariables; i++) {
      const varN = this.DOM.getValor("X" + (i + 1));
      if (!(varN && Number(varN))) {
        error += "- Valores en función Z deben ser numéricos.\n";
        valid = false;
        break;
      }
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
