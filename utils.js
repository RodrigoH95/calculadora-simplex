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
    arr = arr.map(e => -e);
  }

  static invertirValoresDeObjeto(obj) {
    Object.keys(obj).forEach(k => {if(obj[k] != 0) obj[k] *= -1});
  }
}