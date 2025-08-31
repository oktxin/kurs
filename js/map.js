ymaps.ready(init);
function init() {
    var myMap = new ymaps.Map("map", {
        center: [53.8945, 27.5477], 
        zoom: 15
    });

    var myPlacemark = new ymaps.Placemark([53.8945, 27.5477], {
        hintContent: t('map.hintContent'),
        balloonContent: t('map.balloonContent')
    });

    myMap.geoObjects.add(myPlacemark);
}