//global vars           
var map;
var geocoder;
var photoInfoBox;
var searchDate = 0;

//managing markers
google.maps.Map.prototype.markers = new Array();

google.maps.Map.prototype.getMarkers = function () {
    return this.markers
};

google.maps.Map.prototype.clearMarkers = function () {
    for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
    }
    this.markers = new Array();
};

google.maps.Marker.prototype._setMap = google.maps.Marker.prototype.setMap;

google.maps.Marker.prototype.setMap = function (map) {
    if (map) {
        map.markers[map.markers.length] = this;
    }
    this._setMap(map);
}


$(window).load(function () {
    //Start gmaps
    geocoder = new google.maps.Geocoder();

    var latlng = new google.maps.LatLng(-27.471011, 153.023449);
    var settings = {
        zoom: 12,
        center: latlng,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        navigationControl: true,
        navigationControlOptions: {
            style: google.maps.NavigationControlStyle.SMALL
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("map_canvas"), settings);


    // action that occurs when the 'Search' button is clicked
    //$("#searchbtn").bind("click", function() {
});

function PerformSearch(searchValue) {

    //if input is -3, use previous year to perform area search
    if (searchValue != -3)
        searchDate = searchValue;

    //Search parameters
    var apiKey = "71lcag6a17k5r6a7";

    //var searchTerm = $("#searchTerm").val();
    var searchTerm = "brisbane floods";
    var sortBy = "relevance";

    if (searchValue == -3)
        searchTerm += " " + $('#tb_area').val();

    //If searchDate is -2, a manual search is performed, so get values from textboxes
    var minYear, maxYear;
    if (searchDate != -2) {
        minYear = JSON.stringify(searchDate - 1);
        maxYear = JSON.stringify(searchDate + 2);
    } else {
        minYear = $('#tb_minYear').val();
        maxYear = $('#tb_maxYear').val();
    }
    console.log(minYear + "," + maxYear);

    // Search newspaper articles
    var searchZone = "newspaper";
    var articleURL = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&encoding=json&zone=" + searchZone + "&sortby=" + sortBy + "&q=" + searchTerm + " date:[" + minYear + " TO " + maxYear + "]" + "&callback=?";

    // Get the article results as JSON and display
    $.getJSON(articleURL, function (data) {

        //Clear articles div
        $('#articles').empty();

        if (data.response.zone[0].records.article) {
            $.each(data.response.zone[0].records.article, getArticleText);
        }
    });


    //Search pictures
    var searchZone = "picture";
    var maxPictures = 100;

    var pictureURL = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&include=workversions&encoding=json&zone=" + searchZone + "&sortby=" + sortBy + "&n=" + maxPictures + "&q=" + searchTerm + " date:[" + minYear + " TO " + maxYear + "]" + "&callback=?";

    // Get the picture results
    $.getJSON(pictureURL, function (data) {

        //remove existing markers and close infobox
        map.clearMarkers();
        if (photoInfoBox) photoInfoBox.close();

        if (data.response.zone[0].records.work) {
            $.each(data.response.zone[0].records.work, getPictureInfo);
        }
    });
}


function getArticleText(index, item) {

    $('#articles').append("<p><h3>" + item.heading + "</h3>" +
        "<h4><a href='" + item.troveUrl + "' target='_blank'>" + item.title.value + "</a></h4>" + item.snippet +
        "</p><hr width='40%' align='center'/>");
}

function getPictureInfo(index, item) {

    var un = "record doesn't exist"; //stores location from 'coverage' tag
    var loc = false; //stores whether location tag 'coverage' exists

    //check if 'coverage' tag exists
    if (typeof item.version[0].record[0] === 'object') {
        if (typeof item.version[0].record[0].metadata === 'object') {
            if (typeof item.version[0].record[0].metadata.dc === 'object') {
                if (typeof item.version[0].record[0].metadata.dc.coverage === 'string') {
                    un = item.version[0].record[0].metadata.dc.coverage;
                    loc = true;
                }
            }
        }
    }

    //$('#timeline').append("<a href='" + item.troveUrl + "'>" + item.title + "</a>" + "  -  " + un + "<br />");

    //if location exists, get lat/long coords from it
    if (loc) {

        //check if it contains lat/long
        var point = un.match(/-?\d+\.\d+/g);

        if (typeof point === 'object') { //doesn't seem to do anything?

            var lat = parseFloat(point[0]);
            var lng = parseFloat(point[1]);


            //add marker
            var photoPos = new google.maps.LatLng(lat, lng);

            var photoMarker = new google.maps.Marker({
                position: photoPos,
                map: map,
                title: item.title
            });

            google.maps.event.addListener(photoMarker, 'click', function () {

                //close existing infobox
                if (photoInfoBox) photoInfoBox.close();

                //set content

                //check if thumbnail exists, and if so get URL
                var thumburl;
                for (var i = 0; i < item.identifier.length; i++) {
                    if (typeof item.identifier[i].linktype === 'string') {
                        if (item.identifier[i].linktype == 'thumbnail') {
                            thumburl = item.identifier[i].value;
                        }
                    }
                }

                //photo description
                var snippet = "";
                if (typeof item.snippet === 'string') snippet = item.snippet;

                //infobox HTML
                var info = "<div class='mapinfobox'><p><a href='" + item.identifier[0].value + "' target='_blank'><img src='" + thumburl + "' alt='blah'></a><a href='" + item.troveUrl + "' target='_blank'>" + item.title + "</a><br />" + un.replace(/-?\d+\.\d+/g, '') + "<br /></p><p>" + snippet + "</p></div>";


                //create the infobox
                photoInfoBox = new InfoBox({
                    content: info,
                    maxWidth: 150,
                    pixelOffset: new google.maps.Size(-140, 0),
                    zIndex: null,
                    boxStyle: {
                        background: "url('http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/examples/tipbox.gif') no-repeat",
                        opacity: 0.95
                    },
                    closeBoxMargin: "12px 4px 2px 2px",

                });

                photoInfoBox.open(map, photoMarker);
            });
        }

    }

    //otherwise geocode the title
    /*else
    {
        var address = item.title;
        geocoder.geocode( { 'address': address + ', Australia'}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              //map.setCenter(results[0].geometry.location);
              var photoMarker = new google.maps.Marker({
                  map: map,
                  position: results[0].geometry.location,
                  title: item.title
              });

             var photoInfo = new google.maps.InfoWindow( {
                content: "<a href='" + item.troveUrl + "'>" + item.title + "</a>"
            });

            google.maps.event.addListener(photoMarker, 'click', function() {
                photoInfo.open(map,photoMarker);
            });



            } else {
              alert('Geocode was not successful for the following reason: ' + status);
            }

        });
    }*/
}
