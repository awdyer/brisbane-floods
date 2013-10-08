<!DOCTYPE html>
<html>
<head>
    <title></title>

    <script src="http://code.jquery.com/jquery-1.8.3.js"></script>

    <?php header('Access-Control-Allow-Origin: *'); ?>

    <script>

$(window).load(function () {
    $("#find").on("click", function () {
        console.log($("#tbox").val());
        $.get( $("#tbox").val(), function( data ) {
          $( ".result" ).html( data );
          alert( "Load was performed." );
        });
    });
});


    </script>
</head>
<body>

<div class="input">
    <input id="tbox" type="text">
    <button id="find">Find</button>
</div>

<div class="result"></div>

</body>
</html>