function aumentar(){
	$('.btn-socket').click(function(){
        var valor = $(".ultimo").text();
        let numero = valor.substring(0, 3);
        let texto = valor.substring(3)
        let numero1 = parseInt(numero);
        numero1 = numero1 +1;
        numero_texto = numero1.toString();
        $(".ultimo").empty();
        $(".ultimo").append(numero_texto+ texto);
    });
}



$(window).load(function() {
 	aumentar();
});