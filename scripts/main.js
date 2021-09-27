/** namespace. */
var rhit = rhit || {};


rhit.main = function () {
	document.querySelector("#emailMe").onclick = (event) => {
		window.open('mailto:duffdl@rose-hulman.edu?')
	}

	document.querySelector("#project1img").onmouseover = (event) => {
		document.querySelector("#project1img").setAttribute("src", "images/evolution.gif");
		document.querySelector("#project1img").setAttribute("width", "85%");
	}
	document.querySelector("#project1img").onmouseout = (event) => {
		document.querySelector("#project1img").setAttribute("src", "images/newevolutiondisplay.png");
	}
	
};

rhit.main();
