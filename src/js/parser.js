"use strict";

class Parser {
  constructor(array) {
    this.array  = array;
    this.group  = [];
    this.hashes = [];
    this.hash   = "";
    this.bountyKillersData = {
      "header": {
        "title": "",
        "subtitle": ""
      },
      "nav": [],
      "killers": []
    };
    this.init();
  }

  init() {
    this.parseArray(this.array);
  }

  parseArray(array) {
    let self = this,
        checkRender = function() {
          if (self.group.length > 1) {
            self.renderAsGroup(self.group);
          } else {
            if (self.group.length == 1) {
              self.renderAsSingle(self.group);
            }
          }

          self.group = [];
        };

    array.forEach(function(item, index, array) {
      let unused_strings = /Первая строка|Вторая строка|Код для заказа/i;

      if ( unused_strings.test(item[0]) ) { return false; }

      if (item.length == 0) {
        checkRender();
      } else if (item.length == 1) {
        checkRender();

        if (array[index - 1] && array[index - 1].length == 1) {
          self.parseAsCondition(item);
        } else {
          self.parseAsTitle(item);
        }
      } else if (array[index - 1]) {
        if (self.is_oneGroup(array[index - 1], array[index])) {
          self.group.push(item);

          if (index == (array.length - 1)) { // если мы на последней строке
            self.renderAsGroup(self.group);
          }
        } else {
          checkRender();
          self.group.push(item);

          if (index == (array.length - 1)) { // если мы на последней строке
            self.renderAsSingle(self.group);
          }
        }
      }
    });

    // if we remain nav empty there will be some error during server parsing
    // and it won't show any goods
    // => remove "nav" key if there's only one tab
    if (this.bountyKillersData["nav"].length < 2) {
      delete this.bountyKillersData["nav"];
    }

    this.prepareFile();
    console.log(this.bountyKillersData);
  }

  parseAsCondition(item) {
    const SPACE   = 2; // 2 = symbol + space
    let title     = item[0],
        condition = "";

    condition = title.search( /!/i );
    condition = title.slice(condition + SPACE);
    this.bountyKillersData["killers"][this.currentTab()]["condition"] = condition;
  }

  parseAsTitle(item) {
    const SPACE               = 2; // symbol + space
    let text                  = item[0],
        tab_name_end_position = text.search( /:/i ),
        tab_name              = (~tab_name_end_position) ? text.slice(0, tab_name_end_position) : "",
        title                 = "",
        condition             = "";

    if (tab_name_end_position > 0) {
      text = text.slice(tab_name_end_position + SPACE);
    }

    let title_end_position = text.search( /\.|!/i );

    // есть символ '.' или '!', и он не последний символ строки
    if (title_end_position > 0 && title_end_position != (text.length - 1)) {
      title = text.slice(0, title_end_position + SPACE/2);
      condition = text.slice(title_end_position + SPACE);
    } else {
      title = text;
    }

    switch(tab_name) {
      case "Макияж":
      case "Все для макияжа":
        this.hash = "makeup";
        break;
      case "Ароматы":
        this.hash = "fragrance";
        break;
      case "Уход":
      case "Уход за телом и лицом":
        this.hash = "care";
        break;
      case "Уход за лицом":
      case "Средства по уходу за лицом":
        this.hash = "face";
        break;
      case "Мода и стиль":
        this.hash = "style";
        break;
      case "Мастера Бижутерии":
        this.hash = "jewelery";
        break;
      default:
        this.hash = this.addDefaultHash(tab_name);
        break;
    }

    if (~this.currentTab()) {
      this.addSubsection(title, condition);
      return false;
    }

    this.hashes.push(this.hash);

    let new_section = {
      "lines": [
        {
          "title": title,
          "condition": condition,
          "offers": []
        }
      ],
      "condition": ""
    };
    let new_tab = {
      "navText": tab_name,
      "navHash": this.hash
    };

    this.bountyKillersData["nav"].push(new_tab);
    this.bountyKillersData["killers"].push(new_section);
  }

  addSubsection(title, condition) {
    let new_subsection = {
      "title": title,
      "condition": condition,
      "offers": []
    };

    this.bountyKillersData["killers"][this.currentTab()]["lines"].push(new_subsection);
  }

  is_oneGroup(item_prev, item) {
    return item_prev[1] == item[1]; // checking profile code
  }

