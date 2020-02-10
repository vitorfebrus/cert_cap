
var dataHoras;
var totalMinutos;
var totalHorasMes;
var saldoAdp;

var jornadaCertPonto;
var almoco;
var jornadaSap;
var tolerancia;
var semAlmoco;
var horasAbonadas;
var saldoAdpBruto;

const keyLocalStorage = 'dadosCertCap';

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request.action == 'getSource') {

		loadLocalStorage();
		setValues();
		dataHoras = request.source;
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
			var url = tabs[0].url;
			if (dataHoras.length == 0) {
				document.getElementById('alertPanel').style.width = '100%';
			}
		});
		doJob();
	}
});

function doJob() {
	totalMinutos = 0;
	totalHorasMes = 0;
	saldoAdp = 0;
	dataHoras = calcularTolerancia(dataHoras);
	for (i in dataHoras) {
		var date = new Date(dataHoras[i].data);

		if (!isHour(dataHoras[i].horas) || dataHoras[i].horas == '00:00') {

			// faltas
			if (date.getDay() != 0 && date.getDay() != 6 && dataHoras[i].horas != '00:00' && !isFeriado(date)) {
				totalHorasMes += jornadaSap;
			}

			continue;
		}
		// considerar dias sem almoço e fds trabalhados
		if (toMinutes(dataHoras[i].horas) <= toMinutes(semAlmoco + ':00')) {
			if(isFDS(date)) {
				sumHours(toMinutes(dataHoras[i].horas));
			} else {
				totalHorasMes += jornadaCertPonto - almoco;
				sumHours(toMinutes(dataHoras[i].horas));
			}
		} else {
			if(isFDS(date)) {
				sumHours(toMinutes(dataHoras[i].horas) - toMinutes(almoco + ':00'));
			} else {
				totalHorasMes += jornadaCertPonto;
				sumHours(toMinutes(dataHoras[i].horas));
			}
			
		}
	}

	document.getElementById('totalHoras').innerHTML = toHours(totalMinutos);
	computeHours();
}

// calcular o saldo de acordo com o saldo do adp
document.getElementById('btCalcular').addEventListener('click', function() {
	saldoAdpBruto = document.getElementById('saldoAdp').value;

	if (/^\-?\d+\,\d{2}$/.test(saldoAdpBruto)) {
		saldoAdp = saldoAdpToMinutes(saldoAdpBruto);
		getValues();
		setLocalStorage();
		computeHours();
		document.getElementById('aviso').style.display = 'none';
		//document.getElementById("alert").innerHTML = saldoAdp;
	} else {
		document.getElementById('aviso').style.display = 'block';
		setInterval(() => {
			document.getElementById('aviso').style.display = 'none';
		}, 2000);
	}
});

// acao do botao de ajuda
document.getElementById('btnHelp').addEventListener('mouseover', function() {
	document.getElementById('helpPanel').style.display = 'block';
});
document.getElementById('btnHelp').addEventListener('mouseout', function() {
	document.getElementById('helpPanel').style.display = 'none';
});

// acao do botao de config
document.getElementById('btnConfig').addEventListener('click', function() {
	document.getElementById('mySidepanel').style.width = '100%';
});

// acao do botao de fechar as configs
document.getElementById('btnClose').addEventListener('click', function() {
	document.getElementById('mySidepanel').style.width = '0';
	getValues();
	setLocalStorage();
	doJob();
});

// calcula as horas considerando a tolerancia
function calcularTolerancia(dataHoras) {
	var toleranciaAMais = toMinutes(jornadaCertPonto + ':00') + tolerancia;
	var toleranciaAMenos = toMinutes(jornadaCertPonto + ':00') - tolerancia;
	for (i in dataHoras) {
		var minRealizadas = toMinutes(dataHoras[i].horas);
		if (minRealizadas >= toleranciaAMenos && minRealizadas <= toleranciaAMais) {
			dataHoras[i].horas = jornadaCertPonto + ':00';
		}
	}
	return dataHoras;
}

function sumHours(value) {
	totalMinutos += value;
}

// verifica se uma string representa uma hora
function isHour(value) {
	return /^\d+\:\d{2}$/.test(value);
}

// converte uma string representando uma hora para seu valor em minutos
function toMinutes(value) {
	if (isHour(value)) {
		var splits = value.split(':');
		return parseInt(splits[0]) * 60 + parseInt(splits[1]);
	}
}

// converte minutos para horas em formato imprimivel
function toHours(value) {
	var minutes = totalMinutos;
	if (value != undefined) {
		minutes = value;
	}

	if (minutes < 0) {
		var temp = minutes * -1;
		var horas = 0;
		while (temp > 59) {
			horas++;
			temp -= 60;
		}
		return '-' + horas + ':' + (temp < 10 ? '0' + temp : temp);
	} else {
		var horas = 0;
		var temp = minutes;
		while (temp > 59) {
			horas++;
			temp -= 60;
		}
		return horas + ':' + (temp < 10 ? '0' + temp : temp);
	}
}

// faz o calculo das horas
function computeHours() {
	if (saldoAdp == undefined) {
		saldoAdp = 0;
	}
	saldoAdp = saldoAdpToMinutes(saldoAdpBruto);
	var saldoAtual = totalMinutos - toMinutes(totalHorasMes + ':00') + saldoAdp + toMinutes(horasAbonadas);

	var comp = document.getElementById('saldoHoras');
	var stringHoras = toHours(saldoAtual);

	comp.innerHTML = stringHoras;
	//comp.innerHTML = toMinutes(totalHorasMes + ':00');

	if (stringHoras.includes('-')) {
		comp.style.color = 'red';
	} else {
		comp.style.color = '#0F0';
	}
}

