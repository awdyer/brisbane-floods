var cookie = "ZZZZ7"; //used for first time visitor cookie

$(window).load(function () {

    //Set up functions to call when timeline is clicked
    //Timeline
    $("#tm1893").on("click", function() { gotoTimeline("1893"); });
    $("#tm1931").on("click", function() { gotoTimeline("1931"); });
    $("#tm1974").on("click", function() { gotoTimeline("1974"); });
    $("#tm2011").on("click", function() { gotoTimeline("2011"); });
    $("#tm2013").on("click", function() { gotoTimeline("2013"); });

    // $("#f_toggle").on("click", function () { toggleDiv(".filters"); toggleDiv(".timeline"); return false; });


    // First time visitors
    // var visit=GetCookie(cookie);
    // if (visit===null){
    //    firstTimeVisitor();

    //    var expire=new Date();
    //    expire=new Date(expire.getTime()+7776000000);
    //    document.cookie=cookie+"=here; expires="+expire;
    // }

});


function firstTimeVisitor() {
    openDialog("#helpdialog1", { my: "center top", at: "center bottom", of: $(".timeline") } );
}

function openDialog(handler, pos) {
    $(handler).dialog( {
        hide: "fade",
        height: 120,
        position: pos
     });
}

//save year in persistent variable which will be loaded on timeline page
function gotoTimeline(year) {
    //store something
    var store = new Persist.Store('timeline_year');
    // save data in store
    store.set('year_key', year);
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