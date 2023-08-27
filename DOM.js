class ManipuladorDOM {
  constructor() {
    this.objetivo = document.getElementById("objetivo");
    this.limitacionesContainer = document.getElementById("limitaciones");
    this.btnAgregarLimit = document.getElementById("btnAgregarLimit");
    this.btnEliminarLimit = document.getElementById("btnEliminarLimit");
    this.btnCalcular = document.getElementById("btnCalcular");
    this.nombreX1 = document.getElementById("x1");
    this.nombreX2 = document.getElementById("x2");
    this.valueX1 = document.getElementById("valueX1");
    this.valueX2 = document.getElementById("valueX2");
    this.resultado = document.getElementById("resultado");
    this.inputs = document.getElementsByClassName("input");
    this.slidesManager = new SlideManager();
  }

  start() {
    this.slidesManager.start();
    Array.from(this.inputs).forEach(input => { input.oninput = e => this.autoAdjustInput(e)});

    this.btnAgregarLimit.addEventListener("click", (e) => {
      e.preventDefault();
      this.crearInputBox();
    });

    this.btnEliminarLimit.addEventListener("click", (e) => {
      e.preventDefault();
      if (this.limitacionesContainer.childElementCount <= 0) return;
      this.limitacionesContainer.removeChild(this.limitacionesContainer.lastChild);
    });
  }

  getValor(nombre) {
    return Utils.procesarNumero(this["value" + nombre].value);
  }

  crearInputBox() {
    const box = this.crearInputGroup();
    this.limitacionesContainer.appendChild(box);
  }

  crearInput(nombreId = "") {
    const input = document.createElement("input");
    input.classList.add("limit-value", "value");
    if (nombreId) input.id = nombreId;
    input.oninput = (e) => this.autoAdjustInput(e);
    return input;
  }

  crearInputGroup() {
    const box = document.createElement("div");
    box.classList.add("limite");
    const input = this.crearInput();
    const text = this.crearTexto("x1 + ");
    const input2 = this.crearInput();
    const text2 = this.crearTexto("x2");
    const dropDown = this.crearSelectorComparadores();
    const input3 = this.crearInput();
    box.append(input, text, input2, text2, dropDown, input3);
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
    const box = document.createElement("div");
    box.classList.add("contenedor-tabla");
    const h2 = document.createElement("h2");
    h2.innerText = titulo;
    const textBox = document.createElement("div");
    textBox.classList.add("info");
    for (let text of info) {
      const p = document.createElement("p");
      p.innerText = text;
      textBox.appendChild(p);
    }
    box.append(h2, textBox, tabla);
    this.resultado.appendChild(box);
    this.slidesManager.addSlide(box);

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
