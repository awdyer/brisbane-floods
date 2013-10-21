
//global vars
var apiKey = "71lcag6a17k5r6a7";
var geocode_enabled = false; //set this to disable geocoding while debugging, since daily queries are limited
var cookie = "ZZZZZ3"; //used for first time visitor cookie

var map, geocoder, geocoder_wait;
var geocode_delay = 1000; //500 is just enough as long as user doesn't click 'load more'
var prevSearchTermA, prevMinYearA, prevMaxYearA, prevMaxResultsA, prevPageA = 0;
var prevSearchTermP, prevMinYearP, prevMaxYearP, prevMaxResultsP, prevPageP = 0;
var fUseSame = false;

var loadedPics, loadedArts, codedPics;

var infoboxes = []; //new array
var openinfobox;
var imgpopups = [];
var imgastr = "";

var firstSearch = false;
var firstMarker = 0;
var firstArticle = 0;
var firstPhoto = 0;
var firstToggle = 0;

//map marker management - global
google.maps.Map.prototype.markers = [];

google.maps.Map.prototype.getMarkers = function () {
    return this.markers;
};

google.maps.Map.prototype.clearMarkers = function () {
    var i;
    for (i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
    }
    this.markers = [];
};

google.maps.Marker.prototype._setMap = google.maps.Marker.prototype.setMap;

google.maps.Marker.prototype.setMap = function (map) {
    if (map) {
        map.markers[map.markers.length] = this;
    }
    this._setMap(map);
}


$(window).load(function () {

    console.log("geocode enabled: " + geocode_enabled);

    // Loading overlay
    $("body").append("<div id='overlay'></div>");
    $("#overlay").hide();

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

    $("#f_toggle").on("click", function () {
        toggleDiv(".filters");
        toggleDiv(".timeline");
        $("#helpdialog5").dialog("close");
        return false;
    });
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
    toggleDiv(".filters");

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

    //set up map so when it's clicked, any open infobox closes
    google.maps.event.addListener(map, 'click', function () {
        //close existing infobox
        if (openinfobox) openinfobox.close();
    });


    //If came from startpage, automatically search that year
    var store = new Persist.Store('timeline_year');
    store.get('year_key', function (ok, val) {
        if (ok) {
            console.log('year_key = ' + val);

            if (val !== "") {
                newSearch(val);
                store.set('year_key', "");
            }
        }
    });

    // First time visitors
    var visit=GetCookie(cookie);
    if (visit===null){
       firstTimeVisitor();

       var expire=new Date();
       expire=new Date(expire.getTime()+7776000000);
       document.cookie=cookie+"=here; expires="+expire;
    }

});


function firstTimeVisitor() {
    // firstSearch = true;
    firstArticle = 1;
    firstMarker = 1;
    firstPhoto = 1;
    firstToggle = 1;

    // $("#helpdialog1").dialog( {
    //     position: { my: "right top", at: "right bottom", of: $(".timeline") }
    // });
}


function openDialog(handler, pos) {
    $(handler).dialog( {
        hide: "fade",
        height: 120,
        position: pos
     }); 
}


function firstToggleCheck() {
    if (firstToggle == 1) {
        // show the filters dialog a short time after the first search
        setTimeout( function () {
            openDialog("#helpdialog5", { my: "center top", at: "center+10% top+10%", of: $(".header") } );
            firstToggle = 2;
        }, 8000);
    }
}


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
        // if ($("#fa_exclude").val() != "")
        //     searchTermA += " NOT " + $("#fa_exclude").val();

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
            if (maxResultsA == "")
                var maxResultsP = "100";
            else
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
    if (openinfobox) openinfobox.close();

    //show loading overlay
    $("#overlay").show();

    //search
    searchArticles(searchTermA, minYearA, maxYearA, maxResultsA);
    searchPictures(searchTermP, minYearP, maxYearP, maxResultsP);

    // remove help popups when clicking on timeline
    // if (firstSearch) {
    //     $("#helpdialog1").dialog("close");
    // }
    if (firstArticle == 2) {
        $("#helpdialog2").dialog("close");
    }
    if (firstMarker == 2) {
        $("#helpdialog3").dialog("close");
    }
    if (firstPhoto == 2) {
        $("#helpdialog4").dialog("close");
    }
    if (firstToggle == 2) {
        $("#helpdialog5").dialog("close");
    }

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

    var searchZone = "picture";

    var pictureURL = "http://api.trove.nla.gov.au/result?key=" + apiKey + "&l-availibility=y%2Ff&include=workversions&encoding=json&zone=" + searchZone + "&sortby=relevance&n=" + maxResults + "&q=" + searchTerm + " date:[" + minYear + " TO " + maxYear + "]&s=" + prevPageP + "&callback=?";

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

    // Help dialog
    if (firstArticle == 1) {
        openDialog("#helpdialog2", { my: "left top", at: "right-20 top+20%", of: $("#articles") });
        firstArticle = 2;

        // popup will fade out automatically after mouse enters articles div
        $("#articles").mouseenter( function () {
            setTimeout( function() { $("#helpdialog2").dialog("close"); }, 4000);
        })
 
    }

    //if loaded at least 1 article and picture, hide loading overlay
    if (loadedArts == 1 && loadedPics > 0) {
        $("#overlay").hide();
        firstToggleCheck();
    }

    loadedArts++;
    console.log("arts: " + loadedArts);


}


