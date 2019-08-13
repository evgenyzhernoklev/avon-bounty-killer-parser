"use strict";

import XLSX   from "xlsx";
import Parser from "./parser.js";

let form  = document.body.querySelector('.form'),
    field = form.querySelector('.form__field');

function to_json(workbook) {
  var result = {};

  workbook.SheetNames.forEach(function(sheetName) {
    var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
    if (roa.length) result[sheetName] = roa;
  });
  return JSON.stringify(result, 2, 2);
};

function handleFile(e) {
  var files = e.target.files, f = files[0],
      reader = new FileReader();

  reader.onload = function(e) {
    var data = new Uint8Array(e.target.result),
        workbook = XLSX.read(data, {type: 'array'});

    /* DO SOMETHING WITH workbook HERE */
    let json = to_json(workbook),
        obj_list = JSON.parse(json);

    for (let key in obj_list) {
      new Parser(obj_list[key]);
    }
  };
  reader.readAsArrayBuffer(f);
}

field.addEventListener('change', handleFile, false);
