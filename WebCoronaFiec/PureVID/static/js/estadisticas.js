function mostrarEstadisticas(){
    $('#city').click(function(){
        $(".row1").empty();
        var valor = $("#province").val();
        let contenedor = $('<div></div>');
        contenedor.attr("class", "col-lg-4");
        let imagen = $('<img></img>');
        imagen.attr("class", "imagen-estaditica");
        imagen.attr("src","../img/estadistica1.png");
        contenedor.append(imagen);
        $(".row1").append(contenedor);
        let contenedor1 = $('<div></div>');
        contenedor1.attr("class", "col-lg-4");
        let imagen1 = $('<img></img>');
        imagen1.attr("class", "imagen-estaditica");
        imagen1.attr("src","../img/estadistica2.png");
        contenedor1.append(imagen1);
        $(".row1").append(contenedor1);
        let contenedor2 = $('<div></div>');
        contenedor2.attr("class", "col-lg-4");
        let imagen2 = $('<img></img>');
        imagen2.attr("class", "imagen-estaditica");
        imagen2.attr("src","../img/estadistica3.jpg");
        contenedor2.append(imagen2);
        $(".row1").append(contenedor2);
    });
}

function cargarTabla(){
    $.getJSON("/helpMapp/data/estadisticas_oficiales.json", function(data) {
        let tabla = $('<table></table>');
        tabla.attr("class", "table table-hover");
        let cabecera = $('<thead></thead>');
        let primera_fila = $('<tr></tr>');
        let nombre = $('<th></th>');
        nombre.append("Nombre");
        let descripcion = $('<th></th>');
        descripcion.append("Descripcion");
        let enlace = $('<th></th>');
        enlace.append("Enlace");
        primera_fila.append(nombre);
        primera_fila.append(descripcion);
        primera_fila.append(enlace);
        cabecera.append(primera_fila);
        tabla.append(cabecera);
        let cuerpo = $('<tbody></tbody>');
        $.each(data["rows"], function(key,val) {
            let texto_nombre = val["nombre"];
            let texto_descripcion = val["descripcion"];
            let texto_url = val["url"];
            let registro = $('<tr></tr>');
            let nombre = $('<th></th>');
            nombre.append(texto_nombre);
            let descripcion = $('<th></th>');
            descripcion.append(texto_descripcion);
            let enlace = $('<th></th>');
            let link = $('<a></a>');
            link.attr("href",texto_url);
            link.append("ir al enlace")
            enlace.append(link);
            registro.append(nombre);
            registro.append(descripcion);
            registro.append(enlace);
            cuerpo.append(registro);
             
        });
        tabla.append(cuerpo);
        $("#tabla").append(tabla);
    });
     
}


$(window).load(function() {
    mostrarEstadisticas();
    cargarTabla();
});



