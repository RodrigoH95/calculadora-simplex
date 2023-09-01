class ManipuladorDOM {
  constructor() {
    this.objetivo = document.getElementById("objetivo");
    this.limitacionesContainer = document.getElementById("limitaciones");
    this.contenedorLateral = document.getElementById("aux");
    this.calculosContainer = document.getElementById("calculos");
    this.varContainer = document.getElementById("varContainer");
    this.btnAgregarVar = document.getElementById("btnAgregarVar");
    this.btnEliminarVar = document.getElementById("btnEliminarVar");
    this.btnAgregarLimit = document.getElementById("btnAgregarLimit");
    this.btnEliminarLimit = document.getElementById("btnEliminarLimit");
    this.btnCalcular = document.getElementById("btnCalcular");
    this.btnCalculos = document.getElementById("btn-calculos");
    // this.valueX1 = document.getElementById("valueX1");
    // this.valueX2 = document.getElementById("valueX2");
    this.root = document.getElementById("resultado");
    this.inputs = document.getElementsByClassName("input");
    this.slidesManager = new SlideManager();
  }

  start() {
    this.slidesManager.start();
    Array.from(this.inputs).forEach(input => { input.oninput = e => this.autoAdjustInput(e)});

    // this.btnAgregarLimit.addEventListener("click", (e) => {
    //   e.preventDefault();
    //   this.crearInputBox();
    // });

    this.btnEliminarLimit.addEventListener("click", (e) => {
      e.preventDefault();
      if (this.limitacionesContainer.childElementCount <= 0) return;
      this.limitacionesContainer.removeChild(this.limitacionesContainer.lastChild);
    });

    this.btnCalculos.addEventListener("click", () => {
      this.contenedorLateral.classList.toggle("active");
    });
  }

  limpiar() {
    this.calculosContainer.innerHTML = "";
    this.root.innerHTML = "";
    this.slidesManager.reset();
  }

  limpiarLimitaciones() {
    this.limitacionesContainer.innerHTML = "";
  }

  getValor(nombre) {
    // Nombre puede ser X1 o X2
    const elem = document.getElementById("value" + nombre);
    const valor = elem.value
    return Utils.procesarNumero(valor);
  }

  crearVar(num) {
      const box = document.createElement("div");
      box.classList.add("var");
      const span1 = document.createElement("span");
      const input = document.createElement("input");
      const span2 = document.createElement("span");
      const sub = document.createElement("sub");
      // Propiedades del input
      input.classList.add("input", "value");
      const nombre = "valueX" + num;
      input.name = nombre;
      input.id = nombre;
      input.value = "1";
      input.autocomplete = "off";

      span1.innerText = " + ";
      span2.innerText = "x";
      sub.innerText = num;

      span2.appendChild(sub);
      box.append(span1, input, span2);

      this.varContainer.appendChild(box);
  }

  borrarVar() {
    this.varContainer.removeChild(this.varContainer.lastChild);
  }

  crearInputBox(cantVariables) {
    const box = this.crearInputGroup(cantVariables);
    this.limitacionesContainer.appendChild(box);
  }

  crearInput() {
    const input = document.createElement("input");
    input.classList.add("limit-value", "value");
    input.oninput = (e) => this.autoAdjustInput(e);
    return input;
  }

  crearInputGroup(cantVariables) {
    const box = document.createElement("div");
    box.classList.add("limite");
    for (let i = 0; i < cantVariables - 1; i++) {
      const input = this.crearInput();
      const text = this.crearTexto(`x${i + 1} + `);
      box.append(input, text);
    }
    // A la ultima variable no se le coloca + a la derecha
    const input = this.crearInput();
    const text = this.crearTexto(`x${cantVariables}`);
    const dropDown = this.crearSelectorComparadores();
    const TI = this.crearInput();
    box.append(input, text, dropDown, TI);
    return box;
  }

  crearSelectorComparadores() {
    const select = document.createElement("select");
    select.classList.add("btn");
    const le = this.crearOpcion("-1", "≤"); // less equal
    const eq = this.crearOpcion("0", "="); // equal
    const ge = this.crearOpcion("1", "≥"); // greater equal
    select.append(le, eq, ge);
    return select;
  }

  crearOpcion(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.innerText = text;
    return option;
  }

  autoAdjustInput(e) {
    e.target.style.width = e.target.value.length * 8 + "px"; // 7 es ancho de cada caracter
  }

  crearTexto(texto) {
    const span = document.createElement("span");
    span.textContent = texto;
    return span;
  }

  crearTabla(matrix, arrNombreColumnas, arrVariablesBase) {
    const datos = {
      encabezado: arrNombreColumnas,
      base: arrVariablesBase,
    };
    const table = document.createElement("table");

    const header = document.createElement("tr");
    for (const item of datos.encabezado) {
      if (item == "Z") continue;
      const th = document.createElement("th");
      th.textContent = item;
      header.appendChild(th);
    }
    table.appendChild(header);

    for (let i = 0; i < matrix.length; i++) {
      const tr = document.createElement("tr");
      const baseCell = document.createElement("td");
      baseCell.textContent = datos.base[i];
      tr.appendChild(baseCell);
      for (const value of matrix[i]) {
        const td = document.createElement("td");
        td.textContent = Utils.redondearNum(value);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }

  crearSlide(titulo, info, matrix, arrNombreColumnas, arrVariablesBase) {
    const tabla = this.crearTabla(matrix, arrNombreColumnas, arrVariablesBase);
    const box = this.crearCaja(titulo, info);
    box.appendChild(tabla);
    this.root.appendChild(box);
    this.slidesManager.addSlide(box);
  }

  crearSlideInformativa(titulo, info) {
    const box = this.crearCaja(titulo, info);
    // Se agrega clase "textBox" al elemento info para centrar la caja de texto ya que no hay tablas
    box.childNodes[1].classList.add("textBox");
    this.root.appendChild(box);
    this.slidesManager.addSlide(box);
  }

  crearCaja(titulo, info) {
    const box = document.createElement("div");
    box.classList.add("contenedor-tabla");
    const h2 = document.createElement("h2");
    h2.innerText = titulo;
    const textBox = document.createElement("div");
    textBox.classList.add("info");
    if (info.length > 0) {
      for (let text of info) {
        const p = document.createElement("p");
        p.innerText = text;
        textBox.appendChild(p);
      }
    }
    box.append(h2, textBox);
    return box;
  }

  mostrarCalculos(arrCalculos) {
    for (let text of arrCalculos) {
      const p = document.createElement("p");
      p.innerText = text;
      this.calculosContainer.appendChild(p);
    }
  }

  obtenerLimitaciones() {
    return Array.from(this.limitacionesContainer.childNodes);
  }

  obtenerCantidadLimitaciones() {
    return this.obtenerLimitaciones().length;
  }

  obtenerObjetivo() {
    // ver index.html -> 1 = max | 0 = min
    return Number(this.objetivo.value);
  }

  // Para extraer los valores de cada INPUT o los comparadores en cada SELECT
  obtenerValoresDeCampo(limitaciones, nombreCampo) {
    return Array.from(limitaciones.childNodes).filter(e => e.tagName === nombreCampo).map(e => Utils.procesarNumero(e.value));
  }
}
