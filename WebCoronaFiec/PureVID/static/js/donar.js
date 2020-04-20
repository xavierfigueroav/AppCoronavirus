function mostrarEstadisticas(){
    $('#city').click(function(){
        window.open("http://www.losceibos.org.ec/index.php/info-institucional/upc" , "UPC CEIBOS" , "width=780,height=500") ;

    });
}


$(window).load(function() {
    mostrarEstadisticas();
});