// enviar o valor das variaveis para os componentes da tela
function setValues() {
	document.getElementById('jornadaCertPonto').value = jornadaCertPonto;
	document.getElementById('almoco').value = almoco;
	document.getElementById('jornadaSap').value = jornadaSap;
	document.getElementById('tolerancia').value = tolerancia;
	document.getElementById('semAlmoco').value = semAlmoco;
	document.getElementById('horasAbonadas').value = horasAbonadas;
	document.getElementById('saldoAdp').value = saldoAdpBruto;
}

// tras os valores da tela para as variaveis do script
function getValues() {
	jornadaCertPonto = parseInt(document.getElementById('jornadaCertPonto').value);
	almoco = parseInt(document.getElementById('almoco').value);
	tolerancia = parseInt(document.getElementById('tolerancia').value);
	semAlmoco = parseInt(document.getElementById('semAlmoco').value);
	horasAbonadas = document.getElementById('horasAbonadas').value;

	if(isNaN(jornadaCertPonto)) {
		jornadaCertPonto = 9;
	}
	if(isNaN(almoco)) {
		almoco = 1;
	}
	if(isNaN(tolerancia)) {
		tolerancia = 10;
	}
	if(isNaN(semAlmoco)) {
		semAlmoco = 4;
	}
	if(horasAbonadas === '') {
		horasAbonadas = '00:00';
	}

	setValues();
	// trata horas incluídas com segundos HH:mm:ss
	if (horasAbonadas.length == 8) {
		horasAbonadas = horasAbonadas.split(':')[0] + ':' + horasAbonadas.split(':')[1];
	}

	jornadaSap = jornadaCertPonto - almoco;
	document.getElementById('jornadaSap').value = jornadaSap;
}

// converte o saldo do adp para minutos
function saldoAdpToMinutes(saldoAdp) {
	var splits = saldoAdp.split(',');

	if (saldoAdp.includes('-')) {
		var horas = splits[0].replace('-', '');
		var minutos = Math.floor((parseInt(splits[1]) / 10) * 6);
		return toMinutes(horas + ':' + (minutos < 10 ? '0' + minutos : minutos));
	} else {
		var horas = splits[0];
		var minutos = Math.floor((parseInt(splits[1]) / 10) * 6);
		return toMinutes(horas + ':' + (minutos < 10 ? '0' + minutos : minutos));
	}
}

// acao de clicar no btn de resetar as configs
document.getElementById('resetBtn').addEventListener('click', function() {
	jornadaCertPonto = 9;
	almoco = 1;
	jornadaSap = 8;
	tolerancia = 10;
	semAlmoco = 4;
	horasAbonadas = '00:00';
	saldoAdpBruto = '0,00';
	localStorage.removeItem(keyLocalStorage);
	document.getElementById('alertReset').style.display = 'block';
	setValues();
	setTimeout(() => {
		document.getElementById('alertReset').style.display = 'none';
	}, 2000);
});

// retorna true se uma determinada data for feriado
function isFeriado(date) {
	// natal
	if (date.getDate() == 25 && date.getMonth() == 11) {
		return true;
	}

	// proclamacao da republica
	if (date.getDate() == 15 && date.getMonth() == 10) {
		return true;
	}

	// ano novo
	if (date.getDate() == 1 && date.getMonth() == 0) {
		return true;
	}

	// finados
	if (date.getDate() == 2 && date.getMonth() == 10) {
		return true;
	}

	// nossa senhora aparecida
	if (date.getDate() == 12 && date.getMonth() == 9) {
		return true;
	}

	// independencia do brasil
	if (date.getDate() == 7 && date.getMonth() == 8) {
		return true;
	}

	// sao joao
	if (date.getDate() == 24 && date.getMonth() == 5) {
		return true;
	}

	// dia do trabalhador
	if (date.getDate() == 1 && date.getMonth() == 4) {
		return true;
	}

	return false;
}

function isFDS(date) {
	return date.getDay() == 0 || date.getDay() == 6;
}

// guarda os dados no localstorage
function setLocalStorage() {
	var dados = {
		jornadaCertPonto: jornadaCertPonto,
		almoco: almoco,
		jornadaSap: jornadaSap,
		tolerancia: tolerancia,
		semAlmoco: semAlmoco,
		horasAbonadas: horasAbonadas,
		saldoAdpBruto: saldoAdpBruto,
	};

	localStorage.setItem(keyLocalStorage, JSON.stringify(dados));
}

// recupera os dados do localstorage
function loadLocalStorage() {
	var dados = localStorage.getItem(keyLocalStorage);
	dados = JSON.parse(dados);

	if (dados == undefined) {
		jornadaCertPonto = 9;
		almoco = 1;
		jornadaSap = 8;
		tolerancia = 10;
		semAlmoco = 4;
		horasAbonadas = '00:00';
		saldoAdpBruto = '0,00';
	} else {
		jornadaCertPonto = dados.jornadaCertPonto;
		almoco = dados.almoco;
		jornadaSap = dados.jornadaSap;
		tolerancia = dados.tolerancia;
		semAlmoco = dados.semAlmoco;
		horasAbonadas = dados.horasAbonadas;
		saldoAdpBruto = dados.saldoAdpBruto;
	}
}

// injeta o script para recuperar o html da pagina aberta
function onWindowLoad() {
	chrome.tabs.executeScript(
		null,
		{
			file: 'js/getPagesSource.js',
		},
		function() {
			
			if (chrome.runtime.lastError) {
				console.log('Error!');
			}
		}
	);
}

window.onload = onWindowLoad;