  renderAsGroup(group) {
    let item_rendering  = group[0],
        item_type       = String(item_rendering[5]).trim().toLowerCase() || "",
        title           = "",
        chosenTitle     = "";

    switch(item_type) {
      case "цвет":
      case "оттенок":
        item_type   = "colors";
        title       = "Оттенки";
        chosenTitle = "Выбранный оттенок";
        break;
      case "размер":
        item_type   = "sizes";
        title       = "Размеры";
        chosenTitle = "Выбранный размер";
      break;
      case "состав набора":
        item_type   = "set";
        title       = "Состав набора";
      break;
    }

    let item_title_bold   = item_rendering[3]  || "",
        item_description  = item_rendering[4]  || "",
        item_price_old    = item_rendering[8]  || "",
        item_price_actual = item_rendering[10] || "",
        item_note         = item_rendering[11] || "",
        item_label        = item_rendering[12] || "",
        item_note_info    = item_rendering[15] || "";

    (item_price_old)      ? item_price_old    += "₽" : "";
    (item_price_actual)   ? item_price_actual += "₽" : "";
    (item_note_info)      ? item_note_info     = (String(item_note).trim() + ' ' + String(item_note_info).trim()) : "";

    let item_list = {
      "label": String(item_label).trim(),
      "boldTitle": String(item_title_bold).trim(),
      "description": String(item_description).trim(),
      "ln": [],
      "price": {
          "actualCostRub": String(item_price_actual).trim() + String(item_note).trim(),
          "oldCostRub": String(item_price_old).trim()
      },
      "variantsType": item_type,
      "variants": {
          "title": title,
          "chosenTitle": chosenTitle,
          "variantsText": []
      },
      "note": item_note_info
    };

    group.forEach(function(item) {
      let variants_text = item[6] || "";

      item_list["ln"].push(String(item[0]).trim());
      item_list["variants"]["variantsText"].push(String(variants_text).trim());
    });

    let lines_array = this.bountyKillersData["killers"][this.currentTab()]["lines"];
    lines_array[lines_array.length - 1]["offers"].push(item_list);
  }

  renderAsSingle(group) {
    let item_rendering = group[0];

    if (item_rendering.length < 1) { return false; }

    let item_type = item_rendering[5];

    if (item_type) {
      this.renderAsGroup(group);
      return false;
    }

    let item_ln           = item_rendering[0]  || "",
        item_title_bold   = item_rendering[3]  || "",
        item_description  = item_rendering[4]  || "",
        item_price_old    = item_rendering[8]  || "",
        item_price_actual = item_rendering[10] || "",
        item_note         = item_rendering[11] || "",
        item_label        = item_rendering[12] || "",
        item_note_info    = item_rendering[15] || "";

    (item_price_old)      ? item_price_old    += "₽" : "";
    (item_price_actual)   ? item_price_actual += "₽" : "";
    (item_note_info)      ? item_note_info     = (String(item_note).trim() + ' ' + String(item_note_info).trim()) : "";

    let item_single = {
      "label": String(item_label).trim(),
      "boldTitle": String(item_title_bold).trim(),
      "description": String(item_description).trim(),
      "ln": String(item_ln).trim(),
      "price": {
        "actualCostRub": String(item_price_actual).trim() + String(item_note).trim(),
        "oldCostRub": String(item_price_old).trim()
      },
      "note": item_note_info
    };

    let lines_array = this.bountyKillersData["killers"][this.currentTab()]["lines"];
    lines_array[lines_array.length - 1]["offers"].push(item_single);
  }

  currentTab() {
    return this.hashes.indexOf(this.hash);
  }

  addDefaultHash(tab_name) {
    let hash    = "goods",
        digit   = 0,
        result  = this.bountyKillersData["nav"].find(function(item) {
          return item["navText"] == tab_name;
        });

    if (result) { return result["navHash"]; }

    this.hashes.forEach(function(item) {
      if (~item.indexOf('goods')) {
        digit += 1;
      }
    });

    if (digit) {
      hash += '_' + digit;
    }

    return hash;
  }

  prepareFile() {
    let file_data = "";

    file_data += "\"use strict\";\n\n";
    file_data += "var bountyKillersData = ";
    file_data += JSON.stringify(this.bountyKillersData, null, '\t');
    this.download(file_data, 'products.js', 'text/plain');
  }

  download(data, filename, type) {
    var file = new Blob([data], {type: type});

    if (window.navigator.msSaveOrOpenBlob) { // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
      var a = document.createElement("a"),
          url = URL.createObjectURL(file);

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }
}

export default Parser;
