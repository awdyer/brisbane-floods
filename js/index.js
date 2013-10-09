$(window).load(function () {

    //Set up functions to call when timeline is clicked
    //Timeline
    $("#tm1893").on("click", function() { gotoTimeline("1893"); });
    $("#tm1931").on("click", function() { gotoTimeline("1931"); });
    $("#tm1974").on("click", function() { gotoTimeline("1974"); });
    $("#tm2011").on("click", function() { gotoTimeline("2011"); });
    $("#tm2013").on("click", function() { gotoTimeline("2013"); });

});

//save year in persistent variable which will be loaded on timeline page
function gotoTimeline(year) {
    //store something
    var store = new Persist.Store('timeline_year');
    // save data in store
    store.set('year_key', year);
}