function processPicture(index, item) {

    //check that photo's from a valid source
    if (!checkValidSource(item)) {
        return;
    }


    var location = getLocation(item);

    if (location !== null) {
        placeMarker(item, location[0], location[1]);

        // Help dialog
        if (firstMarker == 1) {
            openDialog("#helpdialog3", { my: "right bottom", at: "right-10% bottom-10%", of: $("#map_canvas") });
            firstMarker = 2;
        }

        //if loaded at least 1 article and picture, hide loading overlay
        if (loadedArts > 0 && loadedPics == 1) {
            $("#overlay").hide();
            firstToggleCheck();
        }

        loadedPics++;
        console.log("pics: " + loadedPics);
        //console.log(item.troveUrl + ": " + item.version.length);

    //If couldn't get location from tag, geocode photo description
    } else {

        if (geocode_enabled) {
            geocoder_wait += geocode_delay; //Can't do too many queries per second
            setTimeout(function () { codeAddress(item); }, geocoder_wait);
        }
    }
}


function checkValidSource(item) {

    //Check that photo comes from a valid source (direct image url can be found)

    var thumburl = getThumbURL(item);

    //for testing, returns true unless an INVALID source is founds
    var invalid = ['elibcat.library'];

    var i = 0;
    for (i=0; i<invalid.length; i++) {
        if (thumburl.indexOf(invalid[i]) != -1)
            return false;
    }

    var valid = ['flickr.com', 'bishop.slq', 'archivessearch.qld'];

    for (i=0; i<valid.length; i++) {
        if (thumburl.indexOf(valid[i]) != -1)
            return true;
    }

    //for testing, returns true unless an invalid source is found (above)
    return true;
}


function getThumbURL(item) {

    //get thumbnail URL

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

    return thumburl;
}


function getLocation(item) {
    //Try to get lat/long from location tag returned in Trove results

    //Check if location tag exists
    if (typeof item.version[0].record[0] === 'object') {
        if (typeof item.version[0].record[0].metadata === 'object') {
            if (typeof item.version[0].record[0].metadata.dc === 'object') {
                if (typeof item.version[0].record[0].metadata.dc.coverage === 'string') {
                    var address = item.version[0].record[0].metadata.dc.coverage;
                }
            }
        }
    }

    //If location tag exists, extract lat/long
    if (typeof address !== 'undefined') {

        //check if it contains lat/long
        var point = address.match(/-?\d+\.\d+/g);

        if (typeof point !== 'undefined' && point != null) {

            var lat = parseFloat(point[0]);
            var lng = parseFloat(point[1]);

            var markerPos = new google.maps.LatLng(lat, lng);
            address = address.replace(/-?\d+\.\d+/g, '').slice(0, -3).replace(/;/g, ''); //remove lat/long from address

            return [markerPos, address];
        }
    }

    return null;
}


