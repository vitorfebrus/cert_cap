chrome.runtime.sendMessage({
  action: 'getSource',
  source: parseDOM(document)
});

function parseDOM(document_root) {
  var rows = document_root.getElementsByTagName('tr');
  var dataHoras = [];

  for (i in rows) {
    try {

      var date = rows[i].childNodes[6].childNodes[0].childNodes[0].innerHTML;
      var hours = rows[i].childNodes[14].innerHTML;

      if (isDate(date) || isHourField(hours)) {
        var dados = {
          data : formatDate(date),
          horas : hours
        };

        dataHoras.push(dados);
      }
    } catch (error) {
      continue;
    }
  }
  console.log(dataHoras);
  
  return dataHoras;
}

function isHourField(value) {
  return /(^\d{2}\:\d{2}$)|(^\-{4}$)/.test(value);
}

function isDate(value) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(value);
}

function formatDate(dateString) {
  var splits = dateString.split("/");
  return new Date(splits[2], parseInt(splits[1]) - 1, splits[0]);
}
