/** namespace. */
var rhit = rhit || {};


rhit.main = function () {
	document.querySelector("#emailMe").onclick = (event) => {
		window.open('mailto:duffdl@rose-hulman.edu?')
	}

};

function goHome() {
	window.location.href = "https://dillon-duff.github.io/"
}

rhit.main();
