class ManipuladorDOM {
  constructor() {
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
  }

  start() {
    Array.from(this.inputs).forEach(input => { input.oninput = e => this.autoAdjustInput(e)});
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
    const le = this.crearOpcion("le", "≤"); // less equal
    const eq = this.crearOpcion("eq", "="); // equal
    const ge = this.crearOpcion("ge", "≥"); // greater equal
    select.append(le, eq, ge);
    select.onchange = (e) => console.log(e.target.value);
    return select;
  }

  crearOpcion(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.innerText = text;
    return option;
  }

  autoAdjustInput(e) {
    e.target.style.width = e.target.value.length * 7 + "px"; // 7 es ancho de cada caracter
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
        td.textContent = this.redondearNum(value);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    this.resultado.appendChild(table);
  }

  crearDescripcion(objIncognitas) {
    const { x1, x2, Z } = objIncognitas;
    const nombreX1 = this.nombreX1.value || "";
    const nombreX2 = this.nombreX2.value || "";
    const para = document.createElement("p");
    const text = `Con ${this.redondearNum(x1)} ${nombreX1} y ${this.redondearNum(x2)} ${nombreX2} se obtuvo un Z de ${this.redondearNum(Z)}`;
    para.textContent = text;
    this.resultado.appendChild(para);
  }

  mostrarDetalles(incognitas, iteraciones) {
    const box = document.createElement("div");
    const titulo = document.createElement("h2");
    const texto = document.createElement("p");
    let detalles = "";

    titulo.innerText = "Detalles:";
    detalles += "N° Iteraciones: " + iteraciones;
    for (let key of Object.keys(incognitas)) {
      detalles += `\n${key} = ${this.redondearNum(incognitas[key])}`;
    }
    texto.innerText = detalles;
    box.append(titulo, texto);
    this.resultado.appendChild(box);
  }

  crearDetalles(incognitas, iteraciones) {
    this.crearDescripcion(incognitas);
    this.mostrarDetalles(incognitas, iteraciones);
  }

  redondearNum(num) {
    return num === undefined ? "-" : +num.toFixed(2); // el '+' remueve 0's innecesarios
  }
}
