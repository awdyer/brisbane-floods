
//global vars 
var apiKey = "71lcag6a17k5r6a7";
var map, geocoder, geocoder_wait, photoInfoBox;
var geocode_delay = 1000; //500 is just enough as long as user doesn't click 'load more'
var geocode_enabled = false; //set this to disable geocoding while debugging, since daily queries are limited
var prevSearchTermA, prevMinYearA, prevMaxYearA, prevMaxResultsA, prevPageA = 0;
var prevSearchTermP, prevMinYearP, prevMaxYearP, prevMaxResultsP, prevPageP = 0;
var fUseSame = false;

var loadedPics, loadedArts, codedPics;

//map marker management - global
google.maps.Map.prototype.markers = new Array();

google.maps.Map.prototype.getMarkers = function () {
    return this.markers;
};

google.maps.Map.prototype.clearMarkers = function () {
    var i;
    for (i = 0; i < this.markers.length; i++) {
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

    //Set up functions to call when buttons and timeline is clicked
    //Timeline
    $("#tm1893").on("click", function () { newSearch(1893); return false; });
    $("#tm1931").on("click", function () { newSearch(1931); return false; });
    $("#tm1974").on("click", function () { newSearch(1974); return false; });
    $("#tm2011").on("click", function () { newSearch(2011); return false; });
    $("#tm2013").on("click", function () { newSearch(2013); return false; });

    $("#f_submit").on("click", function () { 
        newSearch(-2);
        return false; 
    });

    $("#f_toggle").on("click", function () { toggleDiv("#filters"); return false; });
    $("#a_load").on("click", function () { 
        searchArticles(prevSearchTermA, prevMinYearA, prevMaxYearA, prevMaxResultsA); return false; });
    $("#p_load").on("click", function () { 
        searchPictures(prevSearchTermP, prevMinYearP, prevMaxYearP, prevMaxResultsP); return false; });

    $("#f_usesame").on("click", function() { 
        fUseSame = !fUseSame;
        $("#fp_area").prop('disabled', fUseSame);
        $("#fp_minYear").prop('disabled', fUseSame);
        $("#fp_maxYear").prop('disabled', fUseSame);
        $("#fp_max").prop('disabled', fUseSame);

        if (fUseSame) {
            $("#fa_label").html("Articles/Photos");
            $("#fp_label").html("&nbsp;");
        } else {
            $("#fp_label").html("Photos");
        }
    });

    //Hide advanced options
    toggleDiv("#filters");

    //custom scrollbar
    $("#articles").mCustomScrollbar({
        theme: "dark",
        advanced:{
            updateOnContentResize: true
        }
    });


    //Start google map
    geocoder = new google.maps.Geocoder();

    var latlng = new google.maps.LatLng(-27.471011, 153.023449);
    var settings = {
        zoom: 11,
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


    //If came from startpage, automatically search that year
    var store = new Persist.Store('timeline_year');
    store.get('year_key', function (ok, val) {
        if (ok) {
            console.log('year_key = ' + val);

            if (val != "") {
                newSearch(val);
                store.set('year_key', "");
            }
        }
    });

});


function newSearch(searchYear, searchTerm, minYear, maxYear) {

    //Only searchYear is required

    //Do a new search, clear existing results

    //default value for searchTerm is "brisbane floods"
    searchTerm = (typeof searchTerm === "undefined") ? "brisbane floods" : "brisbane floods " + searchTerm;

    //if searchYear is -2, minYear and maxYear have manually been passed
    if (searchYear != -2) {

        var searchTermA = "brisbane floods";
        var minYearA = searchYear - 1;
        var maxYearA = searchYear + 2;
        var maxResultsA = 30;

        var searchTermP = "brisbane floods";
        var minYearP = searchYear - 1;
        var maxYearP = searchYear + 2;
        var maxResultsP = 100;
    }
    else {
        //Get article filters
        var searchTermA = "brisbane floods " + $("#fa_area").val() + " " + $("#fa_keywords").val();
        if ($("#fa_exclude").val() != "")
            searchTermA += " NOT " + $("#fa_exclude").val();

        var minYearA = $("#fa_minYear").val();
        if (minYearA == "")
            minYearA = "1000";
        
        var maxYearA = $("#fa_maxYear").val();
        if (maxYearA == "")
            maxYearA = "3000";
        
        var maxResultsA = $("#fa_max").val();
        if (maxResultsA == "")
            maxResultsA = "30";

        //Get picture filters
        if (!fUseSame) {
            var searchTermP = "brisbane floods " + $("#fp_area").val();

            var minYearP = $("#fp_minYear").val();
            if (minYearP == "")
                minYearP = "1000";
            
            var maxYearP = $("#fp_maxYear").val();
            if (maxYearP == "")
                maxYearP = "3000";
            
            var maxResultsP = $("#fp_max").val();
            if (maxResultsP == "")
                maxResultsP = "100";
            //note maxResultsP may not actually return this number of images due to geocoding issues
        } else {
            var searchTermP = searchTermA;
            var minYearP = minYearA;
            var maxYearP = maxYearA;
            var maxResultsP = maxResultsA;
        }
    }

    //set history for 'load more'
    prevSearchTermA = searchTermA;
    prevSearchTermP = searchTermP;
    prevMinYearA = minYearA;
    prevMaxYearA = maxYearA;
    prevMinYearP = minYearP;
    prevMaxYearP = maxYearP;
    prevMaxResultsA = maxResultsA;
    prevMaxResultsP = maxResultsP;


    prevPageA = 0;
    prevPageP = 0;
    
    //reset geocoder wait time
    geocoder_wait = 0;

    loadedArts = 0;
    loadedPics = 0;
    codedPics = 0;

    //clear existing results
    $('#articles').empty();
    map.clearMarkers();
    if (photoInfoBox) photoInfoBox.close();

    //search
    searchArticles(searchTermA, minYearA, maxYearA, maxResultsA);
    searchPictures(searchTermP, minYearP, maxYearP, maxResultsP);

}


function searchArticles(searchTerm, minYear, maxYear, maxResults) {

    //Perform article search

    var searchZone = "newspaper";

    var articleURL = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&encoding=json&zone=" + searchZone + "&sortby=relevance&n=" + maxResults + "&q=" + searchTerm + " date:[" + minYear + " TO " + maxYear + "]&s=" + prevPageA + "&callback=?";

    prevPageA += maxResults;

    //Query Trove, process each article returned
    $.getJSON(articleURL, function (data) {

        if (data.response.zone[0].records.article) {
            $.each(data.response.zone[0].records.article, processArticle);
        }
    });

    
}


function searchPictures(searchTerm, minYear, maxYear, maxResults) {

    //Perform picture search
    if (!geocode_enabled) console.log("geocode disabled");

    var searchZone = "picture";

    var pictureURL = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&include=workversions&encoding=json&zone=" + searchZone + "&sortby=relevance&n=" + maxResults + "&q=" + searchTerm + " date:[" + minYear + " TO " + maxYear + "]&s=" + prevPageP + "&callback=?";

    prevPageP += maxResults;

    //Query Trove, process each picture returned
    $.getJSON(pictureURL, function (data) {

        if (data.response.zone[0].records.work) {
            $.each(data.response.zone[0].records.work, processPicture);
        }
    });
}


function processArticle(index, item) {

    var text = "<p><h3>" + item.heading + "</h3>" + "<h4><a href='" + item.troveUrl + "' target='_blank'>" + item.title.value + "</a></h4>" + item.snippet + "</p><hr width='40%' align='center'/>"

    $('#articles').append(text);
    $("#articles").mCustomScrollbar("update");

    loadedArts++;
    console.log("arts: " + loadedArts);


}


function processPicture(index, item) {

    //First get the location, then define infobox content and place marker

    //Try to get lat/long coords from location tag
    if (typeof item.version[0].record[0] === 'object') {
        if (typeof item.version[0].record[0].metadata === 'object') {
            if (typeof item.version[0].record[0].metadata.dc === 'object') {
                if (typeof item.version[0].record[0].metadata.dc.coverage === 'string') {
                    var loc = item.version[0].record[0].metadata.dc.coverage;
                }
            }
        }
    }

    //If location tag exists
    if (typeof loc !== 'undefined') {

        //check if it contains lat/long
        var point = loc.match(/-?\d+\.\d+/g);

        //both these tests shouldnt be needed, this is a kludge for some bug
        if (typeof point !== 'undefined' && point != null) {

            var lat = parseFloat(point[0]);
            var lng = parseFloat(point[1]);

            var markerPos = new google.maps.LatLng(lat, lng);

            //Successful in finding lat/long, so place a marker
            placeMarker(markerPos, item.title, setInfoBoxContent(item, loc));

            loadedPics++;
            console.log("pics: " + loadedPics);
            return;
        }
    }

    //If not successful in getting lat/long, geocode the picture's title
    //Can't do too many queries per second
    if (geocode_enabled) {
        geocoder_wait += geocode_delay;
        setTimeout(function () {
            codeAddress(item);
        }, geocoder_wait);
    }

}


function codeAddress(item) {

    //Get address from item info, filter out common words
    var address = item.title + " " + item.snippet;
    address = filterWords(address) + ", Brisbane, Australia";
    console.log(address);

    //perform geocode
    geocoder.geocode( {
        'address': address
    }, function (results, status) {

        if (status == google.maps.GeocoderStatus.OK) {

            //map.setCenter(results[0].geometry.location);
            var loc = results[0].geometry.location;
            placeMarker(loc, item.title, setInfoBoxContent(item, "      "));

            codedPics++;
            console.log("geopics: " + codedPics);

        } else {
            console.log('Geocode unsuccessful: ' + status);
        }

    });
}


function filterWords(text) {

    //Filters words from a string, using the wordlist below

    var common = "the it is we all a an and by to you me he she they we how it i are to for of in was at from floods flood during natural disaster disasters 1983 1931 1974 2011 2013 b undefined home photograph photo had clean up taken s on january february";

    var wordArr = text.match(/\w+/g),
        commonObj = {},
        uncommonArr = [],
        word, i;

    common = common.split(' ');
    for (i = 0; i < common.length; i++) {
        commonObj[common[i].trim()] = true;
    }

    for (i = 0; i < wordArr.length; i++) {
        word = wordArr[i].trim().toLowerCase();
        if (!commonObj[word]) {
            uncommonArr.push(word);
        }
    }

    return uncommonArr.join(' ');
}


function setInfoBoxContent(item, loc) {

    //Set the marker infobox content

    //check if thumbnail exists, and if so get URL
    var thumburl = "";
    if (typeof item.identifier !== 'undefined') {
        var i;
        for (i = 0; i < item.identifier.length; i++) {
            if (typeof item.identifier[i].linktype === 'string') {
                if (item.identifier[i].linktype == 'thumbnail') {
                    thumburl = item.identifier[1].value;
                }
            }
        }
    }

    //photo description
    var snippet = "";
    if (typeof item.snippet === 'string') snippet = item.snippet;

    //infobox HTML
    var info = "<div class='mapinfobox'><p><a href='" + item.identifier[0].value + "' target='_blank'><img src='" + thumburl + "' alt='blah'></a><a href='" + item.troveUrl + "' target='_blank'>" + item.title + "</a><br />" + loc.replace(/-?\d+\.\d+/g, '').slice(0, -3) + "<br /></p><p>" + snippet + "</p></div>";

    return info;
}


function placeMarker(markerPos, title, info) {

    //Place a marker on the map after location and content has been determined

    //Create marker
    var marker = new google.maps.Marker({
        position: markerPos,
        map: map,
        title: title
    });

    //Set up the infobox
    google.maps.event.addListener(marker, 'click', function () {

        //close existing infobox
        if (photoInfoBox) photoInfoBox.close();

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

        photoInfoBox.open(map, marker);
    });
}


function toggleDiv(div) {
    $(div).toggle();
}