function codeAddress(item) {

    //Get address from item info, filter out common words
    var address = item.title + " " + item.snippet;
    address = filterWords(address);
    geocode_address = address + ", Brisbane, Australia";
    // console.log(address);

    //perform geocode
    geocoder.geocode( {
        'address': geocode_address
    }, function (results, status) {

        if (status == google.maps.GeocoderStatus.OK) {

            //map.setCenter(results[0].geometry.location);
            var markerPos = results[0].geometry.location;
            address = toTitleCase(address).replace(/;/g, '');

            placeMarker(item, markerPos, address);

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


function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


function placeMarker(item, markerPos, address) {

    //Place a marker on the map after location and content has been determined
    var index = infoboxes.length;

    var info = getContent(item, address, index);

    pinfbox = new InfoBox({
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

    //push infobox to array of all infoboxes
    infoboxes[index] = pinfbox;


    //Create marker
    var marker = new google.maps.Marker({
        position: markerPos,
        map: map,
        title: item.title
    });

    //Set up the infobox
    google.maps.event.addListener(marker, 'click', function () {

        //close existing infobox
        if (openinfobox) openinfobox.close();
        //open new infobox
        infoboxes[index].open(map, marker);
        //save openinfobox
        openinfobox = infoboxes[index];

        //show help dialog
        if (firstPhoto == 1) {
            openDialog("#helpdialog4", { my: "right top", at: "right-10% top+10%", of: $("#map_canvas") });
            firstPhoto = 2;

            // close marker dialog
            if (firstMarker == 2) {
                $("#helpdialog3").dialog( "close" );
            }
        }

    });
}


function getContent(item, address, ibindex) {

    //Get content for infobox

    var thumburl = getThumbURL(item);

    //get original image URL
    if (thumburl != "") {
        imgurl = getImageURL(item, thumburl, ibindex);
    }

    if (typeof imgurl === 'undefined') {
        //URL hasn't been returned yet
        imgurl = '#'; //set this to placeholder gif
    }

    //determine content
    var content = determineContent(item, address, thumburl, imgurl);


    return content;
}


function getImageURL(item, thumburl, ibindex) {

    //Check the image source and find the original image URL (different method req for each source)

    //Flickr (easy)
    if (thumburl.indexOf('flickr.com') != -1) {
        imgurl = thumburl.slice(0,-5) + "b.jpg";
    }

    //Archivesearch (easy)
    else if (thumburl.indexOf('archivessearch.qld') != -1) {
        imgurl = thumburl.replace('thumb=true', '');
    }

    //QSL (John Oxley Library) (difficult)
    else if (thumburl.indexOf('bishop.slq') != -1) {

        var identifier = item.version[0].record[0].header.identifier[0];
        var num = identifier.match(/\d+/g);
        var metaURL = 'http://bishop.slq.qld.gov.au/webclient/MetadataManager?pid=' + num;
        //console.log(metaURL);

        imgurl = fetchQSLimage(metaURL, ibindex, thumburl, item);

    }

    //Other source - not enough relevant to 'brisbane floods' to bother with
    else {
        console.log('source: ' + thumburl);
        imgurl = '#';
    }

    if (typeof imgurl !== 'undefined') {
        console.log(imgurl);
    }

    return imgurl;
}


function fetchQSLimage(metaURL, ibindex, thumburl, item) {

    /* Fetches images from QSL. Has to do a cross-origin call to get the page source
        of metadata page, which contains the direct URL, and extract it */

    var URL = 'http://anyorigin.com/get?url=' + encodeURIComponent(metaURL) + '&callback=?';

    $.getJSON(URL, function(data){
        var output = data.contents;

        //extract image URL out of source
        var imgurl = output.match(/\bhttp\S+jpg\b/g);
        //mutate the URL into the fullsize image URL
        imgurl = imgurl[0].replace('preview','research').slice(0,-5) + "r.jpg";
        //for some reason, some URLs returned have '/backup1/images' instead of the domain
        imgurl = imgurl.replace('backup1/images', 'enc.slq.qld.gov.au');


        //instead of returning, just directly update infobox where it would be returned to
        //returning it won't work as it will have already been set as 'undefined'

        var excontent = infoboxes[ibindex].getContent();
        var newcontent = excontent.replace(/#/g, imgurl);
        newcontent = newcontent.replace("img/gif-load-popup.gif", thumburl);
        newcontent = newcontent.replace("<p rel", "<a rel");

        // var index = imgpopups.length;
        // imgpopups[index] = ['"' + imgurl + '"', '"' + item.title + '"'];
        // imgastr += "[" + imgpopups[index] + "],";
        // popup = "onClick='jQuery.slimbox([" + imgastr.slice(0,-1) + "], " + index +"); return false;'";

        popup = "onClick='jQuery.slimbox(\"" + imgurl + "\", \"" + item.title + "\"); $(\"#helpdialog4\").dialog(\"close\"); return false;'";
        newcontent = newcontent.replace("title=", popup + "title=");        
        infoboxes[ibindex].setContent(newcontent);
        //console.log(imgurl);

    });
}


function determineContent(item, address, thumburl, imgurl) {

    //photo description
    var description = "";
    if (typeof item.snippet === 'string')
        description = item.snippet;

    // Insert loading gif if still waiting for original image url
    var popup = "";
    var plink = "p";
    if (imgurl != '#') {
        // var index = imgpopups.length;
        // imgpopups[index] = ['"' + imgurl + '"', '"' + item.title + '"'];
        // imgastr += "[" + imgpopups[index] + "],";
        // popup = "onClick='jQuery.slimbox([" + imgastr.slice(0,-1) + "], " + index +"); return false;'";

        popup = "onClick='jQuery.slimbox(\"" + imgurl + "\", \"" + item.title + "\"); $(\"#helpdialog4\").dialog(\"close\"); return false;'";
        plink = "a";
    }
    else {
        thumburl = "img/gif-load-popup.gif";
    }

    //infobox HTML
    var content = "<div class='mapinfobox'> <p><" + plink + " rel='lightbox' href='" + imgurl + "' " + popup + " title='" + item.title + "'><img src='" + thumburl + "' alt='photo'></a> <a href='" + item.troveUrl + "' target='_blank'>" + item.title + "</a> <br />" + address + "<br /></p> <p>" + description + "</p> </div>";
    return content;
}


function toggleDiv(div) {
    $(div).toggle();
}

function GetCookie(name) {
  var arg=name+"=";
  var alen=arg.length;
  var clen=document.cookie.length;
  var i=0;
  while (i<clen) {
    var j=i+alen;
    if (document.cookie.substring(i,j)==arg)
      return "here";
    i=document.cookie.indexOf(" ",i)+1;
    if (i==0) break;
  }
  return null;
}