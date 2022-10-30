// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

var parsedEntries = [];
var allEntries = [];
var allStores;
var pageNumber = 0;
var storeFilter = '';
var titleFilter = '';
var priceFilter = '';
var pricePlaceholder = ''
var sortFilter = ''
var loadMore = true;
var currency;
var isFav = false;

function main() {
    initCurrency();
    getStores();
    initRange();
}

function showFav() {
    $('.fav-icon').parent().addClass("selected")
    $('.home-icon').parent().removeClass("selected")
    $('.header').hide()
    $('.item-list').css('padding-top', 'initial')
    clearApp();
    isFav = true;
    loadFavs();
}

function loadFavs() {
    parsedEntries = [];
    allEntries = [];
    var count = 0;
    var tempEntrys = [];
    var favs = window.localStorage.getItem("fav");
    if (!favs) {
        $(".loadersmall").hide();
        showNoFavsFound()
    } else {
        favs = favs.split(',')
        $(favs).each(function(index) {
            $.ajax({
                url: 'https://www.cheapshark.com/api/1.0/deals?title=' + favs[index] + '&exact=1'
            }).then(function(data) {
                data.forEach(function(entry) {
                    tempEntrys.push(entry)
                })
                count++
                if (count == favs.length) {
                    $(".loadersmall").hide();
                    tempEntrys.forEach(function(entry) {
                        parseData(entry)

                    });


                    parsedEntries.forEach(function(entry) {
                        var sales = entry.salePrice.split(',')
                        var prices = entry.normalPrice.split(',')
                        var dealIds = entry.dealID.split(',')
                        var isOnSale = entry.isOnSale.split(',')
                        sales = sales.map(Number);
                        var usedIndex = indexOfSmallest(sales)
                        var savings = entry.savings.split(',')

                        if (!$('#' + entry.internalName).length) {
                            renderItemCard(entry.title, entry.thumb, entry.dealID, prices[usedIndex], sales[usedIndex], entry.internalName, savings[usedIndex], true, isOnSale[usedIndex])
                        }
                        addStoreIcon(entry.storeID, entry.internalName)
                    });

                    allEntries.forEach(function(entry) {
                        var sales = entry.salePrice.split(',')
                        var prices = entry.normalPrice.split(',')
                        var dealIds = entry.dealID.split(',')
                        var savings = entry.savings.split(',')
                        if (sales.length > 1) {
                            $("#" + entry.internalName).off();
                            $("#" + entry.internalName).on("click", function() {
                                togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                            });
                        } else {
                            $("#" + entry.internalName).off();
                            $("#" + entry.internalName).on("click", function() {
                                //openDeal(entry.dealID)
                                togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                            });
                        }
                    });
                    if (data.length < 60)
                        loadMore = false;
                    scrollLoad = true;
                    if (data.length == 0)
                        showNoItemsFound()


                }

            })

        })



    }


}

function toggleCurrency() {
    if ($('.currency-val').text() == '$') {
        if (confirm("Prices in € maybe inaccurate.\r\nDo you want to switch currency?") == true) {
            window.localStorage.setItem('currency', '€')
            $('.currency-val').html('€')
            location.reload();
        } else {

        }
    } else {
        window.localStorage.setItem('currency', '$')
        $('.currency-val').html('$')
        location.reload();
    }
}

function initCurrency() {
    $("#currency-btn").button()
    var value = window.localStorage.getItem("currency");
    if (!value) {
        $('.currency-val').html('$')
        currency = '$';
    } else {
        currency = value;
        $('.currency-val').html(value)
    }
}


