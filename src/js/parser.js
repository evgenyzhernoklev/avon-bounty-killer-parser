"use strict";

class Parser {
  constructor(array) {
    this.array = array;
    this.bountyKillersData = {
      "header": {
        "title": "",
        "subtitle": ""
      },
      "nav": [],
      "killers": []
    };
    this.current_tab = -1;
    this.group = [];
    this.hashes = [];
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
    const SPACE = 2; // 2 = symbol + space
    let title = item[0],
        condition = "";

    condition = title.search( /!/i );
    condition = title.slice(condition + SPACE);
    this.bountyKillersData["killers"][this.current_tab]["condition"] = condition;
  }

  parseAsTitle(item) {
    const SPACE = 2; // symbol + space
    let text = item[0],
        hash = "",
        tab_name_end_position = text.search( /:/i ),
        tab_name = text.slice(0, tab_name_end_position),
        title = "",
        condition = "";

    if (tab_name_end_position > 0) {
      text = text.slice(tab_name_end_position + SPACE);
    }

    let title_end_position = text.search( /\./i );

    // есть точка, и она не последний символ строки
    if (title_end_position > 0 && title_end_position != (text.length - 1)) {
      title = text.slice(0, title_end_position + SPACE/2);
      condition = text.slice(title_end_position + SPACE);
    } else {
      title = text;
    }

    switch(tab_name) {
      case "Макияж":
      case "Все для макияжа":
        hash = "makeup";
        break;
      case "Ароматы":
        hash = "fragrance";
        break;
      case "Уход":
        hash = "care";
        break;
      case "Уход за лицом":
      case "Средства по уходу за лицом":
      case "Уход за телом и лицом":
        hash = "face";
        break;
      case "Мода и стиль":
        hash = "style";
        break;
      case "Мастера Бижутерии":
        hash = "jewelery";
        break;
      default:
        hash = "goods"
        break;
    }

    if ( ~this.hashes.indexOf(hash) ) {
      this.addSubsection(title, condition);
      return false;
    }

    this.hashes.push(hash);

    let new_section = {
      "lines": [
        {
          "title": title,
          "condition": condition,
          "rows": 3,
          "offers": []
        }
      ],
      "condition": ""
    };
    let new_tab = {
      "navText": tab_name,
      "navHash": hash
    };

    this.bountyKillersData["nav"].push(new_tab);
    this.bountyKillersData["killers"].push(new_section);
    this.current_tab += 1;
  }

  addSubsection(title, condition) {
    let new_subsection = {
      "title": title,
      "condition": condition,
      "rows": 3,
      "offers": []
    };

    this.bountyKillersData["killers"][this.current_tab]["lines"].push(new_subsection);
  }

  is_oneGroup(item_prev, item) {
    return item_prev[1] == item[1]; // checkig profile code
  }

  renderAsGroup(group) {
    let item_rendering = group[0],
        item_type = item_rendering[6],
        title = "",
        chosenTitle = "";

    if ( item_type.search(/\d/) != -1 ) {
      item_type = "sizes";
    } else {
      item_type = "colors";
    }

    switch(item_type) {
      case "sizes":
        title = "Размеры";
        chosenTitle = "Выбранный размер";
        break;
      case "colors":
        title = "Оттенки";
        chosenTitle = "Выбранный оттенок";
        break;
    }

    let item_list = {
      "ln": [],
      "price": {
          "actualCostRub": item_rendering[10],
          "oldCostRub": item_rendering[8]
      },
      "variantsType": item_type,
      "variants": {
          "title": title,
          "chosenTitle": chosenTitle,
          "variantsText": []
      },
      "description": item_rendering[4] || "",
      "label": item_rendering[12],
      "boldTitle": item_rendering[3] || ""
    };

    group.forEach(function(item, index, group) {
      item_list["ln"].push(item[0]);
      item_list["variants"]["variantsText"].push(item[6]);
    });

    let lines_array = this.bountyKillersData["killers"][this.current_tab]["lines"];
    lines_array[lines_array.length - 1]["offers"].push(item_list);
  }

  renderAsSingle(group) {
    let item_rendering = group[0];

    if (item_rendering.length < 1) { return false; }

    let item_type = item_rendering[6];

    if (item_type) {
      this.renderAsGroup(group);
      return false;
    }

    let item_single = {
      "price": {
        "actualCostRub": item_rendering[10],
        "oldCostRub": item_rendering[8]
      },
      "description": item_rendering[4] || "",
      "ln": item_rendering[0],
      "label": item_rendering[12],
      "boldTitle": item_rendering[3] || ""
    };
    let lines_array = this.bountyKillersData["killers"][this.current_tab]["lines"];
    lines_array[lines_array.length - 1]["offers"].push(item_single);
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