function onDeviceReady() {
    main();
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

function getData() {
    var onSale = '&onSale=1'
    if (titleFilter) {
        onSale = '&onSale=0'
    }
    parsedEntries = [];
    $.ajax({
        url: 'https://www.cheapshark.com/api/1.0/deals?pageNumber=' + pageNumber + storeFilter + titleFilter + priceFilter + sortFilter + onSale
    }).then(function(data) {
        if (!isFav) {
            $(".loadersmall").hide();
            data.forEach(function(entry) {
                parseData(entry)
            });
            parsedEntries.forEach(function(entry) {
                var sales = entry.salePrice.split(',')
                var prices = entry.normalPrice.split(',')
                var dealIds = entry.dealID.split(',')
                var savings = entry.savings.split(',')
                var isOnSale = entry.isOnSale.split(',')

                sales = sales.map(Number);
                var usedIndex = indexOfSmallest(sales)
                if (!$('#' + entry.internalName).length) {
                    renderItemCard(entry.title, entry.thumb, entry.dealID, prices[usedIndex], sales[usedIndex], entry.internalName, savings[usedIndex], false, isOnSale[usedIndex])
                }
                addStoreIcon(entry.storeID, entry.internalName)
            });

            allEntries.forEach(function(entry) {
                var sales = entry.salePrice.split(',')
                var prices = entry.normalPrice.split(',')
                var dealIds = entry.dealID.split(',')
                if (sales.length > 1) {
                    $("#" + entry.internalName).off();
                    $("#" + entry.internalName).on("click", function() {
                        togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                    });
                } else {
                    $("#" + entry.internalName).off();
                    $("#" + entry.internalName).on("click", function() {
                        //openDeal(entry.dealID)
                        togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                    });
                }
            });
            if (data.length < 60)
                loadMore = false;
            scrollLoad = true;
            if (data.length == 0)
                showNoItemsFound()
        }
    });

}

function indexOfSmallest(a) {
    var lowest = 0;
    for (var i = 1; i < a.length; i++) {
        if (a[i] < a[lowest]) lowest = i;
    }
    return lowest;
}

function getStores() {
    $.ajax({
        url: '//www.cheapshark.com/api/1.0/stores'
    }).then(function(data) {
        allStores = data;
        getData();
        addStoreFilter(allStores);
    });
}

function addStoreIcon(stores, id) {
    var storeArry = stores.split(',');
    storeArry.forEach(function(store) {
        for (var i = 0; i < allStores.length; i++) {
            if (allStores[i].storeID == store) {
                if (!$('#' + id + ' .store' + allStores[i].storeID).length)
                    $('#' + id).append('<img class="storeIcon store' + allStores[i].storeID + '" src="https://www.cheapshark.com' + allStores[i].images.icon + '">')
                break;
            }
        }
    });
}


function parseData(entry) {
    checkDublicates(entry)
    checkDublicatesAll(entry)
}

function checkDublicates(entry) {
    var exists = false;
    for (var i = 0; i < parsedEntries.length; i++) {
        if (parsedEntries[i].internalName == entry.internalName) {
            if (parsedEntries[i].storeID.split(',').includes(entry.storeID)) {
                exists = true;
            } else {
                exists = true;
                parsedEntries[i].storeID = parsedEntries[i].storeID + ',' + entry.storeID
                parsedEntries[i].salePrice = parsedEntries[i].salePrice + ',' + entry.salePrice
                parsedEntries[i].normalPrice = parsedEntries[i].normalPrice + ',' + entry.normalPrice
                parsedEntries[i].dealID = parsedEntries[i].dealID + ',' + entry.dealID
                parsedEntries[i].savings = parsedEntries[i].savings + ',' + entry.savings
                parsedEntries[i].isOnSale = parsedEntries[i].isOnSale + ',' + entry.isOnSale
                break;
            }
        }
    }
    if (!exists) {
        parsedEntries.push(entry)
    }
}

function checkDublicatesAll(entry) {
    var exists = false;
    for (var i = 0; i < allEntries.length; i++) {
        if (allEntries[i].internalName == entry.internalName) {
            if (allEntries[i].storeID.split(',').includes(entry.storeID)) {
                exists = true;
            } else {
                exists = true;
                allEntries[i].storeID = allEntries[i].storeID + ',' + entry.storeID
                allEntries[i].salePrice = allEntries[i].salePrice + ',' + entry.salePrice
                allEntries[i].normalPrice = allEntries[i].normalPrice + ',' + entry.normalPrice
                allEntries[i].dealID = allEntries[i].dealID + ',' + entry.dealID
                allEntries[i].savings = allEntries[i].savings + ',' + entry.savings
                allEntries[i].isOnSale = allEntries[i].isOnSale + ',' + entry.isOnSale
                break;
            }
        }

    }
    if (!exists) {
        allEntries.push(entry)
    }
}

function renderItemCard(title, pic, dealId, normalPrice, salePrice, id, saving, fav, isOnSale) {
    salePrice = salePrice.toFixed(2);
    var nosale = false;
    if (saving.split('.')[0] == '100') {
        saving = 'FREE'
    } else if (Number(saving) > 0) {
        saving = "-" + saving.split('.')[0] + "%"
    } else {
        nosale = true
    }
    pic = pic.includes('steam') ? pic.replace('capsule_sm_120', 'capsule_184x69') : pic;
    if (isOnSale == '1' && !nosale) {
        $('.item-list').append("<dt class='list-item-card' id='" + id + "'>" +
            "<div class='list-item-tumb'  style='background-image: url(" + pic + ");'>" +
            "</div>" +
            "<div class='list-item-title'>" + title + "</div>" +
            "<div><span class='normalPrice'>" + normalPrice + currency + "</span><span class='salePrice'>" + salePrice + currency + "</span><span class='saving'>" + saving + "</span></div>" +
            "</dt>")
    } else {
        $('.item-list').append("<dt class='list-item-card' id='" + id + "'>" +
            "<div class='list-item-tumb'  style='background-image: url(" + pic + ");'>" +
            "</div>" +
            "<div class='list-item-title'>" + title + "</div>" +
            "<div><span class='salePrice'>" + normalPrice + currency + "</span></div>" +
            "</dt>")
    }

}

function togglePopup(dealIds, prices, sales, stores, title, name) {
    $('.fav-icon-Game').off('click').on('click', function() {
        setFav(name)

        return false;
    });
    var favs = window.localStorage.getItem("fav");
    if (!favs)
        favs = []
    else
        favs = favs.split(',')
    if (favs.includes(name)) {
        $('.fav-icon-Game').addClass('Fav').removeClass('noFav');
    } else {
        $('.fav-icon-Game').addClass('noFav').removeClass('Fav');
    }
    $(".popUp-Content").html('');
    $(".popUp-title").html(title);
    var storeArry = stores.split(',');
    var storeIcon;
    var appendArray = [];

    prices = prices.map(Number);
    sales = sales.map(Number);
    dealIds.forEach((element, index) => {
        for (var i = 0; i < allStores.length; i++) {
            if (allStores[i].storeID == storeArry[index]) {
                storeIcon = '<img class="storeIcon" src="https://www.cheapshark.com/' + allStores[i].images.icon + '">'
                break;
            }
        }
        prices[index] = prices[index].toFixed(2);
        sales[index] = sales[index].toFixed(2);
        var obj = {};
        if (prices[index] != sales[index]) {
            obj['link'] = "<tr class='popUpTr' onClick=openDeal('" + element + "')><td>" + storeIcon + "</td><td class='normalPrice'>" + prices[index] + currency + "</td><td class='salePrice'>" + sales[index] + currency + "</td></tr>";
            obj['storeIcon'] = storeIcon
            obj['sales'] = sales[index]
        } else {
            obj['storeIcon'] = storeIcon
            obj['sales'] = prices[index]
            obj['link'] = "<tr class='popUpTr' onClick=openDeal('" + element + "')><td>" + storeIcon + "</td><td class='salePrice'>" + prices[index] + currency + "</td></tr>";
        }
        appendArray.push(obj)
    })

    appendArray = appendArray.sort((a, b) => parseFloat(a.sales) - parseFloat(b.sales));
    appendArray.forEach((element, index) => {
        $(".popUp-Content").append(element.link);
    })
    $(".popUp").toggle();
    overlayOn();
}

function togglePopupNoArgs() {
    $(".popUp").toggle();
    overlayOff();
}

function setFav(name) {
    var favs = window.localStorage.getItem("fav");
    if (!favs)
        favs = []
    else
        favs = favs.split(',')
    if (favs.includes(name)) {
        favs = favs.filter(e => e !== name);
        favs = favs.join(',')
        localStorage.setItem('fav', favs);
        $('.fav-icon-Game').addClass('noFav').removeClass('Fav');
    } else {
        favs.push(name)
        favs = favs.join(',')
        localStorage.setItem('fav', favs);
        $('.fav-icon-Game').addClass('Fav').removeClass('noFav');
    }
}

function openDeal(dealId) {
    var uri = "https://www.cheapshark.com/redirect?dealID=" + dealId + ""
    cordova.InAppBrowser.open(uri, '_blank', 'hideurlbar=yes');
}

/* Set the width of the side navigation to 250px */
function openNav() {
    document.getElementById("mySidenav").style.width = "100%";
    $('body').css("overflow", "hidden");
}

/* Set the width of the side navigation to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    $('body').css("overflow", "auto");
}

function addStoreFilter(allStores) {
    var storeName = '';
    allStores.forEach((item, i) => {
        if (item.isActive) {
            picId = parseInt(item.storeID) - 1
            $('.filter-stores').append(
                '<label for="checkbox-store-' + item.storeID + '" class="ui-checkboxradio-label ui-corner-all ui-button ui-widget">' +
                '<img class="storeIcon" src="https://www.cheapshark.com/img/stores/icons/' + picId + '.png">' +
                '<input type="checkbox" class="checkbox" name="checkbox-store-' + item.storeID + '" id="checkbox-store-' + item.storeID + '">' +
                '</label>'
            )
        }
    });
    removeIconFromCheckbox();
}

function removeIconFromCheckbox() {
    $(".checkbox").checkboxradio({
        icon: false
    });
}

function searchWithFilter() {
    closeNav();
    clearApp();
    storeFilter = getStoreFilter();
    priceFilter = pricePlaceholder,
        sortFilter = getSortFilters();
    pageNumber = 0;
    getData();
}

function getSortFilters() {
    return '&sortBy=' + $('.filter-sortBy .ui-state-active input').val()
}

function getStoreFilter() {
    var checkedStores = [];
    var filterString = '';
    for (var i = 0; i <= allStores.length; i++) {
        if ($('#checkbox-store-' + i.toString()).is(":checked"))
            checkedStores.push(i)
    }
    if (checkedStores.length)
        filterString = '&storeID=' + checkedStores.join(',')
    else
        filterString = '';

    return filterString;
}

function searchTitle() {
    clearApp();
    var titFilter = '&title=' + $("#titleSearch").val();
    pageNumber = 0;
    titleFilter = titFilter;
    getData();
}

function clearApp() {
    loadMore = true;
    $(".popUp").hide();
    $(".item-list").empty();
    $(".loadersmall").show();
    $('.end-txt').hide();
}


function loadMoreEntrys() {
    if (scrollLoad && (Math.floor($(window).scrollTop()) == $(document).height() - $(window).height()) || (Math.ceil($(window).scrollTop()) == $(document).height() - $(window).height())) {
        scrollLoad = false;
        if (loadMore) {
            $(".loadersmall").show();
            pageNumber++;
            getData();
        } else {
            $('.end-txt').show();
        }
    }
}

$(window).scroll(function() {
    loadMoreEntrys();
});

$(document.body).on('touchmove', loadMoreEntrys);


function initRange() {
    $(function() {
        $("#slider-range").slider({
            range: true,
            min: 0,
            max: 50,
            values: [0, 50],
            slide: function(event, ui) {
                var maxPrice = ui.values[1]
                if (maxPrice == 50)
                    maxPrice = '50 and over'
                $("#amount").html(currency + "" + ui.values[0] + " - " + currency + "" + maxPrice);
                pricePlaceholder = '&lowerPrice=' + ui.values[0] + '&upperPrice=' + ui.values[1];
            }
        });
        $("#amount").html(currency + "" + $("#slider-range").slider("values", 0) +
            " - " + currency + '50 and over');
    });
}

function overlayOn() {
    document.getElementById("overlay").style.display = "block";
    $('body').css("overflow", "hidden");
}

function overlayOff() {
    document.getElementById("overlay").style.display = "none";
    $('body').css("overflow", "auto");
}

$(document).keyup(function(event) {
    if ($("#titleSearch").is(":focus") && event.key == "Enter") {
        searchTitle();
    }
});

function showNoItemsFound() {
    $('.noGamesMsg').remove();
    $('.item-list').append("<dt class='noGamesMsg' style='text-align:center;'>No games found!</dt>")
}

function showNoFavsFound() {
    $('.item-list').append("<dt style='text-align:center;padding-top: 50px;'>No favorites added yet!</dt>")
}// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

var parsedEntries = [];
var allEntries = [];
var allStores;
var pageNumber = 0;
var storeFilter = '';
var titleFilter = '';
var priceFilter = '';
var pricePlaceholder = ''
var sortFilter = ''
var loadMore = true;
var currency;
var isFav = false;

function main() {
    initCurrency();
    getStores();
    initRange();
}

function showFav() {
    $('.fav-icon').parent().addClass("selected")
    $('.home-icon').parent().removeClass("selected")
    $('.header').hide()
    $('.item-list').css('padding-top', 'initial')
    clearApp();
    isFav = true;
    loadFavs();
}

function loadFavs() {
    parsedEntries = [];
    allEntries = [];
    var count = 0;
    var tempEntrys = [];
    var favs = window.localStorage.getItem("fav");
    if (!favs) {
        $(".loadersmall").hide();
        showNoFavsFound()
    } else {
        favs = favs.split(',')
        $(favs).each(function(index) {
            $.ajax({
                url: 'https://www.cheapshark.com/api/1.0/deals?title=' + favs[index] + '&exact=1'
            }).then(function(data) {
                data.forEach(function(entry) {
                    tempEntrys.push(entry)
                })
                count++
                if (count == favs.length) {
                    $(".loadersmall").hide();
                    tempEntrys.forEach(function(entry) {
                        parseData(entry)

                    });


                    parsedEntries.forEach(function(entry) {
                        var sales = entry.salePrice.split(',')
                        var prices = entry.normalPrice.split(',')
                        var dealIds = entry.dealID.split(',')
                        var isOnSale = entry.isOnSale.split(',')
                        sales = sales.map(Number);
                        var usedIndex = indexOfSmallest(sales)
                        var savings = entry.savings.split(',')

                        if (!$('#' + entry.internalName).length) {
                            renderItemCard(entry.title, entry.thumb, entry.dealID, prices[usedIndex], sales[usedIndex], entry.internalName, savings[usedIndex], true, isOnSale[usedIndex])
                        }
                        addStoreIcon(entry.storeID, entry.internalName)
                    });

                    allEntries.forEach(function(entry) {
                        var sales = entry.salePrice.split(',')
                        var prices = entry.normalPrice.split(',')
                        var dealIds = entry.dealID.split(',')
                        var savings = entry.savings.split(',')
                        if (sales.length > 1) {
                            $("#" + entry.internalName).off();
                            $("#" + entry.internalName).on("click", function() {
                                togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                            });
                        } else {
                            $("#" + entry.internalName).off();
                            $("#" + entry.internalName).on("click", function() {
                                //openDeal(entry.dealID)
                                togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                            });
                        }
                    });
                    if (data.length < 60)
                        loadMore = false;
                    scrollLoad = true;
                    if (data.length == 0)
                        showNoItemsFound()


                }

            })

        })



    }


}

function toggleCurrency() {
    if ($('.currency-val').text() == '$') {
        if (confirm("Prices in € maybe inaccurate.\r\nDo you want to switch currency?") == true) {
            window.localStorage.setItem('currency', '€')
            $('.currency-val').html('€')
            location.reload();
        } else {

        }
    } else {
        window.localStorage.setItem('currency', '$')
        $('.currency-val').html('$')
        location.reload();
    }
}

function initCurrency() {
    $("#currency-btn").button()
    var value = window.localStorage.getItem("currency");
    if (!value) {
        $('.currency-val').html('$')
        currency = '$';
    } else {
        currency = value;
        $('.currency-val').html(value)
    }
}


function onDeviceReady() {
    main();
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

function getData() {
    var onSale = '&onSale=1'
    if (titleFilter) {
        onSale = '&onSale=0'
    }
    parsedEntries = [];
    $.ajax({
        url: 'https://www.cheapshark.com/api/1.0/deals?pageNumber=' + pageNumber + storeFilter + titleFilter + priceFilter + sortFilter + onSale
    }).then(function(data) {
        if (!isFav) {
            $(".loadersmall").hide();
            data.forEach(function(entry) {
                parseData(entry)
            });
            parsedEntries.forEach(function(entry) {
                var sales = entry.salePrice.split(',')
                var prices = entry.normalPrice.split(',')
                var dealIds = entry.dealID.split(',')
                var savings = entry.savings.split(',')
                var isOnSale = entry.isOnSale.split(',')

                sales = sales.map(Number);
                var usedIndex = indexOfSmallest(sales)
                if (!$('#' + entry.internalName).length) {
                    renderItemCard(entry.title, entry.thumb, entry.dealID, prices[usedIndex], sales[usedIndex], entry.internalName, savings[usedIndex], false, isOnSale[usedIndex])
                }
                addStoreIcon(entry.storeID, entry.internalName)
            });

            allEntries.forEach(function(entry) {
                var sales = entry.salePrice.split(',')
                var prices = entry.normalPrice.split(',')
                var dealIds = entry.dealID.split(',')
                if (sales.length > 1) {
                    $("#" + entry.internalName).off();
                    $("#" + entry.internalName).on("click", function() {
                        togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                    });
                } else {
                    $("#" + entry.internalName).off();
                    $("#" + entry.internalName).on("click", function() {
                        //openDeal(entry.dealID)
                        togglePopup(dealIds, prices, sales, entry.storeID, entry.title, entry.internalName)
                    });
                }
            });
            if (data.length < 60)
                loadMore = false;
            scrollLoad = true;
            if (data.length == 0)
                showNoItemsFound()
        }
    });

}

function indexOfSmallest(a) {
    var lowest = 0;
    for (var i = 1; i < a.length; i++) {
        if (a[i] < a[lowest]) lowest = i;
    }
    return lowest;
}

function getStores() {
    $.ajax({
        url: '//www.cheapshark.com/api/1.0/stores'
    }).then(function(data) {
        allStores = data;
        getData();
        addStoreFilter(allStores);
    });
}

function addStoreIcon(stores, id) {
    var storeArry = stores.split(',');
    storeArry.forEach(function(store) {
        for (var i = 0; i < allStores.length; i++) {
            if (allStores[i].storeID == store) {
                if (!$('#' + id + ' .store' + allStores[i].storeID).length)
                    $('#' + id).append('<img class="storeIcon store' + allStores[i].storeID + '" src="https://www.cheapshark.com' + allStores[i].images.icon + '">')
                break;
            }
        }
    });
}


function parseData(entry) {
    checkDublicates(entry)
    checkDublicatesAll(entry)
}

function checkDublicates(entry) {
    var exists = false;
    for (var i = 0; i < parsedEntries.length; i++) {
        if (parsedEntries[i].internalName == entry.internalName) {
            if (parsedEntries[i].storeID.split(',').includes(entry.storeID)) {
                exists = true;
            } else {
                exists = true;
                parsedEntries[i].storeID = parsedEntries[i].storeID + ',' + entry.storeID
                parsedEntries[i].salePrice = parsedEntries[i].salePrice + ',' + entry.salePrice
                parsedEntries[i].normalPrice = parsedEntries[i].normalPrice + ',' + entry.normalPrice
                parsedEntries[i].dealID = parsedEntries[i].dealID + ',' + entry.dealID
                parsedEntries[i].savings = parsedEntries[i].savings + ',' + entry.savings
                parsedEntries[i].isOnSale = parsedEntries[i].isOnSale + ',' + entry.isOnSale
                break;
            }
        }
    }
    if (!exists) {
        parsedEntries.push(entry)
    }
}

function checkDublicatesAll(entry) {
    var exists = false;
    for (var i = 0; i < allEntries.length; i++) {
        if (allEntries[i].internalName == entry.internalName) {
            if (allEntries[i].storeID.split(',').includes(entry.storeID)) {
                exists = true;
            } else {
                exists = true;
                allEntries[i].storeID = allEntries[i].storeID + ',' + entry.storeID
                allEntries[i].salePrice = allEntries[i].salePrice + ',' + entry.salePrice
                allEntries[i].normalPrice = allEntries[i].normalPrice + ',' + entry.normalPrice
                allEntries[i].dealID = allEntries[i].dealID + ',' + entry.dealID
                allEntries[i].savings = allEntries[i].savings + ',' + entry.savings
                allEntries[i].isOnSale = allEntries[i].isOnSale + ',' + entry.isOnSale
                break;
            }
        }

    }
    if (!exists) {
        allEntries.push(entry)
    }
}

function renderItemCard(title, pic, dealId, normalPrice, salePrice, id, saving, fav, isOnSale) {
    salePrice = salePrice.toFixed(2);
    var nosale = false;
    if (saving.split('.')[0] == '100') {
        saving = 'FREE'
    } else if (Number(saving) > 0) {
        saving = "-" + saving.split('.')[0] + "%"
    } else {
        nosale = true
    }
    pic = pic.includes('steam') ? pic.replace('capsule_sm_120', 'capsule_184x69') : pic;
    if (isOnSale == '1' && !nosale) {
        $('.item-list').append("<dt class='list-item-card' id='" + id + "'>" +
            "<div class='list-item-tumb'  style='background-image: url(" + pic + ");'>" +
            "</div>" +
            "<div class='list-item-title'>" + title + "</div>" +
            "<div><span class='normalPrice'>" + normalPrice + currency + "</span><span class='salePrice'>" + salePrice + currency + "</span><span class='saving'>" + saving + "</span></div>" +
            "</dt>")
    } else {
        $('.item-list').append("<dt class='list-item-card' id='" + id + "'>" +
            "<div class='list-item-tumb'  style='background-image: url(" + pic + ");'>" +
            "</div>" +
            "<div class='list-item-title'>" + title + "</div>" +
            "<div><span class='salePrice'>" + normalPrice + currency + "</span></div>" +
            "</dt>")
    }

}

function togglePopup(dealIds, prices, sales, stores, title, name) {
    $('.fav-icon-Game').off('click').on('click', function() {
        setFav(name)

        return false;
    });
    var favs = window.localStorage.getItem("fav");
    if (!favs)
        favs = []
    else
        favs = favs.split(',')
    if (favs.includes(name)) {
        $('.fav-icon-Game').addClass('Fav').removeClass('noFav');
    } else {
        $('.fav-icon-Game').addClass('noFav').removeClass('Fav');
    }
    $(".popUp-Content").html('');
    $(".popUp-title").html(title);
    var storeArry = stores.split(',');
    var storeIcon;
    var appendArray = [];

    prices = prices.map(Number);
    sales = sales.map(Number);
    dealIds.forEach((element, index) => {
        for (var i = 0; i < allStores.length; i++) {
            if (allStores[i].storeID == storeArry[index]) {
                storeIcon = '<img class="storeIcon" src="https://www.cheapshark.com/' + allStores[i].images.icon + '">'
                break;
            }
        }
        prices[index] = prices[index].toFixed(2);
        sales[index] = sales[index].toFixed(2);
        var obj = {};
        if (prices[index] != sales[index]) {
            obj['link'] = "<tr class='popUpTr' onClick=openDeal('" + element + "')><td>" + storeIcon + "</td><td class='normalPrice'>" + prices[index] + currency + "</td><td class='salePrice'>" + sales[index] + currency + "</td></tr>";
            obj['storeIcon'] = storeIcon
            obj['sales'] = sales[index]
        } else {
            obj['storeIcon'] = storeIcon
            obj['sales'] = prices[index]
            obj['link'] = "<tr class='popUpTr' onClick=openDeal('" + element + "')><td>" + storeIcon + "</td><td class='salePrice'>" + prices[index] + currency + "</td></tr>";
        }
        appendArray.push(obj)
    })

    appendArray = appendArray.sort((a, b) => parseFloat(a.sales) - parseFloat(b.sales));
    appendArray.forEach((element, index) => {
        $(".popUp-Content").append(element.link);
    })
    $(".popUp").toggle();
    overlayOn();
}

function togglePopupNoArgs() {
    $(".popUp").toggle();
    overlayOff();
}

function setFav(name) {
    var favs = window.localStorage.getItem("fav");
    if (!favs)
        favs = []
    else
        favs = favs.split(',')
    if (favs.includes(name)) {
        favs = favs.filter(e => e !== name);
        favs = favs.join(',')
        localStorage.setItem('fav', favs);
        $('.fav-icon-Game').addClass('noFav').removeClass('Fav');
    } else {
        favs.push(name)
        favs = favs.join(',')
        localStorage.setItem('fav', favs);
        $('.fav-icon-Game').addClass('Fav').removeClass('noFav');
    }
}

function openDeal(dealId) {
    var uri = "https://www.cheapshark.com/redirect?dealID=" + dealId + ""
    cordova.InAppBrowser.open(uri, '_blank', 'hideurlbar=yes');
}


function openNav() {
    document.getElementById("mySidenav").style.width = "100%";
    $('body').css("overflow", "hidden");
}

/* Set the width of the side navigation to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    $('body').css("overflow", "auto");
}

function addStoreFilter(allStores) {
    var storeName = '';
    allStores.forEach((item, i) => {
        if (item.isActive) {
            picId = parseInt(item.storeID) - 1
            $('.filter-stores').append(
                '<label for="checkbox-store-' + item.storeID + '" class="ui-checkboxradio-label ui-corner-all ui-button ui-widget">' +
                '<img class="storeIcon" src="https://www.cheapshark.com/img/stores/icons/' + picId + '.png">' +
                '<input type="checkbox" class="checkbox" name="checkbox-store-' + item.storeID + '" id="checkbox-store-' + item.storeID + '">' +
                '</label>'
            )
        }
    });
    removeIconFromCheckbox();
}

function removeIconFromCheckbox() {
    $(".checkbox").checkboxradio({
        icon: false
    });
}

function searchWithFilter() {
    closeNav();
    clearApp();
    storeFilter = getStoreFilter();
    priceFilter = pricePlaceholder,
        sortFilter = getSortFilters();
    pageNumber = 0;
    getData();
}

function getSortFilters() {
    return '&sortBy=' + $('.filter-sortBy .ui-state-active input').val()
}

function getStoreFilter() {
    var checkedStores = [];
    var filterString = '';
    for (var i = 0; i <= allStores.length; i++) {
        if ($('#checkbox-store-' + i.toString()).is(":checked"))
            checkedStores.push(i)
    }
    if (checkedStores.length)
        filterString = '&storeID=' + checkedStores.join(',')
    else
        filterString = '';

    return filterString;
}

function searchTitle() {
    clearApp();
    var titFilter = '&title=' + $("#titleSearch").val();
    pageNumber = 0;
    titleFilter = titFilter;
    getData();
}

function clearApp() {
    loadMore = true;
    $(".popUp").hide();
    $(".item-list").empty();
    $(".loadersmall").show();
    $('.end-txt').hide();
}


function loadMoreEntrys() {
    if (scrollLoad && (Math.floor($(window).scrollTop()) == $(document).height() - $(window).height()) || (Math.ceil($(window).scrollTop()) == $(document).height() - $(window).height())) {
        scrollLoad = false;
        if (loadMore) {
            $(".loadersmall").show();
            pageNumber++;
            getData();
        } else {
            $('.end-txt').show();
        }
    }
}

$(window).scroll(function() {
    loadMoreEntrys();
});

$(document.body).on('touchmove', loadMoreEntrys);


function initRange() {
    $(function() {
        $("#slider-range").slider({
            range: true,
            min: 0,
            max: 50,
            values: [0, 50],
            slide: function(event, ui) {
                var maxPrice = ui.values[1]
                if (maxPrice == 50)
                    maxPrice = '50 and over'
                $("#amount").html(currency + "" + ui.values[0] + " - " + currency + "" + maxPrice);
                pricePlaceholder = '&lowerPrice=' + ui.values[0] + '&upperPrice=' + ui.values[1];
            }
        });
        $("#amount").html(currency + "" + $("#slider-range").slider("values", 0) +
            " - " + currency + '50 and over');
    });
}

function overlayOn() {
    document.getElementById("overlay").style.display = "block";
    $('body').css("overflow", "hidden");
}

function overlayOff() {
    document.getElementById("overlay").style.display = "none";
    $('body').css("overflow", "auto");
}

$(document).keyup(function(event) {
    if ($("#titleSearch").is(":focus") && event.key == "Enter") {
        searchTitle();
    }
});

function showNoItemsFound() {
    $('.noGamesMsg').remove();
    $('.item-list').append("<dt class='noGamesMsg' style='text-align:center;'>No games found!</dt>")
}

function showNoFavsFound() {
    $('.item-list').append("<dt style='text-align:center;padding-top: 50px;'>No favorites added yet!</dt>")